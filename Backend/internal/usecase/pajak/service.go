package pajak

import (
	"context"
	"strings"
	"time"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/pkg/apputil"
)

// Service berisi seluruh use case Transparansi Pajak Desa.
type Service struct{ repo Repository }

func NewService(repo Repository) *Service { return &Service{repo: repo} }

func validName(s string, min, max int) bool {
	n := len(strings.TrimSpace(s))
	return n >= min && n <= max
}

// ---- Master jenis pajak ----

func (s *Service) ListJenisPajak(ctx context.Context, onlyAktif bool) ([]domain.JenisPajak, error) {
	items, err := s.repo.ListJenisPajak(ctx, onlyAktif)
	if items == nil {
		items = []domain.JenisPajak{}
	}
	return items, err
}

func (s *Service) SaveJenisPajak(ctx context.Context, id string, jp domain.JenisPajak) (domain.JenisPajak, error) {
	jp.Kode = strings.ToUpper(strings.TrimSpace(jp.Kode))
	jp.Nama = strings.TrimSpace(jp.Nama)
	if !validName(jp.Kode, 2, 40) || !validName(jp.Nama, 2, 150) {
		return jp, domain.ErrValidation
	}
	if jp.Kategori == "" {
		jp.Kategori = "lainnya"
	}
	if jp.Periode == "" {
		jp.Periode = "TAHUNAN"
	}
	jp.Satuan = strings.TrimSpace(jp.Satuan)

	if id != "" {
		cur, err := s.repo.GetJenisPajak(ctx, id)
		if err != nil {
			return jp, err
		}
		cur.Kode, cur.Nama = jp.Kode, jp.Nama
		cur.Kategori, cur.Satuan = jp.Kategori, jp.Satuan
		cur.Periode, cur.Aktif = jp.Periode, jp.Aktif
		return cur, s.repo.UpdateJenisPajak(ctx, cur)
	}

	exists, err := s.repo.ListJenisPajak(ctx, false)
	if err != nil {
		return jp, err
	}
	for _, e := range exists {
		if e.Kode == jp.Kode {
			return jp, domain.ErrConflict
		}
	}
	jp.ID = apputil.NewID()
	jp.Aktif = true
	return jp, s.repo.CreateJenisPajak(ctx, jp)
}

func (s *Service) DeleteJenisPajak(ctx context.Context, id string) error {
	dipakai, err := s.repo.JenisPajakDipakai(ctx, id)
	if err != nil {
		return err
	}
	if dipakai {
		return domain.ErrConflict
	}
	return s.repo.DeleteJenisPajak(ctx, id)
}

// ---- Wajib pajak ----

func (s *Service) ListWajibPajak(ctx context.Context, f WajibPajakFilter) ([]domain.WajibPajak, int, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 {
		f.Limit = 20
	}
	if f.Limit > 100 {
		f.Limit = 100
	}
	items, total, err := s.repo.ListWajibPajak(ctx, f)
	if items == nil {
		items = []domain.WajibPajak{}
	}
	return items, total, err
}

func (s *Service) GetWajibPajak(ctx context.Context, id string) (domain.WajibPajak, error) {
	return s.repo.GetWajibPajak(ctx, id)
}

func (s *Service) SaveWajibPajak(ctx context.Context, id string, wp domain.WajibPajak) (domain.WajibPajak, error) {
	wp.Nama = strings.TrimSpace(wp.Nama)
	wp.NoObjek = strings.TrimSpace(wp.NoObjek)
	wp.NIK = strings.TrimSpace(wp.NIK)
	wp.Dusun = strings.TrimSpace(wp.Dusun)
	if !validName(wp.Nama, 2, 150) {
		return wp, domain.ErrValidation
	}

	if id != "" {
		cur, err := s.repo.GetWajibPajak(ctx, id)
		if err != nil {
			return wp, err
		}
		if wp.NIK != "" && !nikBebas(ctx, s, wp.NIK, id) {
			return wp, domain.ErrConflict
		}
		cur.NoObjek, cur.Nama, cur.NIK = wp.NoObjek, wp.Nama, wp.NIK
		cur.Alamat, cur.RT, cur.RW, cur.Dusun = wp.Alamat, wp.RT, wp.RW, wp.Dusun
		cur.UserID = wp.UserID
		return cur, s.repo.UpdateWajibPajak(ctx, cur)
	}

	if wp.NIK != "" && !nikBebas(ctx, s, wp.NIK, "") {
		return wp, domain.ErrConflict
	}
	wp.ID = apputil.NewID()
	return wp, s.repo.CreateWajibPajak(ctx, wp)
}

func nikBebas(ctx context.Context, s *Service, nik, skipID string) bool {
	items, _, err := s.repo.ListWajibPajak(ctx, WajibPajakFilter{Limit: 100})
	if err != nil {
		return true
	}
	for _, w := range items {
		if w.NIK == nik && w.ID != skipID {
			return false
		}
	}
	return true
}

func (s *Service) DeleteWajibPajak(ctx context.Context, id string) error {
	dipakai, err := s.repo.WajibPajakDipakai(ctx, id)
	if err != nil {
		return err
	}
	if dipakai {
		return domain.ErrConflict
	}
	return s.repo.DeleteWajibPajak(ctx, id)
}

// ---- Transaksi ----

