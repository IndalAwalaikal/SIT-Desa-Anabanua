package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"time"

	"desa-borong-api/internal/domain"
)

const (
	tokenIssuer   = "desa-borong"
	tokenAudience = "desa-borong-api"
)

type Claims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}
type Service struct {
	secret []byte
	ttl    time.Duration
}

func New(secret string, ttl time.Duration) *Service { return &Service{[]byte(secret), ttl} }
func (s *Service) IssueAccess(id string, role domain.Role) (string, time.Time, error) {
	exp := time.Now().Add(s.ttl)
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
		Role: string(role),
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   id,
			Issuer:    tokenIssuer,
			Audience:  jwt.ClaimStrings{tokenAudience},
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	})
	v, e := t.SignedString(s.secret)
	return v, exp, e
}
func (s *Service) HashRefresh(raw string) string { return Hash(raw) }
func (s *Service) NewRefresh() (string, error)   { return NewRefresh() }
func (s *Service) Parse(v string) (Claims, error) {
	var c Claims
	t, e := jwt.ParseWithClaims(v, &c, func(t *jwt.Token) (interface{}, error) {
		if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return s.secret, nil
	}, jwt.WithIssuer(tokenIssuer), jwt.WithAudience(tokenAudience))
	if e != nil || !t.Valid {
		return c, fmt.Errorf("invalid access token: %w", errOrInvalid(e))
	}
	return c, nil
}

func errOrInvalid(e error) error {
	if e == nil {
		return errors.New("invalid token")
	}
	return e
}
func NewRefresh() (string, error) {
	b := make([]byte, 32)
	if _, e := rand.Read(b); e != nil {
		return "", e
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}
func Hash(v string) string {
	x := sha256.Sum256([]byte(v))
	return base64.RawStdEncoding.EncodeToString(x[:])
}
