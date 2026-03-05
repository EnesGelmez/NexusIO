import {
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  Activity,
  Clock,
  Package,
  Users,
  FileText,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge, StatusDot } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { mockTenantStats } from "../../lib/mockData";

const TYPE_LABELS = { ORDER: "Sipariş", CUSTOMER: "Cari", INVOICE: "Fatura" };
const TYPE_COLORS = {
  ORDER: "badge-blue",
  CUSTOMER: "badge-green",
  INVOICE: "badge-purple",
};

export default function TenantDashboard() {
  const s = mockTenantStats;
  const successRate = (
    (s.last24h.successfulTransactions / s.last24h.totalTransactions) * 100
  ).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tenant Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Arçelik A.Ş. · Entegrasyon durumunuz ve günlük özet
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw size={13} />
          Yenile
        </Button>
      </div>

      {/* Agent Status Banner */}
      <div
        className={`rounded-xl border-2 p-5 flex items-center justify-between ${
          s.agentStatus === "online"
            ? "border-emerald-200 bg-emerald-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              s.agentStatus === "online" ? "bg-emerald-500" : "bg-red-500"
            }`}
          >
            {s.agentStatus === "online" ? (
              <Wifi size={22} className="text-white" />
            ) : (
              <WifiOff size={22} className="text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground text-base">
                Lokal Agent{" "}
                {s.agentStatus === "online" ? "Çevrimiçi" : "Çevrimdışı"}
              </p>
              <Badge variant={s.agentStatus === "online" ? "success" : "error"}>
                <StatusDot status={s.agentStatus} />
                {s.agentStatus === "online" ? "ONLINE" : "OFFLINE"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Versiyon: {s.agentVersion} · ERP: {s.logoErpDb} · Son görülme:{" "}
              {new Date(s.agentLastSeen).toLocaleTimeString("tr-TR")}
            </p>
          </div>
        </div>
        {s.agentStatus === "offline" && (
          <Button variant="destructive" size="sm">
            Destek Talebi Oluştur
          </Button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            icon: Activity,
            label: "Toplam İşlem (24s)",
            value: s.last24h.totalTransactions,
            color: "text-blue-600 bg-blue-50",
          },
          {
            icon: CheckCircle2,
            label: "Başarılı",
            value: s.last24h.successfulTransactions,
            color: "text-emerald-600 bg-emerald-50",
            sub: `%${successRate}`,
          },
          {
            icon: XCircle,
            label: "Hatalı",
            value: s.last24h.failedTransactions,
            color: "text-red-600 bg-red-50",
          },
          {
            icon: Package,
            label: "Sipariş",
            value: s.last24h.orders,
            color: "text-violet-600 bg-violet-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-border p-5 shadow-sm"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-foreground mt-0.5">{stat.label}</p>
            {stat.sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{stat.sub} başarı oranı</p>
            )}
          </div>
        ))}
      </div>

      {/* Row: Type breakdown + Activity feed */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Type breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>İşlem Türü Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Sipariş", count: s.last24h.orders, icon: Package, color: "bg-blue-500" },
              { label: "Cari", count: s.last24h.customers, icon: Users, color: "bg-emerald-500" },
              { label: "Fatura", count: s.last24h.invoices, icon: FileText, color: "bg-purple-500" },
            ].map((item) => {
              const pct = Math.round((item.count / s.last24h.totalTransactions) * 100);
              return (
                <div key={item.label} className="flex items-center gap-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.color} flex-shrink-0`}>
                    <item.icon size={15} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">%{pct}</span>
                </div>
              );
            })}

            <div className="pt-2 flex justify-end">
              <Link to="/tenant/logs">
                <Button variant="ghost" size="sm">
                  Tüm Loglar <ArrowRight size={13} />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Son Aktivite</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {s.recentActivity.map((act, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      act.status === "success" ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  <div className="flex items-center gap-1.5">
                    <span className={`badge text-[10px] ${TYPE_COLORS[act.type]}`}>
                      {TYPE_LABELS[act.type]}
                    </span>
                  </div>
                  <span className="text-sm text-foreground font-mono flex-1 truncate">
                    {act.ref}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Clock size={10} />
                    {act.time}
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
