import { useState } from "react";
import {
  Globe, Plus, Play, Copy, Check, ChevronDown, ChevronRight,
  Code2, Server, Shield, Zap, CheckCircle2, X, Info,
  ArrowRight, ToggleLeft, ToggleRight,
} from "lucide-react";

/* ─── Mock API Endpoints ─── */
const INITIAL_ENDPOINTS = [
  {
    id: "ep-001",
    name: "Cari Kontrol",
    slug: "cari-kontrol",
    method: "POST",
    path: "/api/v1/cari-kontrol",
    description:
      "Gelen cari kodunu/referansını alır ve Agent isteğine cariKontrolEdilecekMi bayrağını ekler. Şimdilik test modunda her zaman true döner.",
    enabled: true,
    auth: "API_KEY",
    category: "Cari",
    parameters: [
      { name: "cariKod", type: "string", required: true, description: "Sorgulanacak cari kodu veya referansı" },
    ],
    response: {
      type: "object",
      example: JSON.stringify(
        { success: true, cariKontrolEdilecekMi: true, cariKod: "ARCE-001" },
        null, 2
      ),
    },
    testMode: true,
    lastCalled: "2026-03-05T09:14:00Z",
    callCount: 0,
  },
  {
    id: "ep-002",
    name: "Workflow Tetikle (JSON)",
    slug: "workflow-trigger-json",
    method: "POST",
    path: "/api/v1/trigger/{workflowId}",
    description: "Belirtilen workflow'u bir JSON payload ile tetikler. Workflow ID URL'de geçer.",
    enabled: true,
    auth: "BEARER",
    category: "Workflow",
    parameters: [
      { name: "workflowId", type: "string", required: true, description: "URL parametresi — tetiklenecek workflow ID'si" },
      { name: "payload",    type: "object", required: true, description: "Workflow'a iletilen JSON verisi" },
    ],
    response: {
      type: "object",
      example: JSON.stringify({ runId: "run-abc123", status: "ACCEPTED", workflowId: "wf-001" }, null, 2),
    },
    testMode: false,
    lastCalled: "2026-03-05T08:42:11Z",
    callCount: 87,
  },
  {
    id: "ep-003",
    name: "Agent Durum Sorgula",
    slug: "agent-status",
    method: "GET",
    path: "/api/v1/agent/status",
    description: "Bağlı yerel Agent'ın online/offline durumunu ve son heartbeat zamanını döner.",
    enabled: true,
    auth: "BEARER",
    category: "Agent",
    parameters: [],
    response: {
      type: "object",
      example: JSON.stringify(
        { agentId: "agent-t1", online: true, version: "1.4.2", lastHeartbeat: "2026-03-05T09:13:55Z" },
        null, 2
      ),
    },
    testMode: false,
    lastCalled: "2026-03-05T09:13:55Z",
    callCount: 1452,
  },
];

const METHOD_COLORS = {
  POST: "bg-blue-500 text-white",
  GET:  "bg-emerald-500 text-white",
  PUT:  "bg-amber-500 text-white",
  DELETE: "bg-rose-500 text-white",
};

