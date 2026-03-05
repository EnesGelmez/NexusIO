import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function formatDateShort(dateString) {
  return new Intl.DateTimeFormat("tr-TR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function formatNumber(num) {
  return new Intl.NumberFormat("tr-TR").format(num);
}

export function formatCurrency(amount, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
  }).format(amount);
}

export function getStatusColor(status) {
  const map = {
    success: "badge-green",
    error: "badge-red",
    warning: "badge-yellow",
    pending: "badge-yellow",
    info: "badge-blue",
    online: "badge-green",
    offline: "badge-red",
    active: "badge-green",
    inactive: "badge-gray",
    processing: "badge-blue",
  };
  return map[status?.toLowerCase()] || "badge-gray";
}
