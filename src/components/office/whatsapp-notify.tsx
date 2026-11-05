"use client";

// ============ زر «إبلاغ العميل عبر واتساب» ============
// يفتح واتساب (تطبيقاً أو ويباً) برسالة جاهزة مُعبأ من قوالب المكتب —
// مجاني 100% عبر روابط wa.me الرسمية، والمرسل يستطيع تعديل النص قبل الإرسال.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, PencilLine, Send } from "lucide-react";
import { waMeUrl, sanitizeWaPhone } from "@/lib/wa-link";

export type WaPresetOption = { label: string; text: string };

/** الزر الرئيسي: قائمة رسائل جاهزة + رسالة مخصصة */
export function WhatsAppNotify({
  phone,
  phoneDisplay,
  presets,
  clientName,
  requestNumber,
}: {
  phone: string | null;
  phoneDisplay: string;
  presets: WaPresetOption[];
  clientName: string;
  requestNumber: string;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");

  const waGreen = "bg-[#1DA851] hover:bg-[#169449] text-white border-transparent";

  if (!phone) {
    return (
      <Button size="sm" variant="outline" disabled className="gap-1.5 text-xs font-bold" title="لا يوجد رقم واتساب أو جوال لهذا العميل — حدّثه من ملف العميل">
        <MessageCircle className="h-3.5 w-3.5" />
        إبلاغ العميل عبر واتساب
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className={`gap-1.5 text-xs font-bold ${waGreen}`}>
            <MessageCircle className="h-3.5 w-3.5" />
            إبلاغ العميل عبر واتساب
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground">
            الإرسال إلى <span dir="ltr" className="nums text-foreground">{phoneDisplay}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {presets.map((p) => (
            <DropdownMenuItem key={p.label} asChild>
              <a
                href={waMeUrl(phone, p.text)}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer gap-2"
                title={p.text}
              >
                <MessageCircle className="h-3.5 w-3.5 text-[#1DA851] shrink-0" />
                <span className="flex-1 text-xs font-bold">{p.label}</span>
              </a>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onSelect={(e) => {
              e.preventDefault();
              setCustomText(`مرحباً ${clientName}، بخصوص طلبكم رقم ${requestNumber}:\n`);
              setCustomOpen(true);
            }}
          >
            <PencilLine className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="flex-1 text-xs font-bold">رسالة مخصصة…</span>
          </DropdownMenuItem>
          <p className="px-2 py-1.5 text-[10px] leading-relaxed text-muted-foreground">
            يفتح واتساب بالرسالة جاهزة — يمكن تعديلها قبل الإرسال. مجاني عبر wa.me
          </p>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* رسالة مخصصة */}
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-5 w-5 text-[#1DA851]" />
              رسالة واتساب مخصصة
            </DialogTitle>
            <DialogDescription className="text-xs">
              إلى <span dir="ltr" className="nums font-bold">{phoneDisplay}</span> — اكتب رسالتك ثم افتح واتساب لإرسالها
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Textarea
              dir="rtl"
              rows={6}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="اكتب نص الرسالة…"
              className="text-sm leading-relaxed resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              {customText.length} حرفاً — النص قابل للتعديل بعد الفتح في واتساب أيضاً
            </p>

            {presets.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground">أو عبّئ من رسالة جاهزة ثم عدّلها:</p>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setCustomText(p.text)}
                      className="text-[11px] font-bold rounded-full border border-[#1DA851]/40 bg-[#1DA851]/5 text-[#128C4B] hover:bg-[#1DA851]/15 px-2.5 py-1 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              disabled={customText.trim() === ""}
              onClick={() => {
                window.open(waMeUrl(phone, customText), "_blank", "noreferrer");
                setCustomOpen(false);
              }}
              className="gap-2 bg-[#1DA851] hover:bg-[#169449] text-white"
            >
              <Send className="h-4 w-4" />
              فتح واتساب وإرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** رابط سريع مصغّر (أيقونة فقط) — للجداول وبطاقات البيانات */
export function WhatsAppQuickLink({
  phone,
  text,
  title = "مراسلة عبر واتساب",
}: {
  phone?: string | null;
  text?: string;
  title?: string;
}) {
  const p = sanitizeWaPhone(phone);
  if (!p) return null;
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0 text-[#1DA851] hover:bg-[#1DA851]/10 hover:text-[#169449]"
      title={title}
    >
      <a href={waMeUrl(p, text)} target="_blank" rel="noreferrer" aria-label={title}>
        <MessageCircle className="h-3.5 w-3.5" />
      </a>
    </Button>
  );
}
