package domain

import "time"

// SembakoPeriod merepresentasikan satu periode pembagian sembako (bansos).
// Status (berjalan/selesai/dijadwalkan) tidak disimpan di DB — diturunkan
// dari tanggal saat dibaca sehingga tidak pernah basi.
type SembakoPeriod struct {
	ID             string        `json:"id"`
	Nama           string        `json:"nama"`
	Periode        string        `json:"periode"`
	TanggalMulai   time.Time     `json:"tanggalMulai"`
	TanggalSelesai *time.Time    `json:"tanggalSelesai,omitempty"`
	TargetPenerima *int          `json:"targetPenerima,omitempty"`
	Lokasi         *string       `json:"lokasi,omitempty"`
	Keterangan     *string       `json:"keterangan,omitempty"`
	Items          []SembakoItem `json:"items"`
	CreatedAt      time.Time     `json:"-"`
	UpdatedAt      time.Time     `json:"-"`
}

// SembakoItem adalah satu jenis barang dalam satu periode pembagian.
type SembakoItem struct {
	ID          string  `json:"id"`
	PeriodID    string  `json:"-"`
	NamaBarang  string  `json:"namaBarang"`
	Satuan      string  `json:"satuan"`
	JumlahPerKK float64 `json:"jumlahPerKK"`
	Keterangan  *string `json:"keterangan,omitempty"`
	SortOrder   int     `json:"-"`
}

// Status periode relatif terhadap `now`: "upcoming", "ongoing", atau "completed".
func (p SembakoPeriod) Status(now time.Time) string {
	end := now
	if p.TanggalSelesai != nil {
		end = *p.TanggalSelesai
	}
	switch {
	case p.TanggalMulai.After(now):
		return "upcoming"
	case end.Before(now):
		return "completed"
	default:
		return "ongoing"
	}
}
