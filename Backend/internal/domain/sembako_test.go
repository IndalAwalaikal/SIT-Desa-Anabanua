package domain

import (
	"testing"
	"time"
)

func TestSembakoPeriodStatus(t *testing.T) {
	mulai := time.Date(2026, 8, 10, 0, 0, 0, 0, time.UTC)
	selesai := time.Date(2026, 8, 25, 0, 0, 0, 0, time.UTC)
	p := SembakoPeriod{TanggalMulai: mulai, TanggalSelesai: &selesai}

	cases := []struct {
		now  time.Time
		want string
	}{
		{mulai.AddDate(0, 0, -1), "upcoming"},
		{mulai, "ongoing"},                         // hari pertama
		{selesai.Add(-time.Nanosecond), "ongoing"},// tepat sebelum selesai
		{selesai, "ongoing"},                      // tanggal selesai masih inklusif
		{selesai.AddDate(0, 0, 1), "completed"},   // keesokan harinya selesai
		{mulai.AddDate(1, 0, 0), "completed"},
	}
	for _, c := range cases {
		if got := p.Status(c.now); got != c.want {
			t.Errorf("Status(%v) = %q; want %q", c.now.Format("2006-01-02"), got, c.want)
		}
	}

	// Tanpa tanggal_selesai: ongoing selamanya setelah mulai.
	open := SembakoPeriod{TanggalMulai: mulai}
	if got := open.Status(mulai.AddDate(5, 0, 0)); got != "ongoing" {
		t.Errorf("open-ended Status = %q; want ongoing", got)
	}
}
