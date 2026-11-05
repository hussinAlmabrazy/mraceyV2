"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StatementPrintButton() {
  return (
    <Button onClick={() => window.print()} className="gap-1.5 font-bold text-xs">
      <Printer className="h-4 w-4" /> طباعة / حفظ PDF
    </Button>
  );
}
