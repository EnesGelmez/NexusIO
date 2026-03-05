import { useState } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { mockLogs } from "../../lib/mockData";
import { formatDate } from "../../lib/utils";

const TYPE_LABELS = { ORDER: "Sipariş", CUSTOMER: "Cari", INVOICE: "Fatura" };
const TYPE_COLORS = {
  ORDER: "info",
  CUSTOMER: "success",
  INVOICE: "purple",
};

function StepStatus({ status }) {
  if (status === "success") return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (status === "error") return <XCircle size={14} className="text-red-500" />;
  if (status === "processing") return <Loader2 size={14} className="text-blue-500 animate-spin" />;
  return <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />;
}

function LogRow({ log }) {
  const [open, setOpen] = useState(false);
  const statusIcon = {
    success: <CheckCircle2 size={15} className="text-emerald-500" />,
    error: <XCircle size={15} className="text-red-500" />,
    processing: <Loader2 size={15} className="text-blue-500 animate-spin" />,
  }[log.status];

  return (
    <>
      <tr
        className="border-b border-border hover:bg-muted/20 cursor-pointer transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {statusIcon}
            <span className="font-mono text-xs text-foreground">{log.requestId}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <Badge variant={TYPE_COLORS[log.type]}>{TYPE_LABELS[log.type]}</Badge>
        </td>
        <td className="px-4 py-3 text-sm text-foreground">{log.source}</td>
        <td className="px-4 py-3">
          <Badge
            variant={
              log.status === "success"
                ? "success"
                : log.status === "error"
                ? "error"
                : "info"
            }
          >
            {log.status === "success"
              ? "Başarılı"
              : log.status === "error"
              ? "Hata"
              : "İşleniyor"}
          </Badge>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">
          {formatDate(log.startedAt)}
        </td>
        <td className="px-4 py-3 text-sm text-foreground">
          {log.duration ? `${log.duration}ms` : "—"}
        </td>
        <td className="px-4 py-3">
          {open ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </td>
      </tr>

      {open && (
        <tr className="border-b border-border bg-slate-50">
          <td colSpan={7} className="px-6 py-5">
            <div className="space-y-4">
              {/* Steps */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  İşlem Adımları
                </p>
                <div className="flex items-start gap-2">
                  {log.steps.map((step, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 flex-shrink-0 ${
                          step.status === "success"
                            ? "border-emerald-500 bg-emerald-50"
                            : step.status === "error"
                            ? "border-red-500 bg-red-50"
                            : step.status === "processing"
                            ? "border-blue-500 bg-blue-50"
                            : "border-muted-foreground/20 bg-muted"
                        }`}
                      >
                        <StepStatus status={step.status} />
                      </div>
                      <p className="text-[10px] text-center text-muted-foreground leading-tight px-1">
                        {step.name}
                      </p>
                      {step.duration != null && (
                        <p className="text-[9px] text-muted-foreground/50">
                          {step.duration}ms
                        </p>
                      )}
                      {i < log.steps.length - 1 && (
                        <div className="absolute" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Connecting lines */}
                <div className="flex items-center mt-1 px-4">
                  {log.steps.map((_, i) =>
                    i < log.steps.length - 1 ? (
                      <div key={i} className="flex-1 flex items-center">
                        <div className="h-0.5 w-full bg-border" />
                        <ArrowRight size={8} className="text-muted-foreground flex-shrink-0" />
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Payload */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Payload Özeti
                  </p>
                  <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-400">
                    {JSON.stringify(log.payload, null, 2)}
                  </div>
                </div>

                {/* Error */}
                {log.errorMessage && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Hata Detayı
                    </p>
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                      <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">{log.errorMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function IntegrationLogsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockLogs.filter((log) => {
    const matchSearch =
      log.requestId.toLowerCase().includes(search.toLowerCase()) ||
      log.source.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || log.type === typeFilter;
    const matchStatus = statusFilter === "all" || log.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Entegrasyon Logları</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          API isteklerini ve LOGO ERP aktarım süreçlerini izleyin
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Toplam", count: mockLogs.length, color: "text-blue-600 bg-blue-50" },
          { label: "Başarılı", count: mockLogs.filter((l) => l.status === "success").length, color: "text-emerald-600 bg-emerald-50" },
          { label: "Hatalı", count: mockLogs.filter((l) => l.status === "error").length, color: "text-red-600 bg-red-50" },
          { label: "İşleniyor", count: mockLogs.filter((l) => l.status === "processing").length, color: "text-blue-600 bg-blue-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${s.color.split(" ")[0]}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Request ID veya kaynak ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-1.5">
              {[
                { value: "all", label: "Tüm Türler" },
                { value: "ORDER", label: "Sipariş" },
                { value: "CUSTOMER", label: "Cari" },
                { value: "INVOICE", label: "Fatura" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    typeFilter === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              {[
                { value: "all", label: "Tüm Durum" },
                { value: "success", label: "Başarılı" },
                { value: "error", label: "Hatalı" },
                { value: "processing", label: "İşleniyor" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Request ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tür
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Kaynak
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Başlangıç
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Süre
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock size={32} className="text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Log bulunamadı</p>
              <p className="text-xs text-muted-foreground mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
