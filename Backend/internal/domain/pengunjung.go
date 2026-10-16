package domain

// PengunjungHarian aggregates unique visitors and total page views for a single day.
type PengunjungHarian struct {
	Tanggal    string // yyyy-mm-dd
	Pengunjung int    // pengunjung unik (berdasarkan hash IP) pada hari tersebut
	Kunjungan  int    // total tampilan halaman pada hari tersebut
}

// PengunjungStats is the public-facing summary of site visitors.
type PengunjungStats struct {
	HariIni         PengunjungHarian
	Terakhir7       []PengunjungHarian // 7 hari terakhir termasuk hari ini, urut paling lama -> terbaru
	TotalPengunjung int
	TotalKunjungan  int
}
