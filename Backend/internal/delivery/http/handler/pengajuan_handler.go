package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/persuratan"
)

func (h *Handler) PengajuanCreate(w http.ResponseWriter, r *http.Request) {
	pemohon, err := h.app.Auth.Me(r.Context(), principalID(r))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	var code string
	data := map[string]string{}
	files := []persuratan.SubmittedFile{}

	if strings.HasPrefix(r.Header.Get("Content-Type"), "multipart/form-data") {
		if e := r.ParseMultipartForm(10 << 20); e != nil {
			slog.Warn("pengajuan parse multipart form failed", "error", e)
			httpapi.Error(w, domain.ErrValidation)
			return
		}
		code = r.FormValue("jenisSuratKode")
		if dj := r.FormValue("data"); dj != "" {
			if err := json.Unmarshal([]byte(dj), &data); err != nil {
				slog.Warn("pengajuan unmarshal data json failed", "error", err, "raw", dj)
				httpapi.Error(w, domain.ErrValidation)
				return
			}
		}
		if r.MultipartForm != nil {
			for _, fh := range r.MultipartForm.File["lampiran"] {
				f, e := fh.Open()
				if e != nil {
					slog.Warn("pengajuan file open error", "error", e, "filename", fh.Filename)
					continue
				}
				defer f.Close()
				file, ok := inspectUpload(f, fh.Filename, fh.Size)
				if !ok {
					httpapi.Error(w, domain.ErrValidation)
					return
				}
				files = append(files, file)
			}
		}
	} else {
		var v struct {
			JenisSuratKode string
			Data           map[string]string
		}
		if decode(r, &v) != nil || len(v.Data) == 0 {
			slog.Warn("pengajuan decode json failed or empty data")
			httpapi.Error(w, domain.ErrValidation)
			return
		}
		code = v.JenisSuratKode
		data = v.Data
	}

	if !valid(code, 2, 10) {
		slog.Warn("pengajuan invalid kode", "code", code)
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	if len(files) > maxAttachmentCount {
		slog.Warn("pengajuan too many files", "count", len(files))
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	p, err := h.app.Persuratan.Submit(r.Context(), pemohon, code, data, files)
	if err != nil {
		slog.Warn("pengajuan submit failed", "error", err, "code", code)
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 201, h.pengajuanResp(r.Context(), p))
}

func (h *Handler) PengajuanGet(w http.ResponseWriter, r *http.Request) {
	p, err := h.app.Persuratan.GetByResi(r.Context(), r.PathValue("nomorResi"))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	// Public tracking deliberately excludes identity data, submitted form data,
	// attachments, internal notes, and the generated document.
	httpapi.JSON(w, 200, pengajuanTrackingResp(p))
}

// PengajuanGetSurat returns the full pengajuan data (including form data,
// pemohon info, and dokumen hasil) for generating the final published letter.
// Only returns full data when the pengajuan status is 'selesai'; otherwise
// returns tracking-only data to protect privacy.
func (h *Handler) PengajuanGetSurat(w http.ResponseWriter, r *http.Request) {
	p, err := h.app.Persuratan.GetByResi(r.Context(), r.PathValue("nomorResi"))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	if p.Status == domain.PengajuanSelesai {
		httpapi.JSON(w, 200, h.pengajuanResp(r.Context(), p))
	} else {
		httpapi.JSON(w, 200, pengajuanTrackingResp(p))
	}
}

const (
	maxAttachmentSize  = 5 << 20
	maxAttachmentCount = 5
)

func inspectUpload(r io.Reader, filename string, size int64) (persuratan.SubmittedFile, bool) {
	if filename == "" || size < 1 || size > maxAttachmentSize {
		slog.Warn("upload inspect failed: invalid filename or size", "filename", filename, "size", size)
		return persuratan.SubmittedFile{}, false
	}
	buf := make([]byte, 512)
	n, err := io.ReadFull(r, buf)
	if err != nil && err != io.ErrUnexpectedEOF && err != io.EOF {
		slog.Warn("upload inspect failed: read header error", "error", err)
		return persuratan.SubmittedFile{}, false
	}
	buf = buf[:n]
	detected := http.DetectContentType(buf)
	baseType, _, _ := strings.Cut(detected, ";")
	baseType = strings.TrimSpace(baseType)
	ext := strings.ToLower(filepath.Ext(filename))
	// ponytail: octet-stream hanya untuk PDF (cukup sering karena browser salah deteksi).
	// File non-PDF dengan octet-stream ditolak untuk mencegah lampiran executable.
	isPDF := ext == ".pdf"
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".pdf": true, ".webp": true}
	allowedMimes := map[string]bool{
		"image/jpeg": true, "image/jpg": true, "image/png": true, "image/webp": true,
		"application/pdf": true, "application/x-pdf": true,
	}
	if baseType == "application/octet-stream" {
		if !isPDF || !hasPDFMagic(buf) {
			slog.Warn("upload inspect failed: octet-stream without pdf magic", "ext", ext)
			return persuratan.SubmittedFile{}, false
		}
		// Treat octet-stream-with-pdf-magic as PDF.
		baseType = "application/pdf"
	} else if !allowedMimes[baseType] {
		slog.Warn("upload inspect failed: unsupported mime", "detected", detected, "baseType", baseType, "ext", ext)
		return persuratan.SubmittedFile{}, false
	}

	if !allowedExts[ext] {
		slog.Warn("upload inspect failed: unsupported ext", "detected", detected, "baseType", baseType, "ext", ext)
		return persuratan.SubmittedFile{}, false
	}

	return persuratan.SubmittedFile{
		Filename: filepath.Base(filename), Size: size, MimeType: baseType,
		Reader: io.MultiReader(bytes.NewReader(buf), r),
	}, true
}

// hasPDFMagic reports whether the first bytes look like a PDF (%PDF-).
func hasPDFMagic(buf []byte) bool {
	return len(buf) >= 5 && string(buf[:5]) == "%PDF-"
}

func (h *Handler) PengajuanSaya(w http.ResponseWriter, r *http.Request) {
	pageNumber, limit := page(r)
	items, total, err := h.app.Persuratan.ListByPemohonPage(r.Context(), principalID(r), pageNumber, limit)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	out := make([]map[string]any, 0, len(items))
	for _, p := range items {
		out = append(out, h.pengajuanResp(r.Context(), p))
	}
	httpapi.List(w, out, pageNumber, limit, total)
}

func (h *Handler) PengajuanLampiran(w http.ResponseWriter, r *http.Request) {
	role := principalRole(r)
	file, lampiran, err := h.app.Persuratan.OpenLampiran(
		r.Context(), r.PathValue("id"), r.PathValue("lampiranID"), principalID(r), role == "admin" || role == "super_admin",
	)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	defer file.Close()
	w.Header().Set("Content-Type", lampiran.MimeType)
	// ponytail: sanitize filename to prevent CRLF header injection via filename.
	// Strip control chars + quotes; fall back to "attachment" if empty.
	safe := sanitizeFilename(lampiran.Nama)
	w.Header().Set("Content-Disposition", `attachment; filename="`+safe+`"`)
	w.Header().Set("Cache-Control", "private, no-store")
	_, _ = io.Copy(w, file)
}

// sanitizeFilename strips control characters and quotes that could break out
// of the Content-Disposition filename parameter or inject response headers.
func sanitizeFilename(name string) string {
	name = filepath.Base(name)
	var b strings.Builder
	for _, r := range name {
		if r < 0x20 || r == 0x7f || r == '"' || r == '\\' {
			continue
		}
		b.WriteRune(r)
	}
	out := strings.TrimSpace(b.String())
	if out == "" {
		return "attachment"
	}
	return out
}

func (h *Handler) PengajuanList(w http.ResponseWriter, r *http.Request) {
	pageNumber, limit := page(r)
	items, total, err := h.app.Persuratan.ListPage(
		r.Context(), r.URL.Query().Get("status"), r.URL.Query().Get("search"),
		r.URL.Query().Get("sort"), pageNumber, limit,
	)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	out := make([]map[string]any, 0, len(items))
	for _, p := range items {
		out = append(out, h.pengajuanResp(r.Context(), p))
	}
	httpapi.List(w, out, pageNumber, limit, total)
}

func (h *Handler) PengajuanStatus(w http.ResponseWriter, r *http.Request) {
	var v struct{ Status, Catatan string }
	if decode(r, &v) != nil || !domain.StatusPengajuan(v.Status).Valid() {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	if v.Status == "ditolak" && !valid(v.Catatan, 1, 5000) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	next := domain.StatusPengajuan(v.Status)
	var catatan, changedBy *string
	if strings.TrimSpace(v.Catatan) != "" {
		c := strings.TrimSpace(v.Catatan)
		catatan = &c
	}
	pid := principalID(r)
	changedBy = &pid
	p, err := h.app.Persuratan.ChangeStatus(r.Context(), r.PathValue("id"), next, catatan, changedBy)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, h.pengajuanResp(r.Context(), p))
}

func (h *Handler) PengajuanPublish(w http.ResponseWriter, r *http.Request) {
	var v struct {
		NomorSurat string `json:"nomorSurat"`
		Catatan    string `json:"catatan"`
	}
	_ = decode(r, &v)
	p, err := h.app.Persuratan.Publish(r.Context(), r.PathValue("id"), v.NomorSurat, v.Catatan, principalID(r))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, h.pengajuanResp(r.Context(), p))
}

