import { Construction } from "lucide-react";

export default function PlaceholderPage({ title = "Bu Sayfa Geliştiriliyor" }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 mb-4">
        <Construction size={28} className="text-amber-600" />
      </div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        Bu modül bir sonraki geliştirme adımında tamamlanacaktır.
      </p>
    </div>
  );
}
