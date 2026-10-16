package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/pajak"
)

// ---- Master Jenis Pajak ----

func (h *Handler) PajakJenisList(w http.ResponseWriter, r *http.Request) {
	items, err := h.app.Pajak.ListJenisPajak(r.Context(), true)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, items)
}

func (h *Handler) PajakJenisAdminList(w http.ResponseWriter, r *http.Request) {
	items, err := h.app.Pajak.ListJenisPajak(r.Context(), false)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, items)
}

func (h *Handler) PajakJenisSave(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var v struct {
		Kode     string `json:"kode"`
		Nama     string `json:"nama"`
		Kategori string `json:"kategori"`
		Satuan   string `json:"satuan"`
		Periode  string `json:"periode"`
		Aktif    *bool  `json:"aktif"`
	}
	if decode(r, &v) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	jp := domain.JenisPajak{
		Kode:     v.Kode,
		Nama:     v.Nama,
		Kategori: v.Kategori,
		Satuan:   v.Satuan,
		Periode:  v.Periode,
		Aktif:    true,
	}
	if v.Aktif != nil {
		jp.Aktif = *v.Aktif
	}
	res, err := h.app.Pajak.SaveJenisPajak(r.Context(), id, jp)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	status := 200
	if id == "" {
		status = 201
	}
	httpapi.JSON(w, status, res)
}

func (h *Handler) PajakJenisDelete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.app.Pajak.DeleteJenisPajak(r.Context(), id); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}

// ---- Wajib Pajak ----

func (h *Handler) PajakWajibList(w http.ResponseWriter, r *http.Request) {
	p, l := page(r)
	search := r.URL.Query().Get("search")
	items, total, err := h.app.Pajak.ListWajibPajak(r.Context(), pajak.WajibPajakFilter{
		Search: search,
		Page:   p,
		Limit:  l,
	})
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.List(w, items, p, l, total)
}

func (h *Handler) PajakWajibGet(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	wp, err := h.app.Pajak.GetWajibPajak(r.Context(), id)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, wp)
}

func (h *Handler) PajakWajibSave(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var v struct {
		UserID  string `json:"userId"`
		NoObjek string `json:"noObjek"`
		Nama    string `json:"nama"`
		NIK     string `json:"nik"`
		Alamat  string `json:"alamat"`
		RT      string `json:"rt"`
		RW      string `json:"rw"`
		Dusun   string `json:"dusun"`
	}
	if decode(r, &v) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	wp := domain.WajibPajak{
		UserID:  v.UserID,
		NoObjek: v.NoObjek,
		Nama:    v.Nama,
		NIK:     v.NIK,
		Alamat:  v.Alamat,
		RT:      v.RT,
		RW:      v.RW,
		Dusun:   v.Dusun,
	}
	res, err := h.app.Pajak.SaveWajibPajak(r.Context(), id, wp)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	status := 200
	if id == "" {
		status = 201
	}
	httpapi.JSON(w, status, res)
}

func (h *Handler) PajakWajibDelete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.app.Pajak.DeleteWajibPajak(r.Context(), id); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}

// ---- Transaksi Pajak ----

func (h *Handler) PajakTransaksiPublicList(w http.ResponseWriter, r *http.Request) {
	p, l := page(r)
	tahun, _ := strconv.Atoi(r.URL.Query().Get("tahun"))
	jenisID := r.URL.Query().Get("jenisPajakId")
	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")

	items, total, err := h.app.Pajak.ListTransaksi(r.Context(), pajak.TransaksiFilter{
		Tahun:        tahun,
		JenisPajakID: jenisID,
		Status:       status,
		Search:       search,
		Page:         p,
		Limit:        l,
		IncludeBatal: false,
	})
	if err != nil {
		httpapi.Error(w, err)
		return
	}

	// Masking NIK untuk privasi warga pada rute publik
	sanitized := make([]domain.TransaksiPajak, len(items))
	for i, item := range items {
		sanitized[i] = item
		if len(sanitized[i].NIK) > 4 {
			sanitized[i].NIK = sanitized[i].NIK[:3] + "******" + sanitized[i].NIK[len(sanitized[i].NIK)-2:]
		}
	}

	httpapi.List(w, sanitized, p, l, total)
}

