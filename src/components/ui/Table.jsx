import { cn } from "../../lib/utils";

export function Table({ className, children, ...props }) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }) {
  return (
    <thead className={cn("[&_tr]:border-b", className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle text-xs font-semibold text-muted-foreground uppercase tracking-wider",
        "[&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}
