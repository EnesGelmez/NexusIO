import { create } from "zustand";

/* ─── Initial mock workflows (same structure as WorkflowListPage used to have) ─── */
const INITIAL_WORKFLOWS = [
  {
    id: "wf-001",
    name: "Cari Oluşturma (Tam Akış)",
    description: "HTTP JSON → Alan Eşleştirme → Doğrulama → e-Mükellef → Merge → Agent İsteği",
    enabled: true,
    trigger: "HTTP / JSON Tetikleyici",
    nodeCount: 8,
    connectionCount: 8,
    createdAt: "2026-02-10",
    lastRun: "2026-03-05T08:42:11Z",
    nodes: [],
    connections: [],
    stats: {
      totalRuns: 1284, successRuns: 1251, failedRuns: 33,
      avgDurationMs: 420, lastDayRuns: 87, lastDaySuccess: 85, lastDayFailed: 2, trend: "up",
    },
  },
  {
    id: "wf-002",
    name: "E-Ticaret → Fatura",
    description: "Trendyol sipariş gelince fatura modeli oluştur, Agent'a ilet",
    enabled: true,
    trigger: "E-Ticaret Siparişi",
    nodeCount: 6,
    connectionCount: 5,
    createdAt: "2026-02-18",
    lastRun: "2026-03-05T09:01:44Z",
    nodes: [],
    connections: [],
    stats: {
      totalRuns: 5620, successRuns: 5540, failedRuns: 80,
      avgDurationMs: 310, lastDayRuns: 312, lastDaySuccess: 308, lastDayFailed: 4, trend: "up",
    },
  },
  {
    id: "wf-003",
    name: "Müşteri Email Kontrol",
    description: "Email adresi sisteme kayıtlı mı kontrol et, yeni ise cari oluştur",
    enabled: false,
    trigger: "HTTP / JSON Tetikleyici",
    nodeCount: 4,
    connectionCount: 3,
    createdAt: "2026-03-01",
    lastRun: "2026-03-03T14:55:00Z",
    nodes: [],
    connections: [],
    stats: {
      totalRuns: 94, successRuns: 91, failedRuns: 3,
      avgDurationMs: 195, lastDayRuns: 0, lastDaySuccess: 0, lastDayFailed: 0, trend: "neutral",
    },
  },
  {
    id: "wf-004",
    name: "Stok Senkronizasyonu",
    description: "Belirli aralıklarla ERP stok verilerini e-ticaret platformuyla senkronize eder",
    enabled: true,
    trigger: "Zamanlayıcı",
    nodeCount: 5,
    connectionCount: 4,
    createdAt: "2026-02-25",
    lastRun: "2026-03-05T09:00:00Z",
    nodes: [],
    connections: [],
    stats: {
      totalRuns: 432, successRuns: 430, failedRuns: 2,
      avgDurationMs: 880, lastDayRuns: 48, lastDaySuccess: 48, lastDayFailed: 0, trend: "up",
    },
  },
];

export const useWorkflowStore = create((set, get) => ({
  workflows: INITIAL_WORKFLOWS,

  getWorkflow: (id) => get().workflows.find((w) => w.id === id) ?? null,

  /** Create a new empty workflow, returns its id */
  createWorkflow: () => {
    const id = `wf-${Date.now()}`;
    const today = new Date().toISOString().split("T")[0];
    set((state) => ({
      workflows: [
        ...state.workflows,
        {
          id,
          name: "Yeni Workflow",
          description: "",
          enabled: false,
          trigger: "—",
          nodeCount: 0,
          connectionCount: 0,
          createdAt: today,
          lastRun: null,
          nodes: [],
          connections: [],
          stats: {
            totalRuns: 0, successRuns: 0, failedRuns: 0,
            avgDurationMs: 0, lastDayRuns: 0, lastDaySuccess: 0, lastDayFailed: 0, trend: "neutral",
          },
        },
      ],
    }));
    return id;
  },

  /** Save builder state back to the workflow */
  saveWorkflow: (id, { name, nodes, connections }) => {
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === id
          ? {
              ...w,
              name,
              nodes,
              connections,
              nodeCount: nodes.length,
              connectionCount: connections.length,
              lastRun: new Date().toISOString(),
              description: w.description || "",
            }
          : w
      ),
    }));
  },

  toggleEnabled: (id) => {
    set((state) => ({
      workflows: state.workflows.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)),
    }));
  },

  deleteWorkflow: (id) => {
    set((state) => ({ workflows: state.workflows.filter((w) => w.id !== id) }));
  },
}));
