# NewGen Backend — Go API Server

## Mimari

```
backend/
├── cmd/
│   └── server/
│       └── main.go              ← Giriş noktası
├── internal/
│   ├── config/
│   │   └── config.go            ← Ortam değişkenleri
│   ├── domain/
│   │   ├── models.go            ← Varlık modelleri (iş nesneleri)
│   │   └── repositories.go      ← Repository arayüzleri (portlar)
│   ├── repository/
│   │   └── memory/
│   │       └── store.go         ← Bellek içi implementasyon (test/geliştirme)
│   ├── service/
│   │   ├── services.go          ← İş mantığı katmanı
│   │   └── jwt.go               ← JWT issuer/verifier
│   ├── handler/
│   │   ├── helpers.go           ← JSON encode/decode yardımcıları
│   │   ├── auth.go              ← Login / logout / me
│   │   ├── tenant.go            ← Tenant CRUD (super-admin)
│   │   ├── workflow.go          ← Workflow CRUD + enable/disable + çalıştır
│   │   ├── endpoint.go          ← API Endpoint yönetimi
│   │   └── cari.go              ← Cari Kontrol + Agent proxy
│   ├── middleware/
│   │   └── middleware.go        ← CORS, Logger, JWT Auth, API-Key Auth, Role
│   └── router/
│       └── router.go            ← Tüm rotaların bağlantısı
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

## Hızlı Başlangıç

### 1. Go'yu Kur (gerekli: Go 1.22+)

```powershell
# Windows — winget ile
winget install GoLang.Go

# veya https://go.dev/dl/ adresinden Windows installer indir
```

### 2. Bağımlılıkları İndir

```powershell
cd D:\Projects\NewGen\backend
go mod download
```

### 3. Sunucuyu Çalıştır

```powershell
go run ./cmd/server
# veya make run
```

Sunucu `http://localhost:8080` adresinde açılır.

### 4. Build

```powershell
go build -o bin/newgen-server.exe ./cmd/server
```

---

## Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `PORT` | `8080` | Dinlenecek port |
| `JWT_SECRET` | `change-me-in-production...` | JWT imzalama anahtarı |
| `JWT_TTL_HOURS` | `24` | Token geçerlilik süresi (saat) |
| `CORS_ORIGIN` | `http://localhost:5173` | İzin verilen origin (Vite dev) |
| `API_KEY_ARCELIK` | `test-api-key-arcelik-001` | Arçelik tenant API anahtarı |
| `API_KEY_BEKO` | `test-api-key-beko-002` | Beko tenant API anahtarı |

---

## API Endpointleri

### Auth

| Method | Yol | Auth | Açıklama |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | - | Email + şifre ile giriş, JWT döner |
| `POST` | `/api/v1/auth/logout` | - | Çıkış (client tarafı token silme) |
| `GET` | `/api/v1/auth/me` | JWT | Oturumdaki kullanıcı bilgisi |

**Login isteği:**
```json
POST /api/v1/auth/login
{
  "email": "admin@newgen.io",
  "password": "admin123"
}
```

**Test kullanıcıları:**
```
admin@newgen.io   / admin123   → SUPER_ADMIN
user@arcelik.com  / tenant123  → TENANT_ADMIN (tenant-001)
```

---

### Tenants (Sadece SUPER_ADMIN)

| Method | Yol | Açıklama |
|---|---|---|
| `GET` | `/api/v1/tenants` | Tüm tenantları listele |
| `GET` | `/api/v1/tenants/{id}` | Tenant detayı |
| `POST` | `/api/v1/tenants` | Yeni tenant oluştur |
| `PUT` | `/api/v1/tenants/{id}` | Tenant güncelle |
| `DELETE` | `/api/v1/tenants/{id}` | Tenant sil |

---

### Workflows

