// Package persuratan implements layanan (jenis surat) and pengajuan use cases.
package persuratan

import (
	"context"
	"io"

	"desa-anabanua-api/internal/domain"
)

// JenisSuratRepository persists the letter-type master data.
type JenisSuratRepository interface {
	List(ctx context.Context, includeInactive bool) ([]domain.JenisSurat, error)
	GetByKode(ctx context.Context, kode string) (domain.JenisSurat, error)
	Create(ctx context.Context, j domain.JenisSurat) error
	Update(ctx context.Context, j domain.JenisSurat) error
	Delete(ctx context.Context, kode string) error
}

// PendudukRepository provides read/write access to Master Data Penduduk.
type PendudukRepository interface {
	GetByNIK(ctx context.Context, nik string) (domain.Penduduk, error)
	GetByNoKK(ctx context.Context, noKK string) ([]domain.Penduduk, error)
	Upsert(ctx context.Context, p domain.Penduduk) error
}

// PengajuanRepository persists letter requests, their attachments and history.
type PengajuanRepository interface {
	Create(ctx context.Context, p domain.PengajuanSurat, lampiran []domain.LampiranFile) error
	GetByNomorResi(ctx context.Context, resi string) (domain.PengajuanSurat, error)
	GetByID(ctx context.Context, id string) (domain.PengajuanSurat, error)
	GetByIDForUpdate(ctx context.Context, id string) (domain.PengajuanSurat, error)
	GetByQRVerificationCode(ctx context.Context, code string) (domain.PengajuanSurat, error)
	ListByPemohon(ctx context.Context, pemohonID string) ([]domain.PengajuanSurat, error)
	ListByPemohonPage(ctx context.Context, pemohonID string, page, limit int) ([]domain.PengajuanSurat, int, error)
	ListAll(ctx context.Context, status string) ([]domain.PengajuanSurat, error)
	ListPage(ctx context.Context, status, search, sort string, page, limit int) ([]domain.PengajuanSurat, int, error)
	CountByStatus(ctx context.Context) (map[string]int, error)
	UpdateStatus(ctx context.Context, id string, status domain.StatusPengajuan, catatan, changedBy *string) error
	AddRiwayat(ctx context.Context, pengajuanID string, r domain.RiwayatStatus) error
	SetDokumenHasil(ctx context.Context, id string, d domain.DokumenHasilSurat) error
	UpdateWorkflowStep(ctx context.Context, pengajuanID string, stepOrder int, status string, actorID *string, catatan *string) error
	SetFinalPDFAndQR(ctx context.Context, id string, nomorResmi string, pdfURL string, qrCode string) error
	Delete(ctx context.Context, id string) error
}

// TxManager makes multi-step status transitions atomic without coupling the
// use case to the MySQL implementation.
type TxManager interface {
	WithinTx(ctx context.Context, fn func(context.Context) error) error
}

// FileStorage stores uploaded attachments and returns their public URL.
type FileStorage interface {
	Save(ctx context.Context, folder string, file io.Reader, filename string) (string, error)
	Open(ctx context.Context, url string) (io.ReadCloser, error)
	Delete(ctx context.Context, url string) error
}

// UserReader resolves a user by ID (used to fetch the applicant's email for
// surat-finished notifications without coupling to the auth repository).
type UserReader interface {
	GetByID(ctx context.Context, id string) (domain.User, error)
}

// EmailSender delivers outbound email (Mailjet or noop). Defined here so the
// persuratan use case stays decoupled from the email infrastructure package.
type EmailSender interface {
	Send(ctx context.Context, to, subject, htmlBody string) error
}

// WhatsAppSender delivers outbound WhatsApp messages (FlowKirim or noop).
type WhatsAppSender interface {
	Send(ctx context.Context, to, text string) error
}

// NotifikasiRepository manages system notifications.
type NotifikasiRepository interface {
	Create(ctx context.Context, n domain.Notifikasi) error
}

// PerangkatReader resolves village apparatus data (used to fetch the current
// kepala desa signature block without coupling the persuratan use case to the
// desa infrastructure package).
type PerangkatReader interface {
	List(ctx context.Context) ([]domain.PerangkatDesa, error)
}
