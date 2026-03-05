// Package api embeds the OpenAPI 3.0 specification for the NewGen platform.
package api

import _ "embed"

// Spec is the raw bytes of the openapi.yaml file, embedded at compile time.
//
//go:embed openapi.yaml
var Spec []byte
