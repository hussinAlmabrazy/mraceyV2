"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkReadButton({ action }: { action: () => Promise<{ ok: boolean; error?: string }> }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 font-bold text-xs"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await action();
          if (res.ok) toast.success("تم تعليم الإشعارات كمقروءة");
          else toast.error(res.error);
        })
      }
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
      تعليم الكل كمقروء
    </Button>
  );
}