func (h *Handler) PajakTransaksiAdminList(w http.ResponseWriter, r *http.Request) {
	p, l := page(r)
	tahun, _ := strconv.Atoi(r.URL.Query().Get("tahun"))
	jenisID := r.URL.Query().Get("jenisPajakId")
	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")
	includeBatal := r.URL.Query().Get("includeBatal") == "true"
	sortBy := r.URL.Query().Get("sortBy")
	sortOrder := r.URL.Query().Get("sortOrder")

	items, total, err := h.app.Pajak.ListTransaksi(r.Context(), pajak.TransaksiFilter{
		Tahun:        tahun,
		JenisPajakID: jenisID,
		Status:       status,
		Search:       search,
		Page:         p,
		Limit:        l,
		IncludeBatal: includeBatal,
		SortBy:       sortBy,
		SortOrder:    sortOrder,
	})
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.List(w, items, p, l, total)
}

func (h *Handler) PajakTransaksiGetNomor(w http.ResponseWriter, r *http.Request) {
	nomor := r.PathValue("nomorBukti")
	t, err := h.app.Pajak.GetTransaksiByNomor(r.Context(), nomor)
	if err != nil {
		httpapi.Error(w, err)
		return
	}

	// Fetch audit history & setoran context if available
	audits, _ := h.app.Pajak.ListAudit(r.Context(), "TRANSAKSI", t.ID)
	var setoran *domain.SetoranPajak
	if t.SetoranID != "" {
		s, errS := h.app.Pajak.GetSetoran(r.Context(), t.SetoranID)
		if errS == nil {
			setoran = &s
		}
	}

	httpapi.JSON(w, 200, map[string]any{
		"transaksi": t,
		"setoran":   setoran,
		"audits":    audits,
	})
}

func (h *Handler) PajakTransaksiSaya(w http.ResponseWriter, r *http.Request) {
	uID := principalID(r)
	if uID == "" {
		httpapi.Error(w, domain.ErrUnauthorized)
		return
	}
	p, l := page(r)
	items, total, err := h.app.Pajak.ListTransaksi(r.Context(), pajak.TransaksiFilter{
		UserID:       uID,
		Page:         p,
		Limit:        l,
		IncludeBatal: true,
	})
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.List(w, items, p, l, total)
}

func (h *Handler) PajakTransaksiCreate(w http.ResponseWriter, r *http.Request) {
	actorID := principalID(r)
	var v struct {
		JenisPajakID string  `json:"jenisPajakId"`
		WajibPajakID string  `json:"wajibPajakId"`
		Tahun        int     `json:"tahun"`
		Periode      string  `json:"periode"`
		Nominal      float64 `json:"nominal"`
		TanggalBayar string  `json:"tanggalBayar"`
		Catatan      string  `json:"catatan"`
	}
	if decode(r, &v) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	tgl := time.Now()
	if v.TanggalBayar != "" {
		if parsed, err := time.Parse("2006-01-02", v.TanggalBayar); err == nil {
			tgl = parsed
		} else if parsedRFC, err := time.Parse(time.RFC3339, v.TanggalBayar); err == nil {
			tgl = parsedRFC
		}
	}

	trx, err := h.app.Pajak.CreateTransaksi(r.Context(), actorID, pajak.TransaksiInput{
		JenisPajakID: v.JenisPajakID,
		WajibPajakID: v.WajibPajakID,
		Tahun:        v.Tahun,
		Periode:      v.Periode,
		Nominal:      v.Nominal,
		TanggalBayar: tgl,
		Catatan:      v.Catatan,
	})
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 201, trx)
}

func (h *Handler) PajakTransaksiStatus(w http.ResponseWriter, r *http.Request) {
	actorID := principalID(r)
	id := r.PathValue("id")
	var v struct {
		Status  string `json:"status"`
		Catatan string `json:"catatan"`
	}
	if decode(r, &v) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}

	trx, err := h.app.Pajak.UpdateStatusTransaksi(r.Context(), actorID, id, v.Status, v.Catatan)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, trx)
}

