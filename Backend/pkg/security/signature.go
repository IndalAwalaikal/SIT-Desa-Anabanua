package security

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
)

// GenerateDocumentHash computes an HMAC-SHA256 cryptographic signature for a published letter
func GenerateDocumentHash(secretKey, nomorSurat, pemohonNIK, nomorResi, tanggal string) string {
	// ponytail: empty secret panics in production (caller must enforce);
	// HMAC with empty key is valid but produces trivially forgeable signatures.
	if secretKey == "" {
		panic("DOCUMENT_HMAC_SECRET must not be empty")
	}
	payload := fmt.Sprintf("SURAT:%s|NIK:%s|RESI:%s|TGL:%s",
		strings.TrimSpace(nomorSurat),
		strings.TrimSpace(pemohonNIK),
		strings.TrimSpace(nomorResi),
		strings.TrimSpace(tanggal),
	)

	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(payload))
	return "SEC-" + strings.ToUpper(hex.EncodeToString(h.Sum(nil))[:16])
}

// VerifyDocumentHash checks if a signature matches the payload attributes
func VerifyDocumentHash(secretKey, nomorSurat, pemohonNIK, nomorResi, tanggal, expectedSignature string) bool {
	computed := GenerateDocumentHash(secretKey, nomorSurat, pemohonNIK, nomorResi, tanggal)
	return hmac.Equal([]byte(computed), []byte(expectedSignature))
}
