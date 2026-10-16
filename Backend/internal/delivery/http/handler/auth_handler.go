package handler

import (
	"net/http"
	"time"

	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
	"desa-anabanua-api/internal/usecase/auth"
)

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var v struct{ Nama, Email, Password, NIK, Telepon, Alamat string }
	if decode(r, &v) != nil || !valid(v.Nama, 3, 150) || !valid(v.Password, 8, 128) || len(v.NIK) != 16 || !digits(v.NIK) || !valid(v.Telepon, 10, 30) || !valid(v.Alamat, 5, 2000) || !validEmail(v.Email) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	res, err := h.app.Auth.Register(r.Context(), v.Nama, v.Email, v.Password, v.NIK, v.Telepon, v.Alamat)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 201, map[string]any{"email": res.Email, "message": res.Message, "emailSent": res.EmailSent})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var v struct{ Email, Password string }
	if decode(r, &v) != nil || !valid(v.Email, 3, 191) || !valid(v.Password, 1, 128) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	s, err := h.app.Auth.Login(r.Context(), v.Email, v.Password)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	setSessionCookies(w, r, s)
	httpapi.JSON(w, 200, map[string]any{"user": userResp(s.User)})
}

func (h *Handler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var v struct{ Email, Code string }
	if decode(r, &v) != nil || !valid(v.Email, 3, 191) || !validEmail(v.Email) || !valid(v.Code, 4, 10) || !digits(v.Code) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	s, err := h.app.Auth.VerifyOTP(r.Context(), v.Email, v.Code)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	setSessionCookies(w, r, s)
	httpapi.JSON(w, 200, map[string]any{"user": userResp(s.User)})
}

func (h *Handler) ResendOTP(w http.ResponseWriter, r *http.Request) {
	var v struct{ Email string }
	if decode(r, &v) != nil || !valid(v.Email, 3, 191) || !validEmail(v.Email) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	if err := h.app.Auth.ResendOTP(r.Context(), v.Email); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]any{"message": "Kode verifikasi telah dikirim ulang ke email Anda."})
}

func (h *Handler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var v struct{ Email string }
	if decode(r, &v) != nil || !valid(v.Email, 3, 191) || !validEmail(v.Email) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	if err := h.app.Auth.ForgotPassword(r.Context(), v.Email); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]any{"message": "Jika akun terdaftar, kode reset password telah dikirim ke email Anda."})
}

func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var v struct{ Email, Code, PasswordBaru string }
	if decode(r, &v) != nil || !valid(v.Email, 3, 191) || !validEmail(v.Email) || !valid(v.Code, 4, 10) || !digits(v.Code) || !valid(v.PasswordBaru, 8, 128) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	if err := h.app.Auth.ResetPassword(r.Context(), v.Email, v.Code, v.PasswordBaru); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]any{"message": "Password berhasil diubah. Silakan masuk kembali."})
}

func setSessionCookies(w http.ResponseWriter, r *http.Request, s auth.Session) {
	accessMaxAge := int(time.Until(s.ExpiresAt).Seconds())
	if accessMaxAge > 86400 {
		accessMaxAge = 86400
	}
	refreshMaxAge := 90 * 24 * 3600
	var refreshExpires time.Time
	if s.RefreshExpiresAt != nil {
		refreshMaxAge = int(time.Until(*s.RefreshExpiresAt).Seconds())
		if refreshMaxAge > 90*24*3600 {
			refreshMaxAge = 90 * 24 * 3600
		}
		refreshExpires = *s.RefreshExpiresAt
	} else {
		refreshExpires = time.Now().Add(time.Duration(refreshMaxAge) * time.Second)
	}
	secure := r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https"
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    s.AccessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   accessMaxAge,
		Expires:  s.ExpiresAt,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    s.RefreshToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   refreshMaxAge,
		Expires:  refreshExpires,
	})
}

func clearSessionCookies(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{Name: "access_token", Value: "", Path: "/", HttpOnly: true, Secure: false, SameSite: http.SameSiteLaxMode, MaxAge: -1})
	http.SetCookie(w, &http.Cookie{Name: "refresh_token", Value: "", Path: "/", HttpOnly: true, Secure: false, SameSite: http.SameSiteLaxMode, MaxAge: -1})
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	ck, err := r.Cookie("refresh_token")
	if err != nil || ck.Value == "" {
		httpapi.Error(w, domain.ErrUnauthorized)
		return
	}
	a, ref, err := h.app.Auth.Refresh(r.Context(), ck.Value)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	s := auth.Session{AccessToken: a, RefreshToken: ref, ExpiresAt: time.Now().Add(24 * time.Hour)}
	setSessionCookies(w, r, s)
	httpapi.JSON(w, 200, map[string]any{"ok": true})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	ck, err := r.Cookie("refresh_token")
	if err == nil && ck.Value != "" {
		_ = h.app.Auth.Logout(r.Context(), ck.Value)
	}
	clearSessionCookies(w)
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	u, err := h.app.Auth.Me(r.Context(), principalID(r))
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, userResp(u))
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	var v struct{ PasswordLama, PasswordBaru string }
	if decode(r, &v) != nil || !valid(v.PasswordLama, 1, 128) || !valid(v.PasswordBaru, 8, 128) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	if err := h.app.Auth.ChangePassword(r.Context(), principalID(r), v.PasswordLama, v.PasswordBaru); err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, map[string]bool{"ok": true})
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	var v struct {
		Nama, Email, NIK, NoKK, TempatLahir, TanggalLahir, JenisKelamin, Agama, StatusPerkawinan, Pekerjaan, RT, RW, Dusun, Telepon, Alamat, AvatarUrl string
		PasswordBaru                                                                                                                                   string
	}
	if decode(r, &v) != nil || !valid(v.Nama, 3, 150) || !validEmail(v.Email) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	if v.PasswordBaru != "" && !valid(v.PasswordBaru, 8, 128) {
		httpapi.Error(w, domain.ErrValidation)
		return
	}
	input := auth.ProfileInput{
		Nama:             v.Nama,
		Email:            v.Email,
		NIK:              v.NIK,
		NoKK:             v.NoKK,
		TempatLahir:      v.TempatLahir,
		TanggalLahir:     v.TanggalLahir,
		JenisKelamin:     v.JenisKelamin,
		Agama:            v.Agama,
		StatusPerkawinan: v.StatusPerkawinan,
		Pekerjaan:        v.Pekerjaan,
		RT:               v.RT,
		RW:               v.RW,
		Dusun:            v.Dusun,
		Telepon:          v.Telepon,
		Alamat:           v.Alamat,
		AvatarURL:        v.AvatarUrl,
		PasswordBaru:     v.PasswordBaru,
	}
	u, err := h.app.Auth.UpdateProfile(r.Context(), principalID(r), input)
	if err != nil {
		httpapi.Error(w, err)
		return
	}
	httpapi.JSON(w, 200, userResp(u))
}
