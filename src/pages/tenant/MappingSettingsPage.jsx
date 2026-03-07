import { useState } from "react";
import { Save, Info, Zap, Database, FileText, Settings2, Plus, Trash2, ToggleLeft, ToggleRight, X, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";

const DEFAULT_MAPPING_SETTINGS = {
  generalSettings: {
    autoGenerateCustomerCode: true,
    customerCodePrefix: "",
    customerCodePadding: 6,
    defaultWarehouseCode: "",
    defaultCurrencyCode: "TRY",
    autoCreateNonExistingCustomers: false,
    syncFrequencyMinutes: 5,
  },
  orderSettings: {
    defaultOrderType: "1",
    defaultSalesman: "",
    defaultDivision: "1",
    autoApproveOrders: false,
    orderSourceMapping: {},
  },
  invoiceSettings: {
    autoCreateInvoice: false,
    invoicePrefix: "",
    defaultPaymentTerm: 30,
    vatExemptionEnabled: false,
  },
  fieldMappings: [],
};

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 ${
          checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

const TRANSFORMATION_LABELS = {
  NONE: "Dönüşüm Yok",
  LOWERCASE: "Küçük Harf",
  UPPERCASE: "Büyük Harf",
  FORMAT_PHONE_TR: "TR Telefon Formatı",
  ROUND_2: "2 Ondalık Yuvarla",
};

function AddFieldModal({ onClose, onSave }) {
  const [sourceField, setSourceField] = useState("");
  const [targetField, setTargetField] = useState("");
  const [transformation, setTransformation] = useState("NONE");

  const handleSave = () => {
    if (!sourceField.trim() || !targetField.trim()) return;
    onSave({ sourceField: sourceField.trim(), targetField: targetField.trim(), transformation, isActive: true });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Database size={14} />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Yeni Alan Eşleştirmesi Ekle</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Input
            label="Kaynak Alan (API)"
            value={sourceField}
            onChange={(e) => setSourceField(e.target.value)}
            placeholder="Örn: customer.phone_number"
            hint="Gelen API verisindeki alan adı"
          />
          <Input
            label="Hedef Alan (Logo ERP)"
            value={targetField}
            onChange={(e) => setTargetField(e.target.value)}
            placeholder="Örn: CLIENTREF.PHONE"
            hint="Logo ERP'deki karşılık gelen alan"
          />
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Dönüşüm Kuralı</label>
            <select
              value={transformation}
              onChange={(e) => setTransformation(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {Object.entries(TRANSFORMATION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={handleSave} disabled={!sourceField.trim() || !targetField.trim()}>
            <Plus size={14} />
            Alan Ekle
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MappingSettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_MAPPING_SETTINGS);
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addFieldOpen, setAddFieldOpen] = useState(false);

  const update = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: "general", label: "Genel Ayarlar", icon: Settings2 },
    { id: "orders", label: "Sipariş Ayarları", icon: Zap },
    { id: "invoices", label: "Fatura Ayarları", icon: FileText },
    { id: "fields", label: "Alan Eşleştirme", icon: Database },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Mapping & Kural Ayarları</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Entegrasyon kurallarınızı ve alan eşleştirmelerini özelleştirin
          </p>
        </div>
        <Button onClick={handleSave} loading={saving} variant={saved ? "success" : "default"}>
          <Save size={14} />
          {saved ? "Kaydedildi!" : saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cari (Müşteri) Ayarları</CardTitle>
              <CardDescription>LOGO ERP cari kartı oluşturma kuralları</CardDescription>
            </CardHeader>
            <CardContent>
              <ToggleSwitch
                checked={settings.generalSettings.autoGenerateCustomerCode}
                onChange={(v) => update("generalSettings", "autoGenerateCustomerCode", v)}
                label="Cari Kodu Otomatik Üretilsin"
                description="Yeni carilerde otomatik sıralı kod oluşturur"
              />
              <ToggleSwitch
                checked={settings.generalSettings.autoCreateNonExistingCustomers}
                onChange={(v) => update("generalSettings", "autoCreateNonExistingCustomers", v)}
                label="Yeni Carileri Otomatik Oluştur"
                description="Sistemde olmayan carileri otomatik kaydet"
              />

              {settings.generalSettings.autoGenerateCustomerCode && (
                <div className="pt-4 space-y-3 border-t border-border mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Cari Kodu Öneki"
                      value={settings.generalSettings.customerCodePrefix}
                      onChange={(e) => update("generalSettings", "customerCodePrefix", e.target.value.toUpperCase())}
                      placeholder="ARC"
                      hint="Otomatik oluşturulan kodların başına eklenir"
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-foreground">
                        Hane Sayısı
                      </label>
                      <select
                        value={settings.generalSettings.customerCodePadding}
                        onChange={(e) => update("generalSettings", "customerCodePadding", parseInt(e.target.value))}
                        className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {[4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>{n} hane</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                    <p className="text-xs text-blue-700">
                      <strong>Örnek:</strong>{" "}
                      {settings.generalSettings.customerCodePrefix}
                      {"0".repeat(settings.generalSettings.customerCodePadding - 1)}1
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Varsayılan Değerler</CardTitle>
              <CardDescription>LOGO ERP aktarımlarında kullanılacak sabit değerler</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Varsayılan Depo Kodu"
                value={settings.generalSettings.defaultWarehouseCode}
                onChange={(e) => update("generalSettings", "defaultWarehouseCode", e.target.value)}
                placeholder="D001"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Varsayılan Para Birimi</label>
                <select
                  value={settings.generalSettings.defaultCurrencyCode}
                  onChange={(e) => update("generalSettings", "defaultCurrencyCode", e.target.value)}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {["TRY", "USD", "EUR", "GBP"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Senkronizasyon Sıklığı</label>
                <select
                  value={settings.generalSettings.syncFrequencyMinutes}
                  onChange={(e) => update("generalSettings", "syncFrequencyMinutes", parseInt(e.target.value))}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {[1, 2, 5, 10, 15, 30].map((m) => (
                    <option key={m} value={m}>Her {m} dakikada bir</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Settings */}
      {activeTab === "orders" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sipariş Oluşturma Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleSwitch
                checked={settings.orderSettings.autoApproveOrders}
                onChange={(v) => update("orderSettings", "autoApproveOrders", v)}
                label="Siparişleri Otomatik Onayla"
                description="Gelen siparişler manuel onay beklemeden işlenir"
              />
              <div className="pt-2 space-y-3">
                <Input
                  label="Varsayılan Satış Elemanı"
                  value={settings.orderSettings.defaultSalesman}
                  onChange={(e) => update("orderSettings", "defaultSalesman", e.target.value)}
                />
                <Input
                  label="Varsayılan Bölüm"
                  value={settings.orderSettings.defaultDivision}
                  onChange={(e) => update("orderSettings", "defaultDivision", e.target.value)}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Varsayılan Sipariş Tipi</label>
                  <select
                    value={settings.orderSettings.defaultOrderType}
                    onChange={(e) => update("orderSettings", "defaultOrderType", e.target.value)}
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="1">1 — Toptan Satış</option>
                    <option value="2">2 — Perakende Satış</option>
                    <option value="3">3 — İhracat</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Kaynak Eşleştirme</CardTitle>
              <CardDescription>Sipariş kaynaklarına Logo ERP kodu atayın</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(settings.orderSettings.orderSourceMapping).map(([platform, code]) => (
                  <div key={platform} className="flex items-center gap-3">
                    <div className="flex-1 rounded-lg border border-border bg-muted/30 px-3 h-9 flex items-center">
                      <span className="text-sm font-medium text-foreground">{platform}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">→</span>
                    <input
                      value={code}
                      onChange={(e) => update("orderSettings", "orderSourceMapping", {
                        ...settings.orderSettings.orderSourceMapping,
                        [platform]: e.target.value.toUpperCase(),
                      })}
                      className="w-20 h-9 rounded-lg border border-input bg-background px-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoice Settings */}
      {activeTab === "invoices" && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Fatura Ayarları</CardTitle>
            <CardDescription>E-Fatura ve Logo ERP fatura oluşturma kuralları</CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleSwitch
              checked={settings.invoiceSettings.autoCreateInvoice}
              onChange={(v) => update("invoiceSettings", "autoCreateInvoice", v)}
              label="Siparişten Otomatik Fatura Oluştur"
              description="Onaylanan siparişler için otomatik fatura kesti"
            />
            <ToggleSwitch
              checked={settings.invoiceSettings.vatExemptionEnabled}
              onChange={(v) => update("invoiceSettings", "vatExemptionEnabled", v)}
              label="KDV Muafiyetini Etkinleştir"
              description="E-Faturalarda KDV muafiyeti uygula"
            />
            <div className="pt-4 space-y-3 border-t border-border mt-2">
              <Input
                label="Fatura Öneki"
                value={settings.invoiceSettings.invoicePrefix}
                onChange={(e) => update("invoiceSettings", "invoicePrefix", e.target.value.toUpperCase())}
              />
              <Input
                label="Varsayılan Ödeme Vadesi (Gün)"
                type="number"
                value={settings.invoiceSettings.defaultPaymentTerm}
                onChange={(e) => update("invoiceSettings", "defaultPaymentTerm", parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Mappings */}
      {activeTab === "fields" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Alan Eşleştirme Kuralları</CardTitle>
                <CardDescription>Gelen API alanlarını Logo ERP alanlarıyla eşleştirin</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setAddFieldOpen(true)}>
                <Plus size={13} />
                Alan Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Kaynak Alan", "Logo ERP Alanı", "Dönüşüm", "Durum", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {settings.fieldMappings.map((mapping, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="px-5 py-3 font-mono text-xs text-blue-600">
                      {mapping.sourceField}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-purple-600">
                      {mapping.targetField}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {TRANSFORMATION_LABELS[mapping.transformation]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => {
                          const updated = [...settings.fieldMappings];
                          updated[idx] = { ...updated[idx], isActive: !updated[idx].isActive };
                          setSettings((p) => ({ ...p, fieldMappings: updated }));
                        }}
                        className="flex items-center gap-1.5"
                      >
                        {mapping.isActive ? (
                          <>
                            <ToggleRight size={18} className="text-primary" />
                            <span className="text-xs text-primary font-medium">Aktif</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={18} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Pasif</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => {
                          setSettings((p) => ({
                            ...p,
                            fieldMappings: p.fieldMappings.filter((_, i) => i !== idx),
                          }));
                        }}
                        className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {addFieldOpen && (
        <AddFieldModal
          onClose={() => setAddFieldOpen(false)}
          onSave={(newMapping) => {
            setSettings((p) => ({ ...p, fieldMappings: [...p.fieldMappings, newMapping] }));
            setAddFieldOpen(false);
          }}
        />
      )}
    </div>
  );
}
