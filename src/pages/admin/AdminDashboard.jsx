import {
  Building2,
  Activity,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge, StatusDot } from "../../components/ui/Badge";
import { mockAdminStats, mockTenants, mockLogs } from "../../lib/mockData";
import { formatDateShort } from "../../lib/utils";

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
            <ArrowUpRight size={13} />
            {trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniBar({ day, success, error, max }) {
  const total = success + error;
  const successH = Math.round((success / max) * 60);
  const errorH = Math.round((error / max) * 60);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex flex-col-reverse items-center gap-0.5" style={{ height: 64 }}>
        <div
          className="w-7 rounded-sm bg-blue-500 transition-all"
          style={{ height: successH }}
          title={`Başarılı: ${success}`}
        />
        {error > 0 && (
          <div
            className="w-7 rounded-sm bg-red-400 transition-all"
            style={{ height: errorH }}
            title={`Hata: ${error}`}
          />
        )}
      </div>
      <span className="text-[10px] text-muted-foreground">{day}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const stats = mockAdminStats;
  const maxBar = Math.max(...stats.weeklyTrend.map((d) => d.success + d.error));
  const successRate = (
    (stats.last24h.successfulTransactions / stats.last24h.totalTransactions) * 100
  ).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Sistem Özeti</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tüm tenantlar ve entegrasyon durumu — Bugün, {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stat cards row 1 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Toplam Tenant"
          value={stats.totalTenants}
          sub={`${stats.activeTenants} aktif`}
          color="bg-blue-500"
          trend={12}
        />
        <StatCard
          icon={Wifi}
          label="Online Agent"
          value={stats.onlineAgents}
          sub={`${stats.offlineAgents} offline`}
          color="bg-emerald-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="Başarılı (24s)"
          value={stats.last24h.successfulTransactions.toLocaleString("tr-TR")}
          sub={`%${successRate} başarı oranı`}
          color="bg-violet-500"
          trend={3.2}
        />
        <StatCard
          icon={XCircle}
          label="Başarısız (24s)"
          value={stats.last24h.failedTransactions}
          sub="Son 24 saatte"
          color="bg-rose-500"
        />
      </div>

      {/* Row 2: charts + breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Weekly bar chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Haftalık Entegrasyon Trendi</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Son 7 günün işlem özeti
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-500 inline-block" />
                  Başarılı
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-red-400 inline-block" />
                  Hata
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 px-2">
              {stats.weeklyTrend.map((d) => (
                <MiniBar key={d.day} {...d} max={maxBar} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>İşlem Dağılımı (24s)</CardTitle>
            <p className="text-xs text-muted-foreground">Tür bazında</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.transactionTypes.map((type) => {
              const pct = Math.round(
                (type.count / stats.last24h.totalTransactions) * 100
              );
              return (
                <div key={type.type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground">
                      {type.type}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {type.count.toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${type.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">%{pct}</p>
                </div>
              );
            })}

            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock size={12} />
                <span>
                  Ort. süre:{" "}
                  <span className="font-semibold text-foreground">
                    {(stats.last24h.avgProcessingTimeMs / 1000).toFixed(2)}s
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: tenant status + recent logs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Tenant Agent Status */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Durumları</CardTitle>
            <p className="text-xs text-muted-foreground">
              Tüm tenant agent bağlantıları
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {mockTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 flex-shrink-0">
                      {tenant.companyName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tenant.companyName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        v{tenant.agentVersion}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {tenant.stats.pendingJobs > 0 && (
                      <Badge variant="warning">
                        {tenant.stats.pendingJobs} bekleyen
                      </Badge>
                    )}
                    <Badge
                      variant={
                        tenant.agentStatus === "online" ? "success" : "error"
                      }
                    >
                      <StatusDot status={tenant.agentStatus} />
                      {tenant.agentStatus === "online" ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Son İşlemler</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Tüm tenantlardaki son aktivite
                </p>
              </div>
              <Activity size={16} className="text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {mockLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      log.status === "success"
                        ? "bg-emerald-500"
                        : log.status === "error"
                        ? "bg-red-500"
                        : "bg-blue-500 animate-pulse"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {log.requestId}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {log.tenantName} · {log.source}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
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
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDateShort(log.startedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
