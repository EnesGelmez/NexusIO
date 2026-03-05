package service

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims holds the JWT payload fields we care about.
type Claims struct {
	UserID   string `json:"userId"`
	TenantID string `json:"tenantId,omitempty"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// JWTService issues and validates signed tokens.
type JWTService struct {
	secret []byte
	ttl    time.Duration
}

func NewJWTService(secret string, ttlHours int) *JWTService {
	return &JWTService{
		secret: []byte(secret),
		ttl:    time.Duration(ttlHours) * time.Hour,
	}
}

// Issue creates a signed JWT for the given subject.
func (s *JWTService) Issue(userID, tenantID, role string) (string, time.Time, error) {
	exp := time.Now().Add(s.ttl)
	claims := Claims{
		UserID:   userID,
		TenantID: tenantID,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(s.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("sign token: %w", err)
	}
	return signed, exp, nil
}

// Verify parses and validates a JWT string, returning the embedded claims.
func (s *JWTService) Verify(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.secret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}
	return claims, nil
}