func (h *Handler) PengajuanDelete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.app.Persuratan.DeletePengajuan(r.Context(), id); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]string{"message": "Pengajuan surat berhasil dihapus"})
}

func (h *Handler) PengajuanBukuAgenda(w http.ResponseWriter, r *http.Request) {
	items, err := h.app.Persuratan.ListAll(r.Context(), string(domain.PengajuanSelesai))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	agenda := make([]map[string]any, 0, len(items))
	for idx, p := range items {
		nomorSurat := ""
		if p.NomorSuratResmi != nil {
			nomorSurat = *p.NomorSuratResmi
		} else if p.DokumenHasil != nil {
			nomorSurat = p.DokumenHasil.NomorSurat
		}
		nik := p.Data["nik"]
		if nik == "" && p.SubjekNIK != nil {
			nik = *p.SubjekNIK
		}
		qrCode := ""
		if p.QRVerificationCode != nil {
			qrCode = *p.QRVerificationCode
		}
		agenda = append(agenda, map[string]any{
			"noUrut":          idx + 1,
			"id":              p.ID,
			"nomorResi":       p.NomorResi,
			"nomorSuratResmi": nomorSurat,
			"jenisSuratKode":  p.JenisSuratKode,
			"jenisSuratNama":  p.JenisSuratNama,
			"pemohonNama":     p.PemohonNama,
			"pemohonNik":      nik,
			"tanggalTerbit":   p.UpdatedAt.Format("02/01/2006"),
			"penandatangan":   "Kepala Desa Anabanua",
			"filePdfUrl":      p.FilePDFURL,
			"qrCode":          qrCode,
		})
	}
	httpapi.JSON(w, 200, agenda)
}

