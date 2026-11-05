"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  saveService, saveServiceDoc, deleteServiceDoc, saveServiceStage, deleteServiceStage, moveServiceStage,
  saveFormField, deleteFormField, moveFormField,
} from "@/app/actions/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRight, Save, Plus, Trash2, Eye, EyeOff, Bell, ArrowUp, ArrowDown, FileText, Layers, FormInput, Loader2 } from "lucide-react";
import { CURRENCIES } from "@/lib/constants";

type ServiceData = {
  id: string; name: string; description: string | null; icon: string | null;
  price: number | null; priceLabel: string | null; currency: string;
  estimatedDays: number; isClearance: boolean; isActive: boolean;
  categoryId: string | null; categoryName: string;
  requiredDocs: { id: string; name: string; description: string | null; isMandatory: boolean; allowedFormats: string; maxSizeMb: number }[];
  stages: { id: string; name: string; sortOrder: number; isVisibleToClient: boolean; notifyClient: boolean }[];
  formFields: { id: string; key: string; label: string; type: string; options: string | null; isRequired: boolean; placeholder: string | null }[];
};

export function ServiceEditor({ canManage, service, categories }: { canManage: boolean; service: ServiceData; categories: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [docDialog, setDocDialog] = useState(false);
  const [stageDialog, setStageDialog] = useState(false);
  const [fieldDialog, setFieldDialog] = useState(false);

  return (
    <div className="space-y-5">
      {/* الرأس */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="h-6 px-1.5 gap-1 text-xs text-muted-foreground hover:text-foreground p-0 mb-1">
            <Link href="/office/services"><ArrowRight className="h-3.5 w-3.5" /> الكتالوج</Link>
          </Button>
          <h1 className="text-2xl font-extrabold">{service.name}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className="bg-muted text-xs">{service.categoryName}</Badge>
            {service.isClearance && <Badge variant="outline" className="bg-teal-50 border-teal-200 text-teal-800 text-xs">تخليص جمركي</Badge>}
            <Badge variant="outline" className={`text-xs ${service.isActive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
              {service.isActive ? "مفعّلة" : "معطّلة"}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="basic" dir="rtl">
        <TabsList className="h-auto flex-wrap justify-start bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="basic" className="text-xs font-bold rounded-lg data-[state=active]:bg-card px-3 py-1.5">البيانات الأساسية</TabsTrigger>
          <TabsTrigger value="docs" className="text-xs font-bold rounded-lg data-[state=active]:bg-card px-3 py-1.5">المستندات المطلوبة ({service.requiredDocs.length})</TabsTrigger>
          <TabsTrigger value="stages" className="text-xs font-bold rounded-lg data-[state=active]:bg-card px-3 py-1.5">مراحل التتبع ({service.stages.length})</TabsTrigger>
          <TabsTrigger value="form" className="text-xs font-bold rounded-lg data-[state=active]:bg-card px-3 py-1.5">حقول النموذج ({service.formFields.length})</TabsTrigger>
        </TabsList>

        {/* البيانات الأساسية */}
        <TabsContent value="basic" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="p-4 sm:p-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  startTransition(async () => {
                    const res = await saveService(fd);
                    if (res.ok) toast.success(res.message);
                    else toast.error(res.error);
                  });
                }}
                className="space-y-4"
              >
                <input type="hidden" name="id" value={service.id} />
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold">اسم الخدمة</label>
                    <Input name="name" defaultValue={service.name} required className="h-10 text-xs" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold">الوصف (يظهر للعملاء)</label>
                    <textarea name="description" defaultValue={service.description || ""} rows={3}
                      className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-xs min-h-20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold">التصنيف</label>
                    <select name="categoryId" defaultValue={service.categoryId || ""} className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                      <option value="">بدون تصنيف</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold">المدة التقريبية (يوم عمل) — تُربط تلقائياً عند قبول الطلب</label>
                    <Input name="estimatedDays" type="number" min={1} defaultValue={service.estimatedDays} className="h-10 text-xs nums" dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold">السعر (فارغ = حسب الطلب)</label>
                    <Input name="price" type="number" step="any" min="0" defaultValue={service.price ?? ""} className="h-10 text-xs nums" dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold">العملة</label>
                    <select name="currency" defaultValue={service.currency} className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                      {Object.entries(CURRENCIES).map(([v, c]) => <option key={v} value={v}>{c.name}</option>)}
                    </select>
                  </div>
                  <input type="hidden" name="icon" value={service.icon || ""} />
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-lg border p-3 bg-teal-50/40 border-teal-200 sm:col-span-2">
                    <input type="checkbox" name="isClearance" defaultChecked={service.isClearance} className="h-4 w-4 accent-teal-700" />
                    خدمة تخليص جمركي — ملف شحنة تلقائي لكل طلب
                  </label>
                </div>
                {canManage && (
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" className="font-bold gap-1.5 text-xs" disabled={pending}>
                      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} حفظ التعديلات
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* المستندات المطلوبة */}
        <TabsContent value="docs" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-extrabold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> المستندات المطلوبة</CardTitle>
                <CardDescription className="text-xs mt-1">لا يُرسَل الطلب قبل رفع جميع المستندات الإلزامية</CardDescription>
              </div>
              {canManage && <AddDialog triggerLabel="مستند مطلوب" title="إضافة مستند مطلوب" onSubmit={saveServiceDoc} serviceId={service.id} fields={[
                { name: "name", label: "اسم المستند", required: true, placeholder: "مثال: شهادة المنشأ" },
                { name: "description", label: "وصف/إرشاد", placeholder: "Invoice موقّعة من المورد" },
              ]} checkboxes={[
                { name: "isMandatory", label: "إلزامي — يمنع إرسال الطلب بدونه", default: true },
              ]} open={docDialog} setOpen={setDocDialog} />}
            </CardHeader>
            <CardContent className="space-y-2">
              {service.requiredDocs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا توجد مستندات محددة</p>}
              {service.requiredDocs.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold">{d.name}</p>
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${d.isMandatory ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-muted text-muted-foreground border-border"}`}>
                        {d.isMandatory ? "إلزامي" : "اختياري"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {d.allowedFormats} · حتى {d.maxSizeMb}MB
                      {d.description ? ` · ${d.description}` : ""}
                    </p>
                  </div>
                  {canManage && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" disabled={pending}
                      onClick={() => startTransition(async () => {
                        const res = await deleteServiceDoc(d.id, service.id);
                        if (res.ok) toast.success(res.message);
                        else toast.error(res.error);
                      })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* المراحل */}
        <TabsContent value="stages" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-extrabold flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> مراحل التتبع الخاصة بالخدمة</CardTitle>
                <CardDescription className="text-xs mt-1">تظهر للعميل في الخط الزمني فور تحديثها — آخر مرحلة تُرسل إشعار الإنجاز</CardDescription>
              </div>
              {canManage && <AddDialog triggerLabel="مرحلة" title="إضافة مرحلة" onSubmit={saveServiceStage} serviceId={service.id} fields={[
                { name: "name", label: "اسم المرحلة", required: true, placeholder: "مثال: فتح البيان الجمركي" },
              ]} checkboxes={[
                { name: "isVisibleToClient", label: "مرئية للعميل في صفحة التتبع", default: true },
                { name: "notifyClient", label: "إشعار تلقائي للعميل عند الوصول لهذه المرحلة", default: false },
              ]} open={stageDialog} setOpen={setStageDialog} />}
            </CardHeader>
            <CardContent className="space-y-2">
              {service.stages.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center shrink-0 nums">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{s.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {s.isVisibleToClient ? (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> مرئية للعميل</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><EyeOff className="h-3 w-3" /> داخلية فقط</span>
                        )}
                        {s.notifyClient && <span className="text-[10px] text-amber-700 flex items-center gap-1"><Bell className="h-3 w-3" /> إشعار تلقائي</span>}
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={pending || i === 0}
                        onClick={() => startTransition(async () => { await moveServiceStage(s.id, service.id, "up"); })}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={pending || i === service.stages.length - 1}
                        onClick={() => startTransition(async () => { await moveServiceStage(s.id, service.id, "down"); })}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" disabled={pending}
                        onClick={() => startTransition(async () => {
                          const res = await deleteServiceStage(s.id, service.id);
                          if (res.ok) toast.success(res.message);
                          else toast.error(res.error);
                        })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {service.stages.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا توجد مراحل — ستُستخدم حالات الطلب العامة فقط</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* حقول النموذج — منشئ ديناميكي */}
        <TabsContent value="form" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-extrabold flex items-center gap-2"><FormInput className="h-4 w-4 text-primary" /> منشئ نموذج الطلب (Dynamic Form Builder)</CardTitle>
                <CardDescription className="text-xs mt-1">حقول يعبّئها العميل عند التقديم — تُعرض للموظفين في تفاصيل الطلب</CardDescription>
              </div>
              {canManage && <AddDialog triggerLabel="حقل" title="إضافة حقل" onSubmit={saveFormField} serviceId={service.id} fields={[
                { name: "label", label: "عنوان الحقل", required: true, placeholder: "مثال: رقم بوليصة الشحن" },
                { name: "key", label: "المعرّف (اختياري، إنجليزي)", placeholder: "bl_number" },
                { name: "options", label: "خيارات القائمة (للنوع «قائمة» فقط، مفصولة بفواصل)", placeholder: "الصين,الهند,الإمارات" },
                { name: "placeholder", label: "نص إرشادي داخل الحقل", placeholder: "MSCU1234567" },
              ]} selects={[
                { name: "type", label: "نوع الحقل", options: [
                  { value: "TEXT", label: "نص قصير" },
                  { value: "TEXTAREA", label: "نص طويل" },
                  { value: "NUMBER", label: "رقم" },
                  { value: "DATE", label: "تاريخ" },
                  { value: "SELECT", label: "قائمة اختيار" },
                ] },
              ]} checkboxes={[
                { name: "isRequired", label: "إلزامي", default: false },
              ]} open={fieldDialog} setOpen={setFieldDialog} />}
            </CardHeader>
            <CardContent className="space-y-2">
              {service.formFields.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا توجد حقول مخصصة</p>}
              {service.formFields.map((f, i) => {
                const typeLabels: Record<string, string> = { TEXT: "نص", TEXTAREA: "نص طويل", NUMBER: "رقم", DATE: "تاريخ", SELECT: "قائمة" };
                return (
                  <div key={f.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-7 w-7 rounded-full bg-violet-100 text-violet-700 text-xs font-extrabold flex items-center justify-center shrink-0 nums">{i + 1}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold truncate">{f.label}</p>
                          {f.isRequired && <span className="text-[10px] font-bold text-rose-600">إلزامي</span>}
                          <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{typeLabels[f.type] || f.type}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 nums" dir="ltr">{f.key}{f.options ? ` · خيارات: ${f.options}` : ""}</p>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={pending || i === 0}
                          onClick={() => startTransition(async () => { await moveFormField(f.id, service.id, "up"); })}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={pending || i === service.formFields.length - 1}
                          onClick={() => startTransition(async () => { await moveFormField(f.id, service.id, "down"); })}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" disabled={pending}
                          onClick={() => startTransition(async () => {
                            const res = await deleteFormField(f.id, service.id);
                            if (res.ok) toast.success(res.message);
                            else toast.error(res.error);
                          })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// حوار إضافة عام
function AddDialog({
  triggerLabel, title, onSubmit, serviceId, fields, checkboxes, selects, open, setOpen,
}: {
  triggerLabel: string; title: string;
  onSubmit: (serviceId: string, fd: FormData) => Promise<{ ok: boolean; error?: string; message?: string }>;
  serviceId: string;
  fields: { name: string; label: string; required?: boolean; placeholder?: string }[];
  checkboxes?: { name: string; label: string; default?: boolean }[];
  selects?: { name: string; label: string; options: { value: string; label: string }[] }[];
  open: boolean; setOpen: (o: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold h-8"><Plus className="h-3.5 w-3.5" /> {triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await onSubmit(serviceId, fd);
              if (res.ok) { toast.success(res.message); setOpen(false); (e.target as HTMLFormElement).reset(); }
              else toast.error(res.error);
            });
          }}
          className="space-y-3"
        >
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <label className="text-xs font-bold">{f.label} {f.required && <span className="text-rose-500">*</span>}</label>
              <Input name={f.name} required={f.required} placeholder={f.placeholder} className="h-10 text-xs" />
            </div>
          ))}
          {selects?.map((s) => (
            <div key={s.name} className="space-y-1.5">
              <label className="text-xs font-bold">{s.label}</label>
              <select name={s.name} className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                {s.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
          {checkboxes?.map((c) => (
            <label key={c.name} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input type="checkbox" name={c.name} defaultChecked={c.default} className="h-4 w-4 accent-teal-700" />
              {c.label}
            </label>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button type="submit" className="font-bold gap-1.5" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} إضافة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
