import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children || <Outlet />;
}

export function RequireSuperAdmin({ children }) {
  const { isAuthenticated, isSuperAdmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isSuperAdmin()) return <Navigate to="/tenant" replace />;
  return children || <Outlet />;
}

export function RequireTenantUser({ children }) {
  const { isAuthenticated, isTenantUser } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isTenantUser()) return <Navigate to="/admin" replace />;
  return children || <Outlet />;
}

export function RedirectIfAuthenticated() {
  const { isAuthenticated, isSuperAdmin } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to={isSuperAdmin() ? "/admin" : "/tenant"} replace />;
  }
  return <Outlet />;
}
