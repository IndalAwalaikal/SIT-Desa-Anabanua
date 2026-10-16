package notifikasi

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/pkg/apputil"
)

// UserReader provides read access to user records so the notification
// service can broadcast to a role (e.g. all admins).
type UserReader interface {
	ListAll(ctx context.Context) ([]domain.User, error)
}

type Repository interface {
	Create(ctx context.Context, n domain.Notifikasi) error
	ListByUser(ctx context.Context, userID string, limit int) ([]domain.Notifikasi, error)
	MarkAsRead(ctx context.Context, id string, userID string) error
	MarkAllAsRead(ctx context.Context, userID string) error
	CountUnread(ctx context.Context, userID string) (int, error)
}

type Service struct {
	repo  Repository
	users UserReader
	mu    sync.RWMutex
	subs  map[string]map[chan domain.Notifikasi]bool
}

func NewService(repo Repository, users UserReader) *Service {
	return &Service{
		repo:  repo,
		users: users,
		subs:  make(map[string]map[chan domain.Notifikasi]bool),
	}
}

func (s *Service) Subscribe(userID string) (chan domain.Notifikasi, func()) {
	s.mu.Lock()
	defer s.mu.Unlock()

	ch := make(chan domain.Notifikasi, 10)
	if s.subs[userID] == nil {
		s.subs[userID] = make(map[chan domain.Notifikasi]bool)
	}
	s.subs[userID][ch] = true

	cleanup := func() {
		s.mu.Lock()
		defer s.mu.Unlock()
		delete(s.subs[userID], ch)
		if len(s.subs[userID]) == 0 {
			delete(s.subs, userID)
		}
		close(ch)
	}

	return ch, cleanup
}

func (s *Service) Create(ctx context.Context, n domain.Notifikasi) error {
	n.CreatedAt = time.Now()
	if n.ID == "" {
		n.ID = apputil.NewID()
	}
	err := s.repo.Create(ctx, n)
	if err != nil {
		return err
	}

	// Broadcast to active SSE subscribers
	s.mu.RLock()
	chMap, ok := s.subs[n.UserID]
	if ok {
		for ch := range chMap {
			select {
			case ch <- n:
			default:
				// Discard if client channel is blocked/full to prevent service deadlock
			}
		}
	}
	s.mu.RUnlock()

	return nil
}

func (s *Service) ListByUser(ctx context.Context, userID string) ([]domain.Notifikasi, error) {
	return s.repo.ListByUser(ctx, userID, 50)
}

func (s *Service) MarkAsRead(ctx context.Context, id string, userID string) error {
	return s.repo.MarkAsRead(ctx, id, userID)
}

func (s *Service) MarkAllAsRead(ctx context.Context, userID string) error {
	return s.repo.MarkAllAsRead(ctx, userID)
}

func (s *Service) CountUnread(ctx context.Context, userID string) (int, error) {
	return s.repo.CountUnread(ctx, userID)
}

// BroadcastToAdmins creates a notification in the database for every admin
// user and simultaneously pushes it to any admins currently subscribed via
// SSE.  This is best-effort: if the user list query fails we log and return
// the error so the caller can decide whether to continue.
//
// Used by usecase services (berita, galeri, pengaduan) to notify admins of
// new public submissions.
func (s *Service) BroadcastToAdmins(ctx context.Context, title, message, link string) error {
	users, err := s.users.ListAll(ctx)
	if err != nil {
		return err
	}

	notifType := "info"
	for _, u := range users {
		n := domain.Notifikasi{
			ID:        apputil.NewID(),
			UserID:    u.ID,
			Title:     title,
			Message:   message,
			Type:      notifType,
			Link:      &link,
			IsRead:    false,
			CreatedAt: time.Now(),
		}
		if cerr := s.repo.Create(ctx, n); cerr != nil {
			slog.Warn("failed to persist admin broadcast notification",
				"userID", u.ID, "error", cerr)
		}

		// Push to active SSE subscribers.
		s.mu.RLock()
		if chMap, ok := s.subs[u.ID]; ok {
			for ch := range chMap {
				select {
				case ch <- n:
				default:
					// drop if channel full — subscriber will get it from DB on reconnect
				}
			}
		}
		s.mu.RUnlock()
	}

	return nil
}
