import { useState, useRef, useEffect } from "react";
import {
  Bell, Search, ChevronDown, LogOut, User, Settings,
  X, CheckCheck, AlertTriangle, Info, CheckCircle2, AlertCircle,
  LayoutDashboard, Shield, Activity, Zap, Users, Building2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const ROUTE_TITLES = {
  "/admin": "Sistem Özeti",
  "/admin/tenants": "Tenant Yönetimi",
  "/admin/tenants/new": "Yeni Tenant Ekle",
  "/admin/roles": "Rol & Yetki Yönetimi",
  "/admin/logs": "Sistem Logları",
  "/admin/analytics": "Analizler & Raporlar",
  "/admin/settings": "Sistem Ayarları",
  "/admin/workflows": "Workflow Builder",
  "/tenant": "Tenant Dashboard",
  "/tenant/users": "Kullanıcı Yönetimi",
  "/tenant/logs": "Entegrasyon Logları",
  "/tenant/mappings": "Mapping & Kural Ayarları",
  "/tenant/workflows": "Workflow Builder",
  "/tenant/settings": "Tenant Ayarları",
};

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "Agent Bağlantısı Kesildi", desc: "Migros Ticaret - Agent çevrimdışı", time: "5 dk önce", type: "error", read: false },
  { id: 2, title: "Yeni Tenant Kaydı", desc: "Defacto A.Ş. sisteme eklendi", time: "1 saat önce", type: "info", read: false },
  { id: 3, title: "Entegrasyon Hatası", desc: "Hepsiburada - 24 başarısız işlem", time: "2 saat önce", type: "warning", read: false },
  { id: 4, title: "Yedekleme Tamamlandı", desc: "Günlük sistem yedeği alındı", time: "6 saat önce", type: "success", read: true },
  { id: 5, title: "Agent Güncellendi", desc: "v2.4.1 yayınlandı", time: "1 gün önce", type: "info", read: true },
];

const SEARCH_PAGES = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, group: "Admin" },
  { label: "Tenant Yönetimi", path: "/admin/tenants", icon: Building2, group: "Admin" },
  { label: "Roller & Yetkiler", path: "/admin/roles", icon: Shield, group: "Admin" },
  { label: "Sistem Logları", path: "/admin/logs", icon: Activity, group: "Admin" },
  { label: "Dashboard", path: "/tenant", icon: LayoutDashboard, group: "Tenant" },
  { label: "Kullanıcılar", path: "/tenant/users", icon: Users, group: "Tenant" },
  { label: "Entegrasyon Logları", path: "/tenant/logs", icon: Activity, group: "Tenant" },
  { label: "Mapping & Kurallar", path: "/tenant/mappings", icon: Zap, group: "Tenant" },
  { label: "Workflow Builder", path: "/tenant/workflows", icon: Zap, group: "Tenant" },
];

function NotifIcon({ type }) {
  if (type === "error") return <AlertCircle size={14} className="text-red-500" />;
  if (type === "warning") return <AlertTriangle size={14} className="text-amber-500" />;
  if (type === "success") return <CheckCircle2 size={14} className="text-emerald-500" />;
  return <Info size={14} className="text-blue-500" />;
}

export default function Header() {
  const { user, isSuperAdmin, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const title = ROUTE_TITLES[location.pathname] || "NexusBridge";

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState("");

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const filteredSearch = searchQuery.trim()
    ? SEARCH_PAGES.filter((p) => p.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : SEARCH_PAGES;

  const handleSearchNav = (path) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border bg-white px-6 flex-shrink-0 relative z-20">
        {/* Left: Page title */}
        <div>
          <h1 className="text-base font-semibold text-foreground">{title}</h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            <Search size={14} />
            <span className="hidden sm:block">Ara...</span>
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border px-1.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen((o) => !o); setUserMenuOpen(false); }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-white shadow-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">Bildirimler</p>
                  <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <CheckCheck size={12} />
                    Tümünü okundu işaretle
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors border-b border-border last:border-0 ${!n.read ? "bg-blue-50/50" : ""}`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <NotifIcon type={n.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{n.desc}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{n.time}</p>
                      </div>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="h-6 w-px bg-border mx-1" />

          {/* User menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => { setUserMenuOpen((o) => !o); setNotifOpen(false); }}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {isSuperAdmin() ? "Super Admin" : "Tenant Admin"}
                </p>
              </div>
              <ChevronDown size={13} className={`text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-white shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { navigate(isSuperAdmin() ? "/admin/settings" : "/tenant/settings"); setUserMenuOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Settings size={14} className="text-muted-foreground" />
                    Ayarlar
                  </button>
                  <button
                    onClick={() => { navigate(isSuperAdmin() ? "/admin/settings" : "/tenant/settings"); setUserMenuOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <User size={14} className="text-muted-foreground" />
                    Profil
                  </button>
                </div>
                <div className="border-t border-border p-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setSearchOpen(false); setSearchQuery(""); } }}
        >
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={16} className="text-muted-foreground flex-shrink-0" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sayfa veya özellik ara..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                <X size={16} className="text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto py-2">
              {filteredSearch.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Sonuç bulunamadı</p>
              ) : (
                filteredSearch.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleSearchNav(item.path)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                      <item.icon size={13} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">{item.group}</span>
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-border px-4 py-2 flex items-center gap-4">
              <span className="text-[10px] text-muted-foreground"><kbd className="border border-border rounded px-1">↵</kbd> Seç</span>
              <span className="text-[10px] text-muted-foreground"><kbd className="border border-border rounded px-1">Esc</kbd> Kapat</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
