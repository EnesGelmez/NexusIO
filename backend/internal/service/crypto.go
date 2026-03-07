// Package service – AES-256-GCM encryption helper.
// Secrets (api_key, agent_token, secret_key) are kept encrypted at rest.
// The encryption key is read from the ENCRYPTION_KEY environment variable
// (64 hex characters = 32 bytes).  A deterministic dev fallback is used when
// the variable is absent so local development works without extra setup.
package service

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
)

// CryptoService provides field-level AES-256-GCM encryption and SHA-256 hashing.
type CryptoService struct {
	key []byte // 32-byte AES-256 key
}

// devKey is a fixed key used only in local development when ENCRYPTION_KEY is unset.
// NEVER use this in production.
const devKey = "6465766465766465766465766465766465766465766465766465766465766465"

// NewCryptoService initialises the service. hexKey must be 64 hex characters
// (32 bytes). Pass an empty string to use the dev fallback.
func NewCryptoService(hexKey string) (*CryptoService, error) {
	if hexKey == "" {
		hexKey = devKey
	}
	key, err := hex.DecodeString(hexKey)
	if err != nil {
		return nil, fmt.Errorf("ENCRYPTION_KEY is not valid hex: %w", err)
	}
	if len(key) != 32 {
		return nil, fmt.Errorf("ENCRYPTION_KEY must be 64 hex chars (32 bytes), got %d bytes", len(key))
	}
	return &CryptoService{key: key}, nil
}

// Encrypt encrypts plaintext with AES-256-GCM and returns a base64-encoded
// string of  nonce || ciphertext || tag.
// An empty plaintext returns an empty string without error.
func (c *CryptoService) Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}
	block, err := aes.NewCipher(c.key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	sealed := gcm.Seal(nonce, nonce, []byte(plaintext), nil) // nonce prepended
	return base64.StdEncoding.EncodeToString(sealed), nil
}

// Decrypt reverses Encrypt.  Returns an empty string for empty ciphertext.
func (c *CryptoService) Decrypt(ciphertext string) (string, error) {
	if ciphertext == "" {
		return "", nil
	}
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		// If the value is not base64 it was stored before encryption was introduced.
		// Return it as-is so old records still work after a migration.
		return ciphertext, nil
	}
	block, err := aes.NewCipher(c.key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	ns := gcm.NonceSize()
	if len(data) < ns {
		// Pre-encryption value, return as-is.
		return ciphertext, nil
	}
	plaintext, err := gcm.Open(nil, data[:ns], data[ns:], nil)
	if err != nil {
		// Decryption failure can mean wrong key OR the value is plain-text legacy.
		// Treat it as a plain-text legacy value rather than crashing.
		return ciphertext, nil
	}
	return string(plaintext), nil
}

// Hash returns the hex-encoded SHA-256 digest of value.
// Used to store a fast-lookup index for high-entropy random secrets (API keys).
func (c *CryptoService) Hash(value string) string {
	h := sha256.Sum256([]byte(value))
	return hex.EncodeToString(h[:])
}

// MustEncrypt panics on error; for use in test helpers only.
func (c *CryptoService) MustEncrypt(plaintext string) string {
	s, err := c.Encrypt(plaintext)
	if err != nil {
		panic(fmt.Sprintf("CryptoService.MustEncrypt: %v", err))
	}
	return s
}

// EncryptIfNotEmpty encrypts only when value is non-empty; returns ("", nil) otherwise.
func (c *CryptoService) EncryptIfNotEmpty(value string) (string, error) {
	if value == "" {
		return "", nil
	}
	return c.Encrypt(value)
}

// ErrBadCiphertext is returned when decryption fails for a known-encrypted value.
var ErrBadCiphertext = errors.New("ciphertext decryption failed")
