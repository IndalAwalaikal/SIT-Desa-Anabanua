package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	httpapi "desa-anabanua-api/internal/delivery/http/apiresponse"
	"desa-anabanua-api/internal/domain"
	iauth "desa-anabanua-api/internal/infrastructure/auth"
)

type ctxKey struct{}
type Principal struct{ ID, Role string }

func PrincipalFrom(ctx context.Context) (Principal, bool) {
	v, ok := ctx.Value(ctxKey{}).(Principal)
	return v, ok
}

func parseBearer(r *http.Request) (string, bool) {
	h := r.Header.Get("Authorization")
	if h == "" {
		return "", false
	}
	parts := strings.Fields(h)
	if len(parts) == 2 && strings.EqualFold(parts[0], "bearer") {
		return parts[1], true
	}
	return "", false
}

func parseCookie(r *http.Request, name string) (string, bool) {
	ck, err := r.Cookie(name)
	if err != nil || ck.Value == "" {
		return "", false
	}
	return ck.Value, true
}

func Auth(s *iauth.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token, ok := parseBearer(r)
			if !ok {
				token, ok = parseCookie(r, "access_token")
			}
			if !ok {
				httpapi.Error(w, domain.ErrUnauthorized)
				return
			}
			c, e := s.Parse(token)
			if e != nil {
				httpapi.Error(w, domain.ErrUnauthorized)
				return
			}
			next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, Principal{c.Subject, c.Role})))
		})
	}
}

func Role(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			p, ok := PrincipalFrom(r.Context())
			if !ok {
				httpapi.Error(w, domain.ErrUnauthorized)
				return
			}
			for _, role := range roles {
				if p.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}
			httpapi.Error(w, domain.ErrForbidden)
		})
	}
}

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return Role(roles...)
}

func GetPrincipal(r *http.Request) (Principal, error) {
	p, ok := PrincipalFrom(r.Context())
	if !ok {
		return Principal{}, errors.New("unauthorized")
	}
	return p, nil
}
