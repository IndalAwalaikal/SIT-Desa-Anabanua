package config

import (
	"fmt"
	"os"
	"strings"
	"time"
)

type Config struct {
	Env, Port, DBHost, DBPort, DBName, DBUser, DBPassword, JWTSecret, HMACSecret, StoragePath string
	BootstrapSuperAdminName, BootstrapSuperAdminEmail, BootstrapSuperAdminPassword            string
	AccessTTL, RefreshTTL                                                                     time.Duration
	CORSOrigins                                                                               []string
	BrevoAPIKey                                                                               string
	BrevoFromEmail                                                                            string
	FlowKirimAPIKey                                                                           string
	FlowKirimBaseURL                                                                          string
	FlowKirimWebhookSecret                                                                    string
	AppURL                                                                                    string
	OTPTTL                                                                                    time.Duration
}

func get(k, d string) string {
	if v := strings.TrimSpace(os.Getenv(k)); v != "" {
		return v
	}
	return d
}
func Load() (Config, error) {
	a, err := time.ParseDuration(get("JWT_ACCESS_TTL", "15m"))
	if err != nil {
		return Config{}, fmt.Errorf("JWT_ACCESS_TTL: %w", err)
	}
	r, err := time.ParseDuration(get("JWT_REFRESH_TTL", "720h"))
	if err != nil {
		return Config{}, fmt.Errorf("JWT_REFRESH_TTL: %w", err)
	}
	hmacSecret := strings.TrimSpace(os.Getenv("DOCUMENT_HMAC_SECRET"))
	jwtSecret := os.Getenv("JWT_ACCESS_SECRET")
	env := get("APP_ENV", "development")
	// ponytail: HMAC secret MUST be independent from JWT secret in production.
	// Fallback to JWT secret only in development for convenience, never in prod.
	if hmacSecret == "" {
		if env == "production" {
			return Config{}, fmt.Errorf("DOCUMENT_HMAC_SECRET must be set independently in production")
		}
		hmacSecret = jwtSecret
	}
	c := Config{
		Env: env, Port: get("APP_PORT", "8080"),
		DBHost: get("DB_HOST", "localhost"), DBPort: get("DB_PORT", "3306"),
		DBName: strings.TrimSpace(os.Getenv("DB_NAME")), DBUser: strings.TrimSpace(os.Getenv("DB_USER")), DBPassword: os.Getenv("DB_PASSWORD"),
		JWTSecret: jwtSecret, HMACSecret: hmacSecret, StoragePath: get("FILE_STORAGE_PATH", "./uploads"),
		BootstrapSuperAdminName:     strings.TrimSpace(os.Getenv("BOOTSTRAP_SUPER_ADMIN_NAME")),
		BootstrapSuperAdminEmail:    strings.TrimSpace(os.Getenv("BOOTSTRAP_SUPER_ADMIN_EMAIL")),
		BootstrapSuperAdminPassword: os.Getenv("BOOTSTRAP_SUPER_ADMIN_PASSWORD"),
		AccessTTL: a, RefreshTTL: r,
		FlowKirimWebhookSecret: os.Getenv("FLOWKIRIM_WEBHOOK_SECRET"),
	}
	if c.DBName == "" || c.DBUser == "" || c.DBPassword == "" {
		return Config{}, fmt.Errorf("DB_NAME, DB_USER, and DB_PASSWORD must be set")
	}
	if len(c.JWTSecret) < 32 {
		return Config{}, fmt.Errorf("JWT_ACCESS_SECRET must be at least 32 bytes")
	}
	for _, o := range strings.Split(os.Getenv("CORS_ALLOWED_ORIGINS"), ",") {
		if o = strings.TrimSpace(o); o != "" {
			c.CORSOrigins = append(c.CORSOrigins, o)
		}
	}
	if len(c.CORSOrigins) == 0 {
		return Config{}, fmt.Errorf("CORS_ALLOWED_ORIGINS must contain at least one origin")
	}
	bootstrapValues := []string{c.BootstrapSuperAdminName, c.BootstrapSuperAdminEmail, c.BootstrapSuperAdminPassword}
	set := 0
	for _, value := range bootstrapValues {
		if value != "" {
			set++
		}
	}
	if set != 0 && set != len(bootstrapValues) {
		return Config{}, fmt.Errorf("BOOTSTRAP_SUPER_ADMIN_NAME, BOOTSTRAP_SUPER_ADMIN_EMAIL, and BOOTSTRAP_SUPER_ADMIN_PASSWORD must be set together")
	}
	if set == len(bootstrapValues) && len(c.BootstrapSuperAdminPassword) < 12 {
		return Config{}, fmt.Errorf("BOOTSTRAP_SUPER_ADMIN_PASSWORD must be at least 12 bytes")
	}
	otpt, err := time.ParseDuration(get("OTP_TTL_MINUTES", "10m"))
	if err != nil {
		return Config{}, fmt.Errorf("OTP_TTL_MINUTES: %w", err)
	}
	c.BrevoAPIKey = os.Getenv("BREVO_API_KEY")
	c.BrevoFromEmail = get("BREVO_FROM_EMAIL", "no-reply@desaborong.id")
	c.FlowKirimAPIKey = os.Getenv("FLOWKIRIM_API_KEY")
	c.FlowKirimBaseURL = os.Getenv("FLOWKIRIM_BASE_URL")
	c.AppURL = strings.TrimRight(get("APP_URL", "http://localhost:3300"), "/")
	c.OTPTTL = otpt
	return c, nil
}
