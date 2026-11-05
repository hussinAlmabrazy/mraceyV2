"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Link2 } from "lucide-react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 text-xs font-bold"
      onClick={async () => {
        try {
          const url = value.startsWith("/") ? `${window.location.origin}${value}` : value;
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch { /* ignore */ }
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? "تم النسخ!" : label}
    </Button>
  );
}