// ListTransaksi menampilkan daftar transaksi pajak. Handler yang akan
// menyembunyikan data pribadi (NIK) untuk tampilan publik.
func (s *Service) ListTransaksi(ctx context.Context, f TransaksiFilter) ([]domain.TransaksiPajak, int, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 {
		f.Limit = 20
	}
	if f.Limit > 100 {
		f.Limit = 100
	}
	items, total, err := s.repo.ListTransaksi(ctx, f)
	if items == nil {
		items = []domain.TransaksiPajak{}
	}
	return items, total, err
}

func (s *Service) GetTransaksiByNomor(ctx context.Context, nomor string) (domain.TransaksiPajak, error) {
	return s.repo.GetTransaksiByNomor(ctx, strings.ToUpper(strings.TrimSpace(nomor)))
}

func (s *Service) GetTransaksiBySetoran(ctx context.Context, setoranID string) ([]domain.TransaksiPajak, error) {
	items, err := s.repo.GetTransaksiBySetoran(ctx, setoranID)
	if items == nil {
		items = []domain.TransaksiPajak{}
	}
	return items, err
}

func (s *Service) ListAudit(ctx context.Context, refTipe, refID string) ([]domain.AuditLogPajak, error) {
	items, err := s.repo.ListAudit(ctx, refTipe, refID)
	if items == nil {
		items = []domain.AuditLogPajak{}
	}
	return items, err
}

// TransaksiInput adalah payload pencatatan pembayaran pajak baru.
type TransaksiInput struct {
	JenisPajakID string
	WajibPajakID string
	Tahun        int
	Periode      string
	Nominal      float64
	TanggalBayar time.Time
	Catatan      string
}

func (s *Service) CreateTransaksi(ctx context.Context, actorID string, in TransaksiInput) (domain.TransaksiPajak, error) {
	if strings.TrimSpace(in.JenisPajakID) == "" || strings.TrimSpace(in.WajibPajakID) == "" || in.Nominal <= 0 {
		return domain.TransaksiPajak{}, domain.ErrValidation
	}
	if in.Tahun < 2000 {
		in.Tahun = time.Now().Year()
	}
	if in.TanggalBayar.IsZero() {
		in.TanggalBayar = time.Now()
	}

	jp, err := s.repo.GetJenisPajak(ctx, in.JenisPajakID)
	if err != nil {
		return domain.TransaksiPajak{}, err
	}
	if !jp.Aktif {
		return domain.TransaksiPajak{}, domain.ErrInvalidState
	}
	if _, err := s.repo.GetWajibPajak(ctx, in.WajibPajakID); err != nil {
		return domain.TransaksiPajak{}, err
	}

	count, err := s.repo.CountTransaksiTahun(ctx, in.Tahun)
	if err != nil {
		return domain.TransaksiPajak{}, err
	}

	now := time.Now()
	trx := domain.TransaksiPajak{
		ID:           apputil.NewID(),
		NomorBukti:   nomorUrut("PK", in.Tahun, count+1),
		JenisPajakID: in.JenisPajakID,
		WajibPajakID: in.WajibPajakID,
		Tahun:        in.Tahun,
		Periode:      in.Periode,
		Nominal:      in.Nominal,
		TanggalBayar: in.TanggalBayar,
		Status:       domain.StatusPajakTercatat,
		Catatan:      in.Catatan,
		PencatatID:   actorID,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	audit := domain.AuditLogPajak{
		ID: apputil.NewID(), RefTipe: "TRANSAKSI", RefID: trx.ID,
		Perubahan: "BUAT", StatusBaru: string(trx.Status), UserID: actorID, CreatedAt: now,
	}
	if err := s.repo.CreateTransaksi(ctx, trx, audit); err != nil {
		return domain.TransaksiPajak{}, err
	}
	return s.repo.GetTransaksi(ctx, trx.ID)
}

// UpdateStatusTransaksi menjalankan transisi status yang sah: verifikasi atau
// pembatalan. Pindah ke "disetor"/"dikonfirmasi_bpd" hanya lewat setoran.
func (s *Service) UpdateStatusTransaksi(ctx context.Context, actorID, id, target, catatan string) (domain.TransaksiPajak, error) {
	cur, err := s.repo.GetTransaksi(ctx, id)
	if err != nil {
		return cur, err
	}
	next := domain.StatusTransaksiPajak(target)
	if !next.Valid() {
		return cur, domain.ErrValidation
	}
	if next == cur.Status {
		return cur, nil
	}
	if !cur.Status.CanTo(next) {
		return cur, domain.ErrInvalidState
	}
	if next != domain.StatusPajakDiverifikasi && next != domain.StatusPajakDibatalkan {
		return cur, domain.ErrInvalidState
	}
	if next == domain.StatusPajakDibatalkan && strings.TrimSpace(catatan) == "" {
		return cur, domain.ErrValidation
	}

	oldStatus := cur.Status
	now := time.Now()
	cur.Status = next
	cur.UpdatedAt = now
	if next == domain.StatusPajakDiverifikasi {
		cur.VerifikatorID = actorID
		cur.TglVerifikasi = &now
	} else {
		cur.CatatanBatal = strings.TrimSpace(catatan)
	}

	label := "BATAL"
	if next == domain.StatusPajakDiverifikasi {
		label = "VERIFIKASI"
	}
	audit := domain.AuditLogPajak{
		ID: apputil.NewID(), RefTipe: "TRANSAKSI", RefID: cur.ID,
		Perubahan: label, StatusLama: string(oldStatus), StatusBaru: string(next),
		Catatan: strings.TrimSpace(catatan), UserID: actorID, CreatedAt: now,
	}
	if err := s.repo.UpdateStatusTransaksi(ctx, cur, audit); err != nil {
		return cur, err
	}
	return cur, nil
}