// Package usecase is the composition root for all use case services. Handlers
// depend only on this struct; wiring of concrete repositories happens in
// cmd/api/main.go via the sub-package constructors.
package usecase

import (
	asecase "desa-anabanua-api/internal/usecase/auth"
	"desa-anabanua-api/internal/usecase/berita"
	"desa-anabanua-api/internal/usecase/desa"
	"desa-anabanua-api/internal/usecase/finance"
	"desa-anabanua-api/internal/usecase/galeri"
	"desa-anabanua-api/internal/usecase/notifikasi"
	"desa-anabanua-api/internal/usecase/pajak"
	"desa-anabanua-api/internal/usecase/pengaduan"
	"desa-anabanua-api/internal/usecase/pengunjung"
	"desa-anabanua-api/internal/usecase/persuratan"
	"desa-anabanua-api/internal/usecase/sekilas_info"
	"desa-anabanua-api/internal/usecase/sembako"
	"desa-anabanua-api/internal/usecase/umkm"
	ucuser "desa-anabanua-api/internal/usecase/user"
)

// App bundles every use case service; handlers call methods through these
// fields (e.g. h.app.Auth.Login(...)).
type App struct {
	Auth        *asecase.Service
	Berita      *berita.Service
	Persuratan  *persuratan.Service
	Pengaduan   *pengaduan.Service
	Desa        *desa.Service
	Finance     *finance.Service
	Galeri      *galeri.Service
	Umkm        *umkm.Service
	User        *ucuser.Service
	Pajak       *pajak.Service
	Notifikasi  *notifikasi.Service
	SekilasInfo *sekilasinfo.Service
	Sembako     *sembako.Service
	Pengunjung  *pengunjung.Service
}

func New(
	auth *asecase.Service,
	b *berita.Service,
	pers *persuratan.Service,
	aduan *pengaduan.Service,
	ds *desa.Service,
	f *finance.Service,
	g *galeri.Service,
	u *umkm.Service,
	us *ucuser.Service,
	p *pajak.Service,
	notif *notifikasi.Service,
	sek *sekilasinfo.Service,
	sbk *sembako.Service,
	pengunjungSvc *pengunjung.Service,
) *App {
	return &App{
		Auth: auth, Berita: b, Persuratan: pers, Pengaduan: aduan, Desa: ds,
		Finance: f, Galeri: g, Umkm: u, User: us, Pajak: p, Notifikasi: notif,
		SekilasInfo: sek, Sembako: sbk, Pengunjung: pengunjungSvc,
	}
}
