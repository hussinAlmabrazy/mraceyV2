import { cn } from "@/lib/utils";

export function Logo({ size = "md", withText = true, light = false, className }: { size?: "sm" | "md" | "lg"; withText?: boolean; light?: boolean; className?: string }) {
  const dims = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" }[size];
  const text = { sm: "text-lg", md: "text-xl", lg: "text-3xl" }[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn(dims, "relative rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-md shadow-black/20 flex items-center justify-center overflow-hidden")}>
        {/* مرساة سفينة */}
        <svg viewBox="0 0 24 24" className={cn(size === "lg" ? "h-8 w-8" : "h-6 w-6", "text-white")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2.5" />
          <path d="M12 7.5V21" />
          <path d="M7 12H17" />
          <path d="M5 15c0 4 3.5 6 7 6s7-2 7-6" />
        </svg>
      </div>
      {withText && (
        <div className="leading-tight">
          <div className={cn(text, "font-extrabold", light ? "text-white" : "text-teal-900")}>مراسي</div>
          {size !== "sm" && <div className={cn("text-[10px] font-medium tracking-wide", light ? "text-sidebar-foreground/60" : "text-muted-foreground")}>منصة إدارة المعاملات</div>}
        </div>
      )}
    </div>
  );
}

export function OfficeLogo({ name, color = "#0F766E", size = 40 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(" ").filter((w) => w.length > 1).slice(0, 2).map((w) => w[0]).join("");
  return (
    <div
      className="rounded-xl flex items-center justify-center text-white font-bold shadow-sm shrink-0"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials || "م"}
    </div>
  );
}
