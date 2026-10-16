package pajak

import (
	"context"
	"fmt"
	"strings"
	"time"

	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/pkg/apputil"
)

// nomorUrut membentuk nomor bukti/setoran tahunan, mis. PK-2026-00042.
func nomorUrut(prefix string, tahun, seq int) string {
	return fmt.Sprintf("%s-%d-%05d", prefix, tahun, seq)
}

// ---- Setoran ke BPD/pihak terkait ----

// SetoranInput adalah payload pembuatan setoran batch.
type SetoranInput struct {
	Tujuan       string
	TanggalSetor time.Time
	Catatan      string
	TransaksiIDs []string
}

func (s *Service) ListSetoran(ctx context.Context, tahun int) ([]domain.SetoranPajak, error) {
	items, err := s.repo.ListSetoran(ctx, tahun)
	if items == nil {
		items = []domain.SetoranPajak{}
	}
	return items, err
}

func (s *Service) GetSetoran(ctx context.Context, id string) (domain.SetoranPajak, error) {
	return s.repo.GetSetoran(ctx, id)
}

// CreateSetoran membuat batch setoran dari transaksi yang sudah diverifikasi.
// Semua transaksi berpindah status tercatat → "disetor" secara atomik.
func (s *Service) CreateSetoran(ctx context.Context, actorID, actorNama string, in SetoranInput) (domain.SetoranPajak, error) {
	if strings.TrimSpace(in.Tujuan) == "" || len(in.TransaksiIDs) == 0 {
		return domain.SetoranPajak{}, domain.ErrValidation
	}
	if in.TanggalSetor.IsZero() {
		in.TanggalSetor = time.Now()
	}

	detil := []SetoranDetil{}
	var total float64
	going := map[string]bool{}
	for _, id := range in.TransaksiIDs {
		if going[id] {
			continue
		}
		going[id] = true
		t, err := s.repo.GetTransaksi(ctx, id)
		if err != nil {
			return domain.SetoranPajak{}, err
		}
		if t.Status != domain.StatusPajakDiverifikasi {
			return domain.SetoranPajak{}, domain.ErrInvalidState
		}
		total += t.Nominal
		detil = append(detil, SetoranDetil{Transaksi: t})
	}

	if len(detil) == 0 {
		return domain.SetoranPajak{}, domain.ErrValidation
	}

	now := time.Now()
	count, err := s.repo.CountSetoranTahun(ctx, in.TanggalSetor.Year())
	if err != nil {
		return domain.SetoranPajak{}, err
	}
	setoran := domain.SetoranPajak{
		ID:           apputil.NewID(),
		NomorSetoran: nomorUrut("ST", in.TanggalSetor.Year(), count+1),
		Tujuan:       strings.TrimSpace(in.Tujuan),
		TanggalSetor: in.TanggalSetor,
		TotalSetor:   total,
		Status:       domain.StatusSetoranDisetor,
		DisetorOleh:  actorNama,
		Catatan:      strings.TrimSpace(in.Catatan),
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Rapikan seluruh detil: setiap transaksi → "disetor".
	for i := range detil {
		detil[i].Transaksi.SetoranID = setoran.ID
		detil[i].Transaksi.Status = domain.StatusPajakDisetor
		detil[i].Transaksi.UpdatedAt = now
		detil[i].Audit = domain.AuditLogPajak{
			ID: apputil.NewID(), RefTipe: "TRANSAKSI", RefID: detil[i].Transaksi.ID,
			Perubahan: "SETOR", StatusLama: "diverifikasi", StatusBaru: "disetor",
			UserID: actorID, CreatedAt: now,
		}
	}

	if err := s.repo.CreateSetoran(ctx, setoran, detil); err != nil {
		return domain.SetoranPajak{}, err
	}
	s.repo.AppendAudit(ctx, domain.AuditLogPajak{
		ID: apputil.NewID(), RefTipe: "SETORAN", RefID: setoran.ID,
		Perubahan: "BUAT", StatusBaru: string(setoran.Status), UserID: actorID, CreatedAt: now,
	})
	return s.repo.GetSetoran(ctx, setoran.ID)
}

// KonfirmasiSetoran mencatat penerimaan setoran oleh BPD/pihak terkait
// (dikonfirmasi oleh admin berdasarkan bukti fisik).
func (s *Service) KonfirmasiSetoran(ctx context.Context, actorID, id, nomorPenerimaan, diterimaOleh, catatan string) (domain.SetoranPajak, error) {
	cur, err := s.repo.GetSetoran(ctx, id)
	if err != nil {
		return cur, err
	}
	if cur.Status != domain.StatusSetoranDisetor {
		return cur, domain.ErrInvalidState
	}
	if strings.TrimSpace(nomorPenerimaan) == "" {
		return cur, domain.ErrValidation
	}

	now := time.Now()
	cur.Status = domain.StatusSetoranDikonfirmasi
	cur.NomorBuktiPenerimaan = strings.TrimSpace(nomorPenerimaan)
	cur.DiterimaOleh = strings.TrimSpace(diterimaOleh)
	cur.TglKonfirmasi = &now
	cur.Catatan = strings.TrimSpace(catatan)
	cur.UpdatedAt = now

	transaksis, err := s.repo.GetTransaksiBySetoran(ctx, id)
	if err != nil {
		return cur, err
	}
	detil := make([]SetoranDetil, 0, len(transaksis))
	for i := range transaksis {
		transaksis[i].Status = domain.StatusPajakDikonfirmasi
		transaksis[i].UpdatedAt = now
		detil = append(detil, SetoranDetil{
			Transaksi: transaksis[i],
			Audit: domain.AuditLogPajak{
				ID: apputil.NewID(), RefTipe: "TRANSAKSI", RefID: transaksis[i].ID,
				Perubahan: "KONFIRMASI", StatusLama: "disetor", StatusBaru: "dikonfirmasi_bpd",
				UserID: actorID, CreatedAt: now,
			},
		})
	}

	if err := s.repo.ConfirmSetoran(ctx, cur, detil); err != nil {
		return cur, err
	}
	return cur, nil
}

func (s *Service) SetBuktiSetoran(ctx context.Context, id, url string) error {
	if strings.TrimSpace(url) == "" {
		return domain.ErrValidation
	}
	return s.repo.SetSetoranBukti(ctx, id, url)
}

// ---- Ringkasan ----

func (s *Service) Ringkasan(ctx context.Context, tahun int) (domain.RingkasanPajak, error) {
	if tahun < 2000 {
		tahun = time.Now().Year()
	}
	return s.repo.Ringkasan(ctx, tahun)
}