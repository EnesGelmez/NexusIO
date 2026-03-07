import { useState, useEffect } from "react";
import { Building2, CheckCircle2, XCircle, PauseCircle, RefreshCw, Mail, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { formatDateShort } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function statusBadge(status) {
  switch (status) {
    case "ACTIVE":   return <Badge variant="success">Aktif</Badge>;
    case "TRIAL":    return <Badge variant="warning">Deneme</Badge>;
    case "SUSPENDED": return <Badge variant="error">Askıya Alındı</Badge>;
    default:         return <Badge variant="secondary">{status}</Badge>;
  }
}

function planLabel(plan) {
  if (!plan) return "—";
  switch (plan) {
    case "TRIAL":      return "Deneme";
    case "STARTER":    return "Başlangıç";
    case "BUSINESS":   return "İş";
    case "ENTERPRISE": return "Kurumsal";
    default:           return plan;
  }
}

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/v1/tenants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  const total      = tenants.length;
  const active     = tenants.filter((t) => t.status === "ACTIVE").length;
  const trial      = tenants.filter((t) => t.status === "TRIAL").length;
  const suspended  = tenants.filter((t) => t.status === "SUSPENDED").length;

  const recent = [...tenants]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sistem Özeti</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={fetchTenants}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Yenile
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Building2}    label="Toplam Tenant"    value={loading ? "…" : total}     sub={loading ? null : `${active} aktif, ${trial} deneme`} color="bg-blue-500" />
        <StatCard icon={CheckCircle2} label="Aktif Tenant"     value={loading ? "…" : active}    sub="Üretim ortamı"     color="bg-emerald-500" />
        <StatCard icon={PauseCircle}  label="Deneme Tenant"    value={loading ? "…" : trial}     sub="Trial planında"    color="bg-amber-500" />
        <StatCard icon={XCircle}      label="Askıya Alınan"    value={loading ? "…" : suspended} sub="Erişim kısıtlı"    color="bg-rose-500" />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Veriler yüklenemedi: {error}
        </div>
      )}

      {/* Tenant list */}
      <Card>
        <CardHeader>
          <CardTitle>Son Eklenen Tenantlar</CardTitle>
          <p className="text-xs text-muted-foreground">En yeni 6 tenant, oluşturulma tarihine göre</p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <RefreshCw size={16} className="animate-spin mr-2" />
              Yükleniyor…
            </div>
          ) : recent.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Henüz tenant yok
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((tenant) => (
                <div key={tenant.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600 flex-shrink-0">
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{tenant.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe size={10} />
                        {tenant.subdomain}
                      </span>
                      {tenant.email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <Mail size={10} />
                          {tenant.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {planLabel(tenant.plan)}
                    </span>
                    {statusBadge(tenant.status)}
                    <span className="text-xs text-muted-foreground hidden md:block ml-1">
                      {formatDateShort(tenant.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
