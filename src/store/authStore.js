import { create } from "zustand";
import { persist } from "zustand/middleware";


// Mock user accounts for simulation
const MOCK_USERS = {
  "admin@nexus.io": {
    id: "super-admin-1",
    email: "admin@nexus.io",
    password: "admin123",
    name: "Ozan Kavak",
    role: "super_admin",
    avatar: null,
  },
  "demo@tenant.com": {
    id: "tenant-user-1",
    email: "demo@tenant.com",
    password: "demo123",
    name: "Mehmet Yılmaz",
    role: "tenant_admin",
    tenantId: "t1",
    tenantName: "Arçelik A.Ş.",
    avatar: null,
  },
  "user@tenant.com": {
    id: "tenant-user-2",
    email: "user@tenant.com",
    password: "user123",
    name: "Selin Arslan",
    role: "tenant_user",
    tenantId: "t1",
    tenantName: "Arçelik A.Ş.",
    avatar: null,
  },
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const userRecord = MOCK_USERS[email.toLowerCase()];

        if (!userRecord || userRecord.password !== password) {
          set({
            isLoading: false,
            error: "E-posta veya şifre hatalı. Lütfen tekrar deneyin.",
          });
          return false;
        }

        const { password: _p, ...userWithoutPassword } = userRecord;
        set({
          user: userWithoutPassword,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),

      isSuperAdmin: () => get().user?.role === "super_admin",
      isTenantAdmin: () => get().user?.role === "tenant_admin",
      isTenantUser: () =>
        get().user?.role === "tenant_user" ||
        get().user?.role === "tenant_admin",
    }),
    {
      name: "nexus-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