// ---- Setoran Pajak ----

func (h *Handler) PajakSetoranList(w http.ResponseWriter, r *http.Request) {
	tahun, _ := strconv.Atoi(r.URL.Query().Get("tahun"))
	items, err := h.app.Pajak.ListSetoran(r.Context(), tahun)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, items)
}

func (h *Handler) PajakSetoranGet(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	sp, err := h.app.Pajak.GetSetoran(r.Context(), id)
	if err != nil {
		httpapi.Error(w, err)
		return
	}

	transaksis, _ := h.app.Pajak.GetTransaksiBySetoran(r.Context(), id)
	audits, _ := h.app.Pajak.ListAudit(r.Context(), "SETORAN", id)

	httpapi.JSON(w, 200, map[string]any{
		"setoran":    sp,
		"transaksi":  transaksis,
		"auditTrail": audits,
	})
}

func (h *Handler) PajakSetoranCreate(w http.ResponseWriter, r *http.Request) {
	actorID := principalID(r)
	actorNama := "Petugas Desa"
	if u, err := h.app.Auth.Me(r.Context(), actorID); err == nil && u.Nama != "" {
		actorNama = u.Nama
	}

	var v struct {
		Tujuan       string   `json:"tujuan"`
		TanggalSetor string   `json:"tanggalSetor"`
		TransaksiIDs []string `json:"transaksiIds"`
		Catatan      string   `json:"catatan"`
	}
	if decode(r, &v) != nil || len(v.TransaksiIDs) == 0 {
		httpapi.Error(w, domain.ErrValidation)
		return
	}

	tgl := time.Now()
	if v.TanggalSetor != "" {
		if parsed, err := time.Parse("2006-01-02", v.TanggalSetor); err == nil {
			tgl = parsed
		}
	}

	sp, err := h.app.Pajak.CreateSetoran(r.Context(), actorID, actorNama, pajak.SetoranInput{
		Tujuan:       v.Tujuan,
		TanggalSetor: tgl,
		TransaksiIDs: v.TransaksiIDs,
		Catatan:      v.Catatan,
	})
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 201, sp)
}

func (h *Handler) PajakSetoranKonfirmasi(w http.ResponseWriter, r *http.Request) {
	actorID := principalID(r)
	id := r.PathValue("id")

	var v struct {
		NomorBuktiPenerimaan string `json:"nomorBuktiPenerimaan"`
		DiterimaOleh         string `json:"diterimaOleh"`
		Catatan              string `json:"catatan"`
		URLBukti             string `json:"urlBukti"`
	}
	if decode(r, &v) != nil {
		httpapi.Error(w, domain.ErrValidation)
		return
	}

	sp, err := h.app.Pajak.KonfirmasiSetoran(r.Context(), actorID, id, v.NomorBuktiPenerimaan, v.DiterimaOleh, v.Catatan)
	if err != nil {
		httpapi.Error(w, err)
		return
	}

	if strings.TrimSpace(v.URLBukti) != "" {
		_ = h.app.Pajak.SetBuktiSetoran(r.Context(), id, v.URLBukti)
		sp.URLBukti = v.URLBukti
	}

	httpapi.JSON(w, 200, sp)
}

// ---- Ringkasan & Audit ----

func (h *Handler) PajakRingkasan(w http.ResponseWriter, r *http.Request) {
	tahun, _ := strconv.Atoi(r.URL.Query().Get("tahun"))
	if tahun <= 0 {
		tahun = time.Now().Year()
	}
	ringkasan, err := h.app.Pajak.Ringkasan(r.Context(), tahun)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, ringkasan)
}

func (h *Handler) PajakAuditList(w http.ResponseWriter, r *http.Request) {
	refTipe := r.URL.Query().Get("refTipe")
	refID := r.URL.Query().Get("refId")
	audits, err := h.app.Pajak.ListAudit(r.Context(), refTipe, refID)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, audits)
}
