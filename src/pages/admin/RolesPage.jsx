import { useState } from "react";
import { Shield, Check, X, Plus, Edit2, Users, Trash2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { mockRoles } from "../../lib/mockData";

const PERMISSION_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "Kullanıcı Yönetimi" },
  { key: "logs", label: "Entegrasyon Logları" },
  { key: "mappings", label: "Mapping & Kurallar" },
  { key: "settings", label: "Ayarlar" },
];

function PermIcon({ has }) {
  return has ? (
    <Check size={13} className="text-emerald-600" />
  ) : (
    <X size={13} className="text-muted-foreground/40" />
  );
}

const emptyPermissions = () =>
  Object.fromEntries(PERMISSION_MODULES.map((m) => [m.key, { view: false, manage: false }]));

function RoleModal({ role, onClose, onSave }) {
  const isEdit = !!role;
  const [name, setName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [permissions, setPermissions] = useState(
    role?.permissions ? JSON.parse(JSON.stringify(role.permissions)) : emptyPermissions()
  );

  const togglePerm = (moduleKey, permKey) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], [permKey]: !prev[moduleKey][permKey] },
    }));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim(), permissions });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {isEdit ? "Rolü Düzenle" : "Yeni Rol Oluştur"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEdit ? `"${role.name}" rolünü güncelliyorsunuz` : "Sisteme yeni bir rol ekleyin"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Rol Adı"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Muhasebe Uzmanı"
            />
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Açıklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bu rolün amacını açıklayın..."
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-3">İzin Matrisi</p>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modül</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">Görüntüleme</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">Yönetim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {PERMISSION_MODULES.map((mod) => {
                    const perms = permissions[mod.key] || { view: false, manage: false };
                    return (
                      <tr key={mod.key} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium text-foreground">{mod.label}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <button
                              onClick={() => togglePerm(mod.key, "view")}
                              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${perms.view ? "bg-emerald-100 hover:bg-emerald-200" : "bg-muted hover:bg-muted/80"}`}
                            >
                              {perms.view ? <Check size={14} className="text-emerald-600" /> : <X size={14} className="text-muted-foreground/40" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <button
                              onClick={() => togglePerm(mod.key, "manage")}
                              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${perms.manage ? "bg-emerald-100 hover:bg-emerald-200" : "bg-muted hover:bg-muted/80"}`}
                            >
                              {perms.manage ? <Check size={14} className="text-emerald-600" /> : <X size={14} className="text-muted-foreground/40" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">İzin kutucuklarına tıklayarak açıp kapatabilirsiniz.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Save size={14} />
            {isEdit ? "Değişiklikleri Kaydet" : "Rol Oluştur"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RolesPage() {
  const [roles, setRoles] = useState(mockRoles);
  const [selectedRole, setSelectedRole] = useState(mockRoles[0]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const handleCreate = (data) => {
    const newRole = { id: `role-${Date.now()}`, userCount: 0, ...data };
    setRoles((prev) => [...prev, newRole]);
    setCreateModalOpen(false);
  };

  const handleEdit = (data) => {
    const updated = roles.map((r) => (r.id === editingRole.id ? { ...r, ...data } : r));
    setRoles(updated);
    if (selectedRole.id === editingRole.id) setSelectedRole({ ...editingRole, ...data });
    setEditingRole(null);
  };

  const handleDelete = (roleId) => {
    const updated = roles.filter((r) => r.id !== roleId);
    setRoles(updated);
    if (selectedRole.id === roleId && updated.length > 0) setSelectedRole(updated[0]);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Rol & Yetki Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sistem genelinde geçerli rolleri ve izin matrisini yönetin
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus size={15} />
          Yeni Rol Oluştur
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Role list */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Tanımlı Roller ({roles.length})
          </p>
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={`w-full rounded-xl border p-4 text-left transition-all ${
                selectedRole.id === role.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-white hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${selectedRole.id === role.id ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600"}`}>
                    <Shield size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{role.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Users size={10} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{role.userCount} kullanıcı</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingRole(role); }}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-muted-foreground hover:text-blue-600 transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 size={12} />
                  </button>
                  {role.userCount === 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(role.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{role.description}</p>
            </button>
          ))}
        </div>

        {/* Permission matrix */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield size={16} className="text-primary" />
                    {selectedRole.name}
                  </CardTitle>
                  <CardDescription className="mt-1">{selectedRole.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info">
                    <Users size={10} />
                    {selectedRole.userCount} kullanıcı
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setEditingRole(selectedRole)}>
                    <Edit2 size={13} />
                    Düzenle
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modül</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Görüntüleme</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Yönetim (Yazma)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {PERMISSION_MODULES.map((mod) => {
                      const perms = selectedRole.permissions[mod.key] || {};
                      return (
                        <tr key={mod.key} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-foreground">{mod.label}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-center">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${perms.view ? "bg-emerald-100" : "bg-muted"}`}>
                                <PermIcon has={perms.view} />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-center">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${perms.manage ? "bg-emerald-100" : "bg-muted"}`}>
                                <PermIcon has={perms.manage} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">İzin Tanımları</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Check size={12} className="text-emerald-600" />, bg: "bg-emerald-100", label: "Görüntüleme", desc: "Ekranı açıp verileri okuyabilir" },
                { icon: <Check size={12} className="text-emerald-600" />, bg: "bg-emerald-100", label: "Yönetim", desc: "Ekleme, düzenleme, silme yapabilir" },
                { icon: <X size={12} className="text-muted-foreground/40" />, bg: "bg-muted", label: "Kısıtlı", desc: "Bu işleme erişim yok" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${item.bg} flex-shrink-0 mt-0.5`}>{item.icon}</div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {createModalOpen && <RoleModal onClose={() => setCreateModalOpen(false)} onSave={handleCreate} />}
      {editingRole && <RoleModal role={editingRole} onClose={() => setEditingRole(null)} onSave={handleEdit} />}
    </div>
  );
}
