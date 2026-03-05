import { cn } from "../../lib/utils";

export function Badge({ children, variant = "default", className, ...props }) {
  const variants = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-700",
    error: "bg-red-100 text-red-700",
    warning: "bg-yellow-100 text-yellow-700",
    info: "bg-blue-100 text-blue-700",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-border text-foreground",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusDot({ status }) {
  const colors = {
    online: "bg-emerald-500",
    offline: "bg-red-500",
    pending: "bg-yellow-500",
    processing: "bg-blue-500",
  };
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        colors[status] || "bg-gray-400"
      )}
    />
  );
}
