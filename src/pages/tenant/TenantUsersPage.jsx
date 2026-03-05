import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Mail, Phone, UserCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Input } from "../../components/ui/Input";
import { mockTenantUsers, mockRoles } from "../../lib/mockData";
import { formatDate } from "../../lib/utils";

function AddUserModal({ onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", roleId: "r2" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full mx-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 mx-auto mb-4">
            <UserCircle size={28} className="text-emerald-600" />
          </div>
          <h3 className="font-bold text-lg text-foreground">Kullanıcı Eklendi!</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">{form.email} adresine aktivasyon e-postası gönderildi.</p>
          <Button className="w-full" onClick={onClose}>Kapat</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-semibold text-lg text-foreground">Yeni Kullanıcı Ekle</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <Input label="Ad Soyad *" placeholder="Selin Arslan" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="E-posta *" type="email" placeholder="selin@arcelik.com" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
          <Input label="Telefon" placeholder="+90 532 555 0000" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Rol *</label>
            <select
              value={form.roleId}
              onChange={(e) => setForm(p => ({ ...p, roleId: e.target.value }))}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {mockRoles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {mockRoles.find((r) => r.id === form.roleId)?.description}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
            Kullanıcı eklendikten sonra sistem hesabı otomatik oluşturulacak ve e-posta ile bildirim gönderilecektir.
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>İptal</Button>
          <Button className="flex-1" loading={saving} onClick={handleSave} disabled={!form.name || !form.email}>
            Kullanıcı Ekle
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TenantUsersPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = mockTenantUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5">
      {showModal && <AddUserModal onClose={() => setShowModal(false)} />}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Kullanıcı Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Şirket çalışanlarını sisteme ekleyin ve rollerini atayın
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={15} />
          Kullanıcı Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="İsim veya e-posta ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} kullanıcı
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Kullanıcı</TableHead>
                <TableHead>İletişim</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Son Giriş</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 flex-shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <p className="font-medium text-sm text-foreground">{user.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-foreground">{user.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "Tenant Admin" ? "purple" : "info"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "success" : "secondary"}>
                      {user.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(user.lastLogin)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