func (h *Handler) pengajuanResp(ctx context.Context, p domain.PengajuanSurat) map[string]any {
	lamp := make([]map[string]any, 0, len(p.Lampiran))
	for _, l := range p.Lampiran {
		lamp = append(lamp, map[string]any{
			"id": l.ID, "nama": l.Nama, "url": "/api/pengajuan/" + p.ID + "/lampiran/" + l.ID, "ukuran": l.UkuranBytes, "tipe": l.MimeType,
		})
	}
	riwayat := make([]map[string]any, 0, len(p.Riwayat))
	for _, rw := range p.Riwayat {
		m := map[string]any{
			"status": rw.Status,
			"waktu":  rw.Waktu.Format(time.RFC3339),
		}
		if rw.Catatan != nil {
			m["catatan"] = *rw.Catatan
		}
		if rw.Oleh != nil {
			m["oleh"] = *rw.Oleh
		}
		riwayat = append(riwayat, m)
	}
	resp := map[string]any{
		"id":             p.ID,
		"nomorResi":      p.NomorResi,
		"jenisSuratKode": p.JenisSuratKode,
		"jenisSuratNama": p.JenisSuratNama,
		"pemohonId":      p.PemohonID,
		"pemohonNama":    p.PemohonNama,
		"data":           p.Data,
		"lampiran":       lamp,
		"status":         p.Status,
		"riwayatStatus":  riwayat,
		"dibuatPada":     p.CreatedAt.Format(time.RFC3339),
		"diperbaruiPada": p.UpdatedAt.Format(time.RFC3339),
	}
	if p.CatatanAdmin != nil {
		resp["catatanAdmin"] = *p.CatatanAdmin
	}
	if p.NomorSuratResmi != nil {
		resp["nomorSuratResmi"] = *p.NomorSuratResmi
	}
	if p.FilePDFURL != nil {
		resp["filePdfUrl"] = *p.FilePDFURL
	}
	if p.QRVerificationCode != nil {
		resp["qrVerificationCode"] = *p.QRVerificationCode
	}
	if p.DokumenHasil != nil {
		d := p.DokumenHasil
		resp["dokumenHasil"] = map[string]any{
			"nama": d.Nama, "url": d.URL, "nomorSurat": d.NomorSurat,
			"diterbitkanOleh": d.DiterbitkanOleh,
			"diterbitkanPada": d.DiterbitkanPada.Format(time.RFC3339),
		}
	}
	if kd, kerr := h.app.Persuratan.GetKepalaDesa(ctx); kerr == nil {
		resp["penandatangan"] = map[string]any{
			"nama": kd.Nama,
			"nip":  kd.NIP,
		}
	}
	return resp
}

