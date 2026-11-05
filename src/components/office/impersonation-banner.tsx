"use client";

import { AlertTriangle } from "lucide-react";
import { logoutStaff } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner() {
  return (
    <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-xs font-bold py-2 px-4 flex items-center justify-center gap-3">
      <AlertTriangle className="h-4 w-4" />
      <span>أنت مسجّل بصفة انتحال لأغراض الدعم — كل الإجراءات تُسجَّل في سجل التدقيق</span>
      <form action={logoutStaff}>
        <Button type="submit" size="sm" variant="outline" className="h-7 text-[11px] border-amber-400 bg-white/60">إنهاء الجلسة</Button>
      </form>
    </div>
  );
}
