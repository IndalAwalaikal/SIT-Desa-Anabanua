// Package pajak mengimplementasikan use case Transparansi Pajak Desa.
// Alur: warga membayar → desa mencatat → diverifikasi → disetorkan ke
// BPD/pihak terkait → dikonfirmasi. Setiap langkah tercatat dalam audit log.
package pajak

import (
	"context"

	"desa-anabanua-api/internal/domain"
)

// TransaksiFilter menyaring daftar transaksi pajak.
type TransaksiFilter struct {
	Tahun        int
	JenisPajakID string
	Status       string
	Search       string
	Page, Limit  int
	UserID       string // filter via wajib_pajak.user_id (riwayat "pajak saya")
	IncludeBatal bool
	SortBy       string
	SortOrder    string
}

// WajibPajakFilter menyaring daftar wajib pajak.
type WajibPajakFilter struct {
	Search      string
	Page, Limit int
}

// Repository adalah satu kontrak penyimpanan untuk seluruh sub-entitas pajak.
// Metode yang mengubah beberapa baris sekaligus (create setoran, konfirmasi,
// ganti status) bersifat atomik di dalam implementasinya.
type Repository interface {
	// ---- Master jenis pajak ----
	ListJenisPajak(ctx context.Context, onlyAktif bool) ([]domain.JenisPajak, error)
	GetJenisPajak(ctx context.Context, id string) (domain.JenisPajak, error)
	CreateJenisPajak(ctx context.Context, jp domain.JenisPajak) error
	UpdateJenisPajak(ctx context.Context, jp domain.JenisPajak) error
	DeleteJenisPajak(ctx context.Context, id string) error
	JenisPajakDipakai(ctx context.Context, id string) (bool, error)

	// ---- Wajib pajak ----
	ListWajibPajak(ctx context.Context, f WajibPajakFilter) ([]domain.WajibPajak, int, error)
	GetWajibPajak(ctx context.Context, id string) (domain.WajibPajak, error)
	CountWajibPajakByNIK(ctx context.Context, nik string) (int, error)
	CreateWajibPajak(ctx context.Context, wp domain.WajibPajak) error
	UpdateWajibPajak(ctx context.Context, wp domain.WajibPajak) error
	DeleteWajibPajak(ctx context.Context, id string) error
	WajibPajakDipakai(ctx context.Context, id string) (bool, error)

	// ---- Transaksi ----
	CountTransaksiTahun(ctx context.Context, tahun int) (int, error)
	ListTransaksi(ctx context.Context, f TransaksiFilter) ([]domain.TransaksiPajak, int, error)
	GetTransaksi(ctx context.Context, id string) (domain.TransaksiPajak, error)
	GetTransaksiByNomor(ctx context.Context, nomor string) (domain.TransaksiPajak, error)
	CreateTransaksi(ctx context.Context, t domain.TransaksiPajak, audit domain.AuditLogPajak) error
	UpdateStatusTransaksi(ctx context.Context, t domain.TransaksiPajak, audit domain.AuditLogPajak) error

	// ---- Setoran ----
	CountSetoranTahun(ctx context.Context, tahun int) (int, error)
	ListSetoran(ctx context.Context, tahun int) ([]domain.SetoranPajak, error)
	GetSetoran(ctx context.Context, id string) (domain.SetoranPajak, error)
	CreateSetoran(ctx context.Context, s domain.SetoranPajak, detil []SetoranDetil) error
	ConfirmSetoran(ctx context.Context, s domain.SetoranPajak, detil []SetoranDetil) error
	SetSetoranBukti(ctx context.Context, id, url string) error
	GetTransaksiBySetoran(ctx context.Context, setoranID string) ([]domain.TransaksiPajak, error)

	// ---- Audit ----
	ListAudit(ctx context.Context, refTipe, refID string) ([]domain.AuditLogPajak, error)
	AppendAudit(ctx context.Context, a domain.AuditLogPajak) error

	// ---- Ringkasan / agregasi ----
	Ringkasan(ctx context.Context, tahun int) (domain.RingkasanPajak, error)
}

// SetoranDetil membawa transaksi yang termuat dalam sebuah setoran beserta
// audit log individualnya.
type SetoranDetil struct {
	Transaksi domain.TransaksiPajak
	Audit     domain.AuditLogPajak
}
