import { cn } from "../../lib/utils";

export function Button({
  children,
  variant = "default",
  size = "default",
  className,
  disabled,
  loading,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-blue-600 shadow-sm",
    destructive: "bg-destructive text-destructive-foreground hover:bg-red-600",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-gray-200",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };

  const sizes = {
    default: "h-9 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-11 px-6 text-base",
    icon: "h-9 w-9",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
