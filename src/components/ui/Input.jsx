import { cn } from "../../lib/utils";
import { forwardRef } from "react";

export const Input = forwardRef(function Input(
  { className, label, error, hint, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-150",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});
