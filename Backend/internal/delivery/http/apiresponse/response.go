package apiresponse

import (
	"database/sql"
	"desa-borong-api/internal/domain"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
)

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]any{"data": data})
}
func List(w http.ResponseWriter, data any, page, limit, total int) {
	JSON(w, http.StatusOK, map[string]any{"items": data, "meta": map[string]int{"page": page, "limit": limit, "total": total, "totalPages": (total + limit - 1) / limit}})
}
func Error(w http.ResponseWriter, e error) {
	s := 500
	c := "INTERNAL_ERROR"
	m := "Terjadi kesalahan pada server"
	switch {
	case errors.Is(e, domain.ErrValidation):
		s = 400
		c = "VALIDATION_ERROR"
		m = "Data yang dikirim tidak valid"
	case errors.Is(e, domain.ErrUnauthorized):
		s = 401
		c = "UNAUTHORIZED"
		m = "Autentikasi diperlukan atau tidak valid"
	case errors.Is(e, domain.ErrForbidden):
		s = 403
		c = "FORBIDDEN"
		m = "Anda tidak memiliki akses"
	case errors.Is(e, domain.ErrNotFound), errors.Is(e, sql.ErrNoRows):
		s = 404
		c = "NOT_FOUND"
		m = "Data tidak ditemukan"
	case errors.Is(e, domain.ErrConflict):
		s = 409
		c = "CONFLICT"
		m = "Data sudah digunakan"
	case errors.Is(e, domain.ErrInvalidState):
		s = http.StatusConflict
		c = "INVALID_STATE"
		m = "Perubahan status tidak diperbolehkan"
	case errors.Is(e, domain.ErrEmailNotVerified):
		s = 403
		c = "EMAIL_NOT_VERIFIED"
		m = "Silakan verifikasi email terlebih dahulu"
	case errors.Is(e, domain.ErrOTPInvalid):
		s = 400
		c = "OTP_INVALID"
		m = "Kode verifikasi tidak valid atau kadaluarsa"
	case errors.Is(e, domain.ErrOTPNotFound):
		s = 404
		c = "OTP_NOT_FOUND"
		m = "Kode verifikasi tidak ditemukan"
	case errors.Is(e, domain.ErrEmailAlreadyVerified):
		s = 409
		c = "EMAIL_ALREADY_VERIFIED"
		m = "Email sudah terverifikasi"
	case errors.Is(e, domain.ErrInvalidEmail):
		s = 401
		c = "INVALID_EMAIL"
		m = "Email tidak terdaftar"
	case errors.Is(e, domain.ErrWrongPassword):
		s = 401
		c = "WRONG_PASSWORD"
		m = "Password salah"
	case errors.Is(e, domain.ErrAccountNotActive):
		s = 403
		c = "ACCOUNT_INACTIVE"
		m = "Akun dinonaktifkan, hubungi administrator desa"
	case errors.Is(e, domain.ErrAccountInactiveOrNotFound):
		s = 401
		c = "ACCOUNT_INACTIVE_OR_NOT_FOUND"
		m = "Email tidak terdaftar atau akun tidak aktif"
	case errors.Is(e, domain.ErrEmailSendFailed):
		s = http.StatusBadGateway
		c = "EMAIL_SEND_FAILED"
		m = "Layanan email sedang tidak tersedia"
	case errors.Is(e, domain.ErrRateLimited):
		s = http.StatusTooManyRequests
		c = "RATE_LIMITED"
		m = "Terlalu banyak permintaan, silakan coba lagi nanti"
	}
	if s == 500 && e != nil {
		slog.Error("internal server error", "error", e)
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(s)
	_ = json.NewEncoder(w).Encode(map[string]any{"error": errorBody{Code: c, Message: m}})
}
