import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Building2,
  Wifi,
  WifiOff,
  Eye,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge, StatusDot } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { mockTenants } from "../../lib/mockData";
import { formatDate } from "../../lib/utils";

export default function TenantListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | online | offline
  const [sortField, setSortField] = useState("companyName");
  const [sortDir, setSortDir] = useState("asc");
  const [openMenu, setOpenMenu] = useState(null);

  const filtered = mockTenants
    .filter((t) => {
      const matchSearch =
        t.companyName.toLowerCase().includes(search.toLowerCase()) ||
        t.taxNumber.includes(search) ||
        t.contactName.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || t.agentStatus === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }) =>
    sortField === field ? (
      sortDir === "asc" ? (
        <ChevronUp size={12} className="text-primary" />
      ) : (
        <ChevronDown size={12} className="text-primary" />
      )
    ) : (
      <ChevronDown size={12} className="opacity-30" />
    );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tenant Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sistemdeki tüm müşteri tenantlarını görüntüle ve yönet
          </p>
        </div>
        <Link to="/admin/tenants/new">
          <Button>
            <Plus size={15} />
            Yeni Tenant Ekle
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Toplam Tenant", value: mockTenants.length, icon: Building2, color: "text-blue-600 bg-blue-50" },
          { label: "Online Agent", value: mockTenants.filter((t) => t.agentStatus === "online").length, icon: Wifi, color: "text-emerald-600 bg-emerald-50" },
          { label: "Offline Agent", value: mockTenants.filter((t) => t.agentStatus === "offline").length, icon: WifiOff, color: "text-red-600 bg-red-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Şirket adı, VKN, iletişim..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Status filter */}
            <div className="flex gap-1.5">
              {[
                { value: "all", label: "Tümü" },
                { value: "online", label: "Online" },
                { value: "offline", label: "Offline" },
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

            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {filtered.length} tenant gösteriliyor
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("companyName")}
                >
                  <span className="flex items-center gap-1">
                    Şirket <SortIcon field="companyName" />
                  </span>
                </TableHead>
                <TableHead>Vergi No</TableHead>
                <TableHead>İletişim</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>ERP DB</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Başarı Oranı</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("createdAt")}
                >
                  <span className="flex items-center gap-1">
                    Kayıt Tarihi <SortIcon field="createdAt" />
                  </span>
                </TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 flex-shrink-0">
                        {tenant.companyName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {tenant.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {tenant.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-foreground">
                      {tenant.taxNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-foreground">{tenant.contactName}</p>
                    <p className="text-xs text-muted-foreground">
                      {tenant.contactEmail}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tenant.agentStatus === "online" ? "success" : "error"
                      }
                    >
                      <StatusDot status={tenant.agentStatus} />
                      {tenant.agentStatus === "online" ? "Online" : "Offline"}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      v{tenant.agentVersion}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-foreground">
                      {tenant.logoErpDb}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {tenant.logoErpVersion}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tenant.plan === "Enterprise"
                          ? "purple"
                          : tenant.plan === "Business"
                          ? "info"
                          : "secondary"
                      }
                    >
                      {tenant.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            tenant.stats.successRate >= 99
                              ? "bg-emerald-500"
                              : tenant.stats.successRate >= 97
                              ? "bg-blue-500"
                              : "bg-yellow-500"
                          }`}
                          style={{ width: `${tenant.stats.successRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        %{tenant.stats.successRate}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Detay">
                        <Eye size={14} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Düzenle">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 size={32} className="text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">
                Tenant bulunamadı
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Arama kriterlerinizi değiştirmeyi deneyin
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
