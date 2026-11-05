"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveCategory, deleteCategory, toggleService, deleteService, createFromTemplate, saveService } from "@/app/actions/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Plus, Trash2, Copy, Settings, Power, LayoutGrid, Loader2, PackageCheck, Sparkles } from "lucide-react";
import { ServiceIcon } from "@/components/shared/widgets";
import { CURRENCIES } from "@/lib/constants";

type ServiceRow = {
  id: string; name: string; description: string | null; icon: string | null;
  price: number | null; priceLabel: string | null; currency: string;
  estimatedDays: number; isClearance: boolean; isActive: boolean;
  categoryName: string; requestsCount: number;
};

export function ServicesManager({
  canManage, services, categories, templates, autoOpenNew,
}: {
  canManage: boolean;
  services: ServiceRow[];
  categories: { id: string; name: string }[];
  templates: { name: string; description: string; categoryName: string; estimatedDays: number; isClearance: boolean; docsCount: number }[];
  autoOpenNew?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [activeCat, setActiveCat] = useState("all");
  const [catDialog, setCatDialog] = useState(false);
  const [serviceDialog, setServiceDialog] = useState(!!autoOpenNew);
  const [templateDialog, setTemplateDialog] = useState(false);

  const filtered = services.filter((s) => activeCat === "all" || s.categoryName === activeCat);
  const catNames = Array.from(new Set([...categories.map((c) => c.name), ...services.map((s) => s.categoryName)]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><Layers className="h-6 w-6 text-primary" /> كتالوج الخدمات</h1>
          <p className="text-sm text-muted-foreground mt-1">{services.length} خدمة · {categories.length} تصنيف — تظهر للعملاء في صفحة المكتب العامة</p>
        </div>
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 font-bold text-xs" onClick={() => setCatDialog(true)}>
              <LayoutGrid className="h-4 w-4" /> إدارة التصنيفات
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 font-bold text-xs" onClick={() => setTemplateDialog(true)}>
              <Copy className="h-4 w-4" /> إضافة من قالب جاهز
            </Button>
            <Button size="sm" className="gap-1.5 font-bold text-xs" onClick={() => setServiceDialog(true)}>
              <Plus className="h-4 w-4" /> خدمة جديدة
            </Button>
          </div>
        )}
      </div>

      {/* تصفية التصنيفات */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveCat("all")}
          className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${activeCat === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`}>
          الكل ({services.length})
        </button>
        {catNames.map((c) => (
          <button key={c} onClick={() => setActiveCat(c)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${activeCat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`}>
            {c} ({services.filter((s) => s.categoryName === c).length})
          </button>
        ))}
      </div>

      {/* حالة الكتالوج الفارغ — إرشاد واضح للبدء */}
      {services.length === 0 && canManage && (
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-b from-primary/5 to-transparent">
          <CardContent className="p-8 sm:p-10 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Layers className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold">كتالوج مكتبك فارغ — لنبدأ بإضافة أول خدمة</h3>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xl mx-auto leading-relaxed">
                الخدمات هي ما يظهر لعملائك في صفحة مكتبك العامة، وما يمكن استقبال الطلبات عليه (من العملاء مباشرة أو نيابةً عنهم).
                أنشئ خدمة بتفاصيل تخصك، أو انسخ قالباً جاهزاً — يشتمل على المستندات المطلوبة ومراحل التتبع ونموذج الطلب — وعدّله كما تشاء.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Button className="gap-1.5 font-bold" onClick={() => setServiceDialog(true)}>
                <Plus className="h-4 w-4" /> إنشاء خدمة يدوياً
              </Button>
              <Button variant="outline" className="gap-1.5 font-bold" onClick={() => setTemplateDialog(true)}>
                <Copy className="h-4 w-4" /> إضافة من قالب جاهز
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {services.length === 0 && !canManage && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            لا توجد خدمات في كتالوج المكتب بعد — تواصل مع مدير المكتب لإضافتها
          </CardContent>
        </Card>
      )}

      {/* الشبكة */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && services.length > 0 && (
          <Card className="sm:col-span-2 lg:col-span-3 border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">لا خدمات في هذا التصنيف</CardContent>
          </Card>
        )}
        {filtered.map((s) => (
          <Card key={s.id} className={`border-border/60 transition-all hover:shadow-md ${!s.isActive ? "opacity-60" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-muted border flex items-center justify-center shrink-0">
                    <ServiceIcon icon={s.icon} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s.categoryName}</p>
                  </div>
                </div>
                {s.isClearance && <Badge variant="outline" className="bg-teal-50 border-teal-200 text-teal-800 text-[9px] shrink-0">جمركي</Badge>}
              </div>
              {s.description && <p className="text-xs text-muted-foreground mt-2.5 line-clamp-2 leading-relaxed">{s.description}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">
                    {s.price != null ? `${s.price.toLocaleString()} ${CURRENCIES[s.currency]?.symbol || ""}` : (s.priceLabel || "حسب الطلب")}
                  </span>
                  <span className="text-muted-foreground">· {s.estimatedDays} يوم عمل</span>
                </div>
                <span className="text-muted-foreground nums">{s.requestsCount} طلب</span>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <Button asChild size="sm" variant="outline" className="h-7 text-[11px] font-bold gap-1 flex-1">
                  <Link href={`/office/services/${s.id}`}><Settings className="h-3 w-3" /> {canManage ? "تحرير" : "عرض"}</Link>
                </Button>
                {canManage && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title={s.isActive ? "تعطيل" : "تفعيل"} disabled={pending}
                    onClick={() => startTransition(async () => {
                      const res = await toggleService(s.id, !s.isActive);
                      if (!res.ok) toast.error(res.error);
                    })}
                  >
                    <Power className={`h-3.5 w-3.5 ${s.isActive ? "text-emerald-600" : "text-muted-foreground"}`} />
                  </Button>
                )}
                {canManage && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" title="حذف" disabled={pending}
                    onClick={() => startTransition(async () => {
                      const res = await deleteService(s.id);
                      if (res.ok) toast.success(res.message);
                      else toast.error(res.error);
                    })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* حوار التصنيفات */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>إدارة التصنيفات</DialogTitle>
            <DialogDescription>تصنيفات تظهر للعملاء: تخليص جمركي، وثائق تجارية وضريبية، سفر...</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border p-2.5">
                <span className="text-xs font-bold">{c.name}</span>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" disabled={pending}
                  onClick={() => startTransition(async () => {
                    const res = await deleteCategory(c.id);
                    if (res.ok) toast.success(res.message);
                    else toast.error(res.error);
                  })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const res = await saveCategory(fd);
                if (res.ok) { toast.success(res.message); (e.target as HTMLFormElement).reset(); }
                else toast.error(res.error);
              });
            }}
            className="flex gap-2"
          >
            <Input name="name" placeholder="اسم تصنيف جديد" className="h-9 text-xs" required />
            <Button type="submit" size="sm" className="font-bold gap-1 text-xs shrink-0" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} إضافة
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* حوار خدمة جديدة */}
      <ServiceDialog open={serviceDialog} onOpenChange={setServiceDialog} categories={categories} />

      {/* حوار القوالب الجاهزة */}
      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /> قوالب الخدمات الجاهزة</DialogTitle>
            <DialogDescription>قوالب مُعدّة للتخليص الجمركي والوثائق والسفر والسياحة واللوجستيات — انسخها وعدّلها حسب مكتبك (FR-OF-06)</DialogDescription>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
            {templates.map((t) => (
              <button
                key={t.name}
                disabled={pending}
                onClick={() => startTransition(async () => {
                  const res = await createFromTemplate(t.name);
                  if (res.ok) { toast.success(res.message); setTemplateDialog(false); }
                  else toast.error(res.error);
                })}
                className="text-right rounded-xl border p-3.5 hover:border-primary/50 hover:bg-muted/40 transition-all group"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold group-hover:text-primary transition-colors">{t.name}</p>
                  {t.isClearance && <Badge variant="outline" className="bg-teal-50 border-teal-200 text-teal-800 text-[9px]">جمركي</Badge>}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{t.description}</p>
                <p className="text-[10px] text-primary font-bold mt-2 flex items-center gap-1">
                  <PackageCheck className="h-3 w-3" /> {t.docsCount} مستند مطلوب · {t.estimatedDays} يوم عمل
                </p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ServiceDialog({
  open, onOpenChange, categories, service,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  categories: { id: string; name: string }[];
  service?: any;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{service ? "تعديل الخدمة" : "خدمة جديدة"}</DialogTitle>
          <DialogDescription>حدّد التفاصيل الأساسية — المستندات والمراحل وحقول النموذج تُدار من صفحة الخدمة</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await saveService(fd);
              if (res.ok) { toast.success(res.message); onOpenChange(false); }
              else toast.error(res.error);
            });
          }}
          className="space-y-3"
        >
          {service?.id && <input type="hidden" name="id" value={service.id} />}
          <div className="space-y-1.5">
            <label className="text-xs font-bold">اسم الخدمة <span className="text-rose-500">*</span></label>
            <Input name="name" defaultValue={service?.name || ""} required className="h-10 text-xs" placeholder="مثال: تخليص حاوية مبردة" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">الوصف</label>
            <textarea name="description" defaultValue={service?.description || ""} rows={2}
              className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-xs min-h-16"
              placeholder="وصف يظهر للعملاء في صفحة الخدمات" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">التصنيف</label>
              <select name="categoryId" defaultValue={service?.categoryId || ""} className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                <option value="">بدون تصنيف</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">المدة التقريبية (يوم عمل)</label>
              <Input name="estimatedDays" type="number" min={1} defaultValue={service?.estimatedDays ?? 7} className="h-10 text-xs nums" dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">السعر (اتركه فارغاً = حسب الطلب)</label>
              <Input name="price" type="number" step="any" min="0" defaultValue={service?.price ?? ""} className="h-10 text-xs nums" dir="ltr" placeholder="مثال: 25000" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">العملة</label>
              <select name="currency" defaultValue={service?.currency || "YER"} className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                {Object.entries(CURRENCIES).map(([v, c]) => <option key={v} value={v}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-lg border p-2.5 bg-teal-50/40 border-teal-200">
            <input type="checkbox" name="isClearance" defaultChecked={service?.isClearance} className="h-4 w-4 accent-teal-700" />
            خدمة تخليص جمركي — تُنشئ ملف شحنة تلقائياً لكل طلب (بوليصة، بنود HS، إذن إفراج)
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" className="font-bold gap-1.5" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} حفظ الخدمة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
