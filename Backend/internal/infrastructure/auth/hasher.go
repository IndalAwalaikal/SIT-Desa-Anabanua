package auth

import "golang.org/x/crypto/bcrypt"

// BcryptHasher implements the accounts.PasswordHasher interface using bcrypt.
type BcryptHasher struct{ Cost int }

func NewBcryptHasher() *BcryptHasher { return &BcryptHasher{Cost: 12} }

func (h *BcryptHasher) Hash(password string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(password), h.Cost)
	return string(b), err
}

func (h *BcryptHasher) Compare(hash, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}
