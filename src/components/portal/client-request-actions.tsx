"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { uploadClientDocument, cancelMyRequest, addClientComment, rateRequest, submitDraft } from "@/app/actions/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Send, Loader2, XCircle, Star, CloudUpload, FileQuestion } from "lucide-react";
import { timeAgoAr } from "@/lib/format";

type CommentRow = { id: string; authorName: string; authorType: string; body: string; createdAt: Date };

export function ClientRequestActions({
  requestId, missingDocs, canCancel, isDraft, canRate, rating, comments,
}: {
  requestId: string;
  missingDocs: { id: string; name: string }[];
  canCancel: boolean;
  isDraft: boolean;
  canRate: boolean;
  rating: number | null;
  comments?: CommentRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* المسودة */}
      {isDraft && (
        <Button
          className="w-full font-bold gap-1.5 h-11"
          disabled={pending}
          onClick={() => startTransition(async () => {
            const res = await submitDraft(requestId);
            if (res.ok) toast.success(res.message);
            else toast.error(res.error);
          })}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          إرسال الطلب للمكتب
        </Button>
      )}

      {/* رفع النواقص */}
      {missingDocs.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
            <FileQuestion className="h-4 w-4" /> ارفع المستندات التالية ({missingDocs.length})
          </p>
          {missingDocs.map((d) => (
            <UploadMissing key={d.id} requestId={requestId} docId={d.id} name={d.name} />
          ))}
        </div>
      )}

      {/* المحادثة */}
      {comments && <CommentsThread requestId={requestId} comments={comments} />}

      {/* أزرار سفلية */}
      <div className="flex flex-wrap gap-2">
        {canCancel && (
          <Button variant="outline" size="sm" className="gap-1.5 font-bold text-xs text-rose-700 border-rose-300 hover:bg-rose-50" onClick={() => setCancelOpen(true)}>
            <XCircle className="h-4 w-4" /> إلغاء الطلب
          </Button>
        )}
        {canRate && !rating && (
          <Button variant="outline" size="sm" className="gap-1.5 font-bold text-xs text-amber-700 border-amber-300 hover:bg-amber-50" onClick={() => setRateOpen(true)}>
            <Star className="h-4 w-4" /> تقييم الخدمة
          </Button>
        )}
      </div>

      {/* حوار الإلغاء */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>إلغاء الطلب</DialogTitle>
            <DialogDescription>متاح فقط قبل بدء التنفيذ — سيُشعَر المكتب فوراً بالإلغاء.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>تراجع</Button>
            <Button
              variant="destructive" className="font-bold gap-1.5" disabled={pending}
              onClick={() => startTransition(async () => {
                const res = await cancelMyRequest(requestId);
                if (res.ok) { toast.success(res.message); setCancelOpen(false); }
                else toast.error(res.error);
              })}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} تأكيد الإلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار التقييم */}
      <RatingDialog open={rateOpen} onOpenChange={setRateOpen} requestId={requestId} />
    </div>
  );
}

function UploadMissing({ requestId, docId, name }: { requestId: string; docId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState("");

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await uploadClientDocument(requestId, fd);
          if (res.ok) { toast.success(res.message); formRef.current?.reset(); setFileName(""); }
          else toast.error(res.error);
        });
      }}
      className="flex items-center gap-2 rounded-xl border border-amber-200 bg-white p-2.5"
    >
      <input type="hidden" name="docId" value={docId} />
      <input type="hidden" name="name" value={name} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground">{fileName || "PDF / JPG / PNG"}</p>
      </div>
      <label className="cursor-pointer rounded-lg border-2 border-dashed border-amber-300 hover:border-amber-400 px-3 py-2 text-[10px] font-bold text-amber-800 transition-colors shrink-0">
        <CloudUpload className="h-4 w-4 mx-auto mb-0.5" />
        {fileName ? "تغيير" : "اختر"}
        <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,image/*" capture="environment" className="hidden" required
          onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
        />
      </label>
      <Button type="submit" size="sm" className="h-9 px-3 font-bold gap-1 text-xs shrink-0" disabled={pending || !fileName}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        رفع
      </Button>
    </form>
  );
}

function CommentsThread({ requestId, comments }: { requestId: string; comments: CommentRow[] }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="space-y-2.5 max-h-64 overflow-y-auto">
        {comments!.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">لا توجد رسائل — راسل المكتب عند الحاجة</p>}
        {comments!.map((c) => (
          <div key={c.id} className={`rounded-xl p-2.5 text-xs ${c.authorType === "STAFF" ? "bg-primary/5 border border-primary/20" : "bg-muted/40 border"}`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold">{c.authorType === "STAFF" ? "المكتب" : "أنا"}</span>
              <span className="text-[10px] text-muted-foreground">{timeAgoAr(c.createdAt)}</span>
            </div>
            <p className="leading-relaxed whitespace-pre-wrap">{c.body}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="اكتب رسالتك للمكتب..." className="h-10 text-xs" />
        <Button
          size="sm" className="h-10 px-3 font-bold shrink-0 gap-1" disabled={pending || !body.trim()}
          onClick={() => startTransition(async () => {
            const res = await addClientComment(requestId, body);
            if (res.ok) { setBody(""); toast.success(res.message); }
            else toast.error(res.error);
          })}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function RatingDialog({ open, onOpenChange, requestId }: { open: boolean; onOpenChange: (o: boolean) => void; requestId: string }) {
  const [stars, setStars] = useState(5);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>قيّم تجربتك مع الخدمة</DialogTitle>
          <DialogDescription>تقييمك يساعد المكتب على تحسين جودة الخدمة (اختياري)</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => setStars(i)} className="transition-transform hover:scale-110">
              <Star className={`h-9 w-9 ${i <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button
            className="font-bold gap-1.5" disabled={pending}
            onClick={() => startTransition(async () => {
              const res = await rateRequest(requestId, stars);
              if (res.ok) { toast.success(res.message); onOpenChange(false); }
              else toast.error(res.error);
            })}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} إرسال التقييم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