const AUTH_LABELS = {
  API_KEY: "API Key",
  BEARER:  "Bearer Token",
  NONE:    "Yok",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ─── Test Panel ─── */
function TestPanel({ endpoint, onClose }) {
  const [inputValues, setInputValues] = useState(
    Object.fromEntries(endpoint.parameters.map((p) => [p.name, p.name === "cariKod" ? "ARCE-001" : ""]))
  );
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTest = async () => {
    setRunning(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 600)); // simulate network
    // Mock response based on endpoint
    const mockResponse = { success: true, ...Object.fromEntries(endpoint.parameters.map((p) => [p.name, inputValues[p.name] || `<${p.name}>`])) };
    if (endpoint.id === "ep-001") {
      mockResponse.cariKontrolEdilecekMi = true;
    }
    setResult({ status: 200, body: JSON.stringify(mockResponse, null, 2), durationMs: 42 });
    setRunning(false);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden max-h-[90vh]">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Play size={14} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Test — {endpoint.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">{endpoint.method} {endpoint.path}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Auth info */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-2">
            <Shield size={13} className="text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700">Auth: <strong>{AUTH_LABELS[endpoint.auth]}</strong> gerekli — test panelinde atlanıyor</p>
          </div>

          {/* Parameters */}
          {endpoint.parameters.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Parametreler</p>
              {endpoint.parameters.map((p) => (
                <div key={p.name}>
                  <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                    <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{p.name}</code>
                    <span className="text-[10px] font-mono text-blue-600">{p.type}</span>
                    {p.required && <span className="text-rose-500 font-bold text-[10px]">zorunlu</span>}
                  </label>
                  <input
                    value={inputValues[p.name] ?? ""}
                    onChange={(e) => setInputValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                    placeholder={`${p.name} değerini girin`}
                    className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Run button */}
          <button
            onClick={handleTest}
            disabled={running}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {running ? (
              <>
                <div className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Çalışıyor...
              </>
            ) : (
              <>
                <Play size={13} />
                İsteği Gönder
              </>
            )}
          </button>

          {/* Response */}
          {result && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">HTTP {result.status} OK</span>
                  <span className="text-[10px] text-emerald-600">{result.durationMs}ms</span>
                </div>
                <button onClick={handleCopy} className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-800">
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? "Kopyalandı" : "Kopyala"}
                </button>
              </div>
              <pre className="px-4 py-3 text-[11px] font-mono text-emerald-800 leading-relaxed overflow-x-auto">
                {result.body}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Endpoint Card ─── */
function EndpointCard({ endpoint, onTest, onToggle }) {
  const [expanded, setExpanded] = useState(endpoint.id === "ep-001"); // Cari Kontrol open by default

  return (
    <div className={`rounded-xl border bg-white transition-all ${endpoint.enabled ? "border-border" : "border-border/50 opacity-60"}`}>
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/20 rounded-xl"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide ${METHOD_COLORS[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-xs font-mono text-foreground flex-1 truncate">{endpoint.path}</code>
        <span className="text-xs font-semibold text-foreground hidden sm:block truncate max-w-36">{endpoint.name}</span>

        {endpoint.testMode && (
          <span className="flex-shrink-0 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5">
            TEST
          </span>
        )}
        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${endpoint.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {endpoint.enabled ? "Aktif" : "Pasif"}
        </span>
        {expanded ? <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" /> : <ChevronRight size={13} className="text-muted-foreground flex-shrink-0" />}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 space-y-4 pt-4">
          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed">{endpoint.description}</p>

          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <p className="text-muted-foreground mb-0.5">Auth</p>
              <p className="font-medium text-foreground flex items-center gap-1"><Shield size={10} />{AUTH_LABELS[endpoint.auth]}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Kategori</p>
              <p className="font-medium text-foreground">{endpoint.category}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Toplam Çağrı</p>
              <p className="font-medium text-foreground">{endpoint.callCount.toLocaleString("tr-TR")}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Son Çağrı</p>
              <p className="font-medium text-foreground">{formatDate(endpoint.lastCalled)}</p>
            </div>
          </div>

          {/* Parameters */}
          {endpoint.parameters.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-foreground mb-2">Parametreler</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="text-left px-3 py-1.5 font-semibold text-muted-foreground">Ad</th>
                      <th className="text-left px-3 py-1.5 font-semibold text-muted-foreground">Tip</th>
                      <th className="text-left px-3 py-1.5 font-semibold text-muted-foreground">Zorunlu</th>
                      <th className="text-left px-3 py-1.5 font-semibold text-muted-foreground">Açıklama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.parameters.map((p) => (
                      <tr key={p.name} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-1.5 font-mono font-semibold text-foreground">{p.name}</td>
                        <td className="px-3 py-1.5 font-mono text-blue-600">{p.type}</td>
                        <td className="px-3 py-1.5">
                          {p.required
                            ? <span className="text-rose-500 font-semibold">Evet</span>
                            : <span className="text-muted-foreground">Hayır</span>}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Response example */}
          <div>
            <p className="text-[11px] font-semibold text-foreground mb-2">Örnek Yanıt</p>
            <pre className="rounded-lg bg-slate-900 text-emerald-400 px-4 py-3 text-[10.5px] font-mono leading-relaxed overflow-x-auto">
              {endpoint.response.example}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onTest(endpoint)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Play size={12} />
              Test Et
            </button>
            <button
              onClick={() => onToggle(endpoint.id)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                endpoint.enabled
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {endpoint.enabled ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
              {endpoint.enabled ? "Devre Dışı Bırak" : "Etkinleştir"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function ApiEndpointsPage() {
  const [endpoints, setEndpoints] = useState(INITIAL_ENDPOINTS);
  const [testTarget, setTestTarget] = useState(null);

  const baseUrl = "https://api.nexusbridge.io/tenant/t1";

  const toggleEndpoint = (id) => {
    setEndpoints((prev) => prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e)));
  };

  const activeCount = endpoints.filter((e) => e.enabled).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">API Uçları</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Platform'a dışarıdan erişim sağlayan bulut API endpoint'leri
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors flex-shrink-0">
          <Plus size={14} />
          Yeni Uç
        </button>
      </div>

      {/* Base URL */}
      <div className="rounded-xl border border-border bg-slate-50 px-4 py-3 flex items-center gap-3">
        <Globe size={15} className="text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">Base URL</p>
          <code className="text-xs font-mono text-foreground">{baseUrl}</code>
        </div>
        <span className="text-[10px] rounded-full bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5">
          {activeCount} / {endpoints.length} aktif
        </span>
      </div>

      {/* Architecture note */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex gap-3">
        <Info size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-blue-700 leading-relaxed">
          <p className="font-semibold">Cari Kontrol Mimarisi</p>
          <p>
            Cari Kontrol endpoint'i gerçek bir sorgulama yapmaz. Gelen isteği alır ve
            <code className="bg-blue-100 px-1 rounded font-mono mx-1">cariKontrolEdilecekMi: true</code>
            bayrağını Agent isteğine ekler. Yerel Agent bu bayrağı görünce cari kontrolünü
            kendi üstlenir — bulut tarafında hiçbir ERP bağlantısı kurulmaz.
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="rounded-full bg-blue-100 px-2 py-0.5 font-mono text-[10px]">İstek Gelir</span>
            <ArrowRight size={10} />
            <span className="rounded-full bg-blue-100 px-2 py-0.5 font-mono text-[10px]">Bayrak Eklenir</span>
            <ArrowRight size={10} />
            <span className="rounded-full bg-blue-100 px-2 py-0.5 font-mono text-[10px]">AgentRequest gönderilir</span>
            <ArrowRight size={10} />
            <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 font-mono text-[10px]">Agent işler</span>
          </div>
        </div>
      </div>

      {/* Endpoints list */}
      <div className="space-y-3">
        {endpoints.map((ep) => (
          <EndpointCard
            key={ep.id}
            endpoint={ep}
            onTest={setTestTarget}
            onToggle={toggleEndpoint}
          />
        ))}
      </div>

      {/* Test modal */}
      {testTarget && (
        <TestPanel endpoint={testTarget} onClose={() => setTestTarget(null)} />
      )}
    </div>
  );
}