func pengajuanTrackingResp(p domain.PengajuanSurat) map[string]any {
	history := make([]map[string]any, 0, len(p.Riwayat))
	for _, item := range p.Riwayat {
		entry := map[string]any{
			"status": item.Status,
			"waktu":  item.Waktu.Format(time.RFC3339),
		}
		if item.Catatan != nil && *item.Catatan != "" {
			entry["catatan"] = *item.Catatan
		}
		history = append(history, entry)
	}
	resp := map[string]any{
		"nomorResi":      p.NomorResi,
		"jenisSuratKode": p.JenisSuratKode,
		"jenisSuratNama": p.JenisSuratNama,
		"status":         p.Status,
		"riwayatStatus":  history,
		"dibuatPada":     p.CreatedAt.Format(time.RFC3339),
		"diperbaruiPada": p.UpdatedAt.Format(time.RFC3339),
	}
	if p.NomorSuratResmi != nil {
		resp["nomorSuratResmi"] = *p.NomorSuratResmi
	}
	if p.FilePDFURL != nil {
		resp["filePdfUrl"] = *p.FilePDFURL
	}
	if p.QRVerificationCode != nil {
		resp["qrVerificationCode"] = *p.QRVerificationCode
	}
	// Expose rejection reason at top-level so frontend can show it prominently
	if p.Status == domain.PengajuanDitolak && p.CatatanAdmin != nil && *p.CatatanAdmin != "" {
		resp["catatanAdmin"] = *p.CatatanAdmin
	}
	if p.DokumenHasil != nil {
		d := p.DokumenHasil
		resp["dokumenHasil"] = map[string]any{
			"nama": d.Nama, "url": d.URL, "nomorSurat": d.NomorSurat,
			"diterbitkanOleh": d.DiterbitkanOleh,
			"diterbitkanPada": d.DiterbitkanPada.Format(time.RFC3339),
		}
	}
	return resp
}
