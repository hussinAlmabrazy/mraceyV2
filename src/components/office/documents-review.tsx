"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { reviewDocument, uploadRequestDocument } from "@/app/actions/requests";
import { DocStatusBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, FileQuestion, Eye, Download, Upload, Loader2, Paperclip } from "lucide-react";

export type DocRow = {
  id: string;
  name: string;
  status: string;
  version: number;
  reviewNote: string | null;
  filePath: string | null;
  fileSize: number | null;
  uploadedByName: string | null;
  uploadedByType: string;
  createdAt: Date;
};

export function DocumentsReview({ requestId, docs, canReview, canUpload }: { requestId: string; docs: DocRow[]; canReview: boolean; canUpload: boolean }) {
  const [pending, startTransition] = useTransition();
  const [noteDialog, setNoteDialog] = useState<{ doc: DocRow; action: string } | null>(null);
  const [note, setNote] = useState("");

  const review = (docId: string, status: string, reviewNote?: string) => {
    startTransition(async () => {
      const res = await reviewDocument(docId, status, reviewNote || "");
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
      setNoteDialog(null);
      setNote("");
    });
  };

  return (
    <div className="space-y-3">
      {docs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">لم تُرفع أي مستندات لهذا الطلب بعد</p>
      )}
      {docs.map((d) => (
        <div key={d.id} className="rounded-xl border bg-card p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold truncate">{d.name}</p>
                <DocStatusBadge status={d.status} />
                <span className="text-[10px] text-muted-foreground nums">v{d.version}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {d.uploadedByType === "STAFF" ? `رفعه ${d.uploadedByName || "المكتب"}` : d.uploadedByName || "العميل"}
                {d.filePath && d.fileSize ? ` · ${(d.fileSize / 1024).toFixed(0)} ك.ب` : d.filePath ? "" : " · لم يُرفع ملف"}
                {d.reviewNote ? ` · ملاحظة: ${d.reviewNote}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {d.filePath && (
              <>
                <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <a href={`/api/files/${d.filePath}`} target="_blank" rel="noreferrer" title="معاينة"><Eye className="h-4 w-4" /></a>
                </Button>
                <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <a href={`/api/files/${d.filePath}?dl=1`} title="تحميل"><Download className="h-4 w-4" /></a>
                </Button>
              </>
            )}
            {canReview && d.filePath && (
              <>
                <Button size="sm" variant="ghost" className="h-8 px-2 text-emerald-700 hover:bg-emerald-50 gap-1 text-[11px] font-bold" disabled={pending} onClick={() => review(d.id, "APPROVED")}>
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} قبول
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2 text-amber-700 hover:bg-amber-50 gap-1 text-[11px] font-bold" disabled={pending} onClick={() => setNoteDialog({ doc: d, action: "MISSING" })}>
                  <FileQuestion className="h-3.5 w-3.5" /> ناقص
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2 text-rose-700 hover:bg-rose-50 gap-1 text-[11px] font-bold" disabled={pending} onClick={() => setNoteDialog({ doc: d, action: "REJECTED" })}>
                  <XCircle className="h-3.5 w-3.5" /> رفض
                </Button>
              </>
            )}
          </div>
        </div>
      ))}

      {canUpload && <UploadDocForm requestId={requestId} />}

      {/* حوار الملاحظة */}
      <Dialog open={!!noteDialog} onOpenChange={(o) => !o && setNoteDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{noteDialog?.action === "REJECTED" ? "رفض المستند" : "تعليم كمستند ناقص"}</DialogTitle>
            <DialogDescription>{noteDialog?.doc.name} — أضف ملاحظة تظهر في سجل المراجعة</DialogDescription>
          </DialogHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="مثال: الصورة غير واضحة / ينقص التوقيع..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(null)}>إلغاء</Button>
            <Button
              variant={noteDialog?.action === "REJECTED" ? "destructive" : "default"}
              className="font-bold"
              onClick={() => noteDialog && review(noteDialog.doc.id, noteDialog.action, note)}
            >
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UploadDocForm({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [fileLabel, setFileLabel] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 font-bold text-xs">
          <Upload className="h-4 w-4" /> رفع مستند (من المكتب)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>رفع مستند إلى الطلب</DialogTitle>
          <DialogDescription>PDF أو JPG أو PNG — بحد أقصى 10 ميجابايت. يُسجَّل الرفع في سجل التدقيق.</DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await uploadRequestDocument(requestId, fd);
              if (res.ok) { toast.success(res.message); setOpen(false); formRef.current?.reset(); setFileLabel(""); }
              else toast.error(res.error);
            });
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold">اسم المستند <span className="text-rose-500">*</span></label>
            <input name="name" required className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm" placeholder="مثال: إذن التسليم" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">الملف <span className="text-rose-500">*</span></label>
            <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer p-6 transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{fileLabel || "اسحب الملف هنا أو انقر للاختيار"}</span>
              <input
                type="file"
                name="file"
                accept=".pdf,.jpg,.jpeg,.png"
                required
                className="hidden"
                onChange={(e) => setFileLabel(e.target.files?.[0]?.name || "")}
              />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button type="submit" className="font-bold gap-1.5" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} رفع المستند
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