| Method | Yol | Açıklama |
|---|---|---|
| `GET` | `/api/v1/workflows` | Tenant'ın workflow'larını listele |
| `GET` | `/api/v1/workflows/{id}` | Workflow detayı (nodes + edges dahil) |
| `POST` | `/api/v1/workflows` | Yeni workflow kaydet |
| `PUT` | `/api/v1/workflows/{id}` | Workflow güncelle (nodes + edges) |
| `DELETE` | `/api/v1/workflows/{id}` | Workflow sil |
| `PATCH` | `/api/v1/workflows/{id}/enable` | Workflow'u etkinleştir |
| `PATCH` | `/api/v1/workflows/{id}/disable` | Workflow'u devre dışı bırak |
| `GET` | `/api/v1/workflows/{id}/runs` | Son çalışma kayıtları (`?limit=20`) |
| `POST` | `/api/v1/workflows/{id}/trigger` | Workflow'u manuel tetikle (test) |

---

### API Endpoint Yönetimi

| Method | Yol | Açıklama |
|---|---|---|
| `GET` | `/api/v1/endpoints` | Kayıtlı endpointleri listele |
| `GET` | `/api/v1/endpoints/{id}` | Endpoint detayı |
| `POST` | `/api/v1/endpoints` | Yeni endpoint tanımla |
| `PATCH` | `/api/v1/endpoints/{id}/enable` | Endpoint'i etkinleştir |
| `PATCH` | `/api/v1/endpoints/{id}/disable` | Endpoint'i devre dışı bırak |
| `DELETE` | `/api/v1/endpoints/{id}` | Endpoint sil |

---

### Cari Kontrol (X-API-Key ile, dış sistemler için)

| Method | Yol | Auth | Açıklama |
|---|---|---|---|
| `POST` | `/api/v1/cari-kontrol` | `X-API-Key` | Cari kontrolü başlat |

**İstek:**
```json
POST /api/v1/cari-kontrol
X-API-Key: test-api-key-arcelik-001

{
  "cariKod": "ARCE-001"
}
```

**Yanıt (test modu — her zaman true):**
```json
{
  "success": true,
  "cariKontrolEdilecekMi": true,
  "cariKod": "ARCE-001"
}
```

---

### Agent Endpoints (X-API-Key ile)

| Method | Yol | Açıklama |
|---|---|---|
| `GET` | `/api/v1/agent/status` | Agent online/offline durumu (JWT) |
| `POST` | `/api/v1/agent/heartbeat` | Agent heartbeat sinyali (API-Key) |
| `POST` | `/api/v1/agent/process` | Agent model işleme test endpoint'i (API-Key) |

**Agent process isteği:**
```json
POST /api/v1/agent/process
X-API-Key: test-api-key-arcelik-001

{
  "runId": "run-test-001",
  "model": {
    "cariKod": "ARCE-001",
    "cariKontrolEdilecekMi": true,
    "orderAmount": 1500.00
  }
}
```

**Yanıt:**
```json
{
  "success": true,
  "cariMevcut": true,
  "result": {
    "runId": "run-test-001",
    "processed": true,
    "cariMevcut": true
  }
}
```

---

## Mimari Notlar

### Clean Architecture Katmanları

```
HTTP Request
    ↓
Middleware (CORS → Logger → Auth/APIKey)
    ↓
Handler (HTTP decode/encode)
    ↓
Service (İş mantığı)
    ↓
Repository Interface (domain paketi)
    ↓
Repository Implementation (memory / postgres)
```

### Cari Kontrol Akışı

```
Dış Sistem
    │ POST /api/v1/cari-kontrol { cariKod: "X" }
    ↓
Cloud Backend (bu proje)
    │ cariKontrolEdilecekMi: true ekler
    │ { success: true, cariKontrolEdilecekMi: true }
    ↓
Geri döner + Agent'a Model gönderir
    │ POST /api/v1/agent/process { model: { cariKod, cariKontrolEdilecekMi: true } }
    ↓
Yerel Agent (LOGO ERP makinesinde)
    │ ERP veritabanını sorgular
    │ { success: true, cariMevcut: true/false }
    ↓
Cloud Backend workflow adımını tamamlar
```

### Production'a Geçiş İçin

1. `internal/repository/memory/store.go` yerine `internal/repository/postgres/` yazın
2. `JWT_SECRET` env değişkenini güvenli rastgele bir değerle değiştirin
3. `API_KEY_*` değişkenlerini bir secrets manager'dan alın
4. CORS origin'ini production domain'inize kısıtlayın
