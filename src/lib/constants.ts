// ============ الثوابت العامة للنظام ============

export const STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  AWAITING_CLIENT: "AWAITING_CLIENT",
  ACCEPTED: "ACCEPTED",
  IN_PROGRESS: "IN_PROGRESS",
  READY: "READY",
  COMPLETED: "COMPLETED",
  DELIVERED: "DELIVERED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export type RequestStatus = keyof typeof STATUS;

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "مُرسَل",
  UNDER_REVIEW: "قيد المراجعة",
  AWAITING_CLIENT: "بانتظار استكمال العميل",
  ACCEPTED: "مقبول",
  IN_PROGRESS: "قيد التنفيذ",
  READY: "جاهز",
  COMPLETED: "مكتمل",
  DELIVERED: "مُسلَّم/مُغلق",
  REJECTED: "مرفوض",
  CANCELLED: "ملغى",
};

// ألوان الحالات (Tailwind classes)
export const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  SUBMITTED: "bg-cyan-50 text-cyan-800 border-cyan-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-800 border-amber-200",
  AWAITING_CLIENT: "bg-orange-50 text-orange-800 border-orange-200",
  ACCEPTED: "bg-teal-50 text-teal-800 border-teal-200",
  IN_PROGRESS: "bg-violet-50 text-violet-800 border-violet-200",
  READY: "bg-emerald-50 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-emerald-100 text-emerald-900 border-emerald-300",
  DELIVERED: "bg-stone-100 text-stone-700 border-stone-300",
  REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
  CANCELLED: "bg-rose-100 text-rose-900 border-rose-300",
};

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OFFICE_ADMIN: "OFFICE_ADMIN",
  STAFF: "STAFF",
  BROKER: "BROKER",
  ACCOUNTANT: "ACCOUNTANT",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "مدير النظام",
  OFFICE_ADMIN: "مدير المكتب",
  STAFF: "موظف / مراجع",
  BROKER: "مخلص ميداني",
  ACCOUNTANT: "محاسب",
};

export const DOC_STATUS_LABELS: Record<string, string> = {
  UPLOADED: "مرفوع",
  APPROVED: "مدقق",
  MISSING: "ناقص",
  REJECTED: "مرفوض",
};

export const DOC_STATUS_STYLES: Record<string, string> = {
  UPLOADED: "bg-cyan-50 text-cyan-800 border-cyan-200",
  APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  MISSING: "bg-amber-50 text-amber-800 border-amber-200",
  REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
};

export const COST_CATEGORIES: Record<string, string> = {
  CUSTOMS: "رسوم جمركية",
  TAX: "ضرائب",
  STORAGE: "أجور تخزين",
  HANDLING: "أجور مناولة",
  PORT: "رسوم موانئ",
  REGULATORY: "رسوم جهات رقابية",
  OFFICE_FEE: "أتعاب المكتب",
  OTHER: "مصاريف أخرى",
};

export const CURRENCIES: Record<string, { name: string; symbol: string }> = {
  YER: { name: "ريال يمني", symbol: "ر.ي" },
  USD: { name: "دولار أمريكي", symbol: "$" },
  SAR: { name: "ريال سعودي", symbol: "ر.س" },
};

export const REG_STEP_TYPES: Record<string, string> = {
  DECLARATION: "فتح البيان الجمركي",
  INSPECTION: "لجنة الكشف والمعاينة",
  STANDARDS: "هيئة المواصفات والمقاييس",
  HEALTH: "الجهات الصحية",
  RELEASE: "إذن الإفراج النهائي",
  OTHER: "إجراء آخر",
};

export const CONTAINER_TYPES: Record<string, string> = {
  "20FT": "حاوية 20 قدم",
  "40FT": "حاوية 40 قدم",
  LCL: "بضاعة مجمعة LCL",
  OTHER: "أخرى",
};

export const PAYMENT_METHODS: Record<string, string> = {
  CASH: "نقداً",
  TRANSFER: "تحويل بنكي",
  REMITTANCE: "حوالة",
};

export const NOTIFICATION_EVENTS: Record<string, string> = {
  NEW_REQUEST: "طلب جديد",
  MISSING_DOCS: "طلب استكمال نواقص",
  ACCEPTED: "قبول الطلب",
  REJECTED: "رفض الطلب",
  STAGE_CHANGE: "تغيير مرحلة",
  DELAYED: "تأخر عن المدة",
  ASSIGNED: "تكليف موظف",
  COMPLETED: "اكتمال المعاملة",
  PAYMENT_DUE: "استحقاق دفعة",
};

export const CHANNEL_LABELS: Record<string, string> = {
  INAPP: "داخل النظام",
  EMAIL: "البريد الإلكتروني",
  WHATSAPP: "واتساب",
  SMS: "رسالة نصية",
};

// الحالات التي تسمح للعميل بالإلغاء (قبل بدء التنفيذ)
export const CLIENT_CANCELLABLE = [STATUS.DRAFT, STATUS.SUBMITTED, STATUS.UNDER_REVIEW, STATUS.AWAITING_CLIENT, STATUS.ACCEPTED];

// المراحل الافتراضية للتخليص الجمركي (وثيقة المتطلبات - القسم 5)
export const DEFAULT_CLEARANCE_STAGES = [
  "قيد التدقيق المستندي",
  "تصنيف البضاعة (HS Code)",
  "فتح البيان الجمركي",
  "لجنة الكشف والمعاينة",
  "مطابقة المواصفات والقيود الفنية",
  "احتساب وسداد الرسوم والضرائب",
  "استخراج إذن الإفراج النهائي",
  "جاهز للاستلام / مكتمل",
];

export const OFFICE_STATUS_LABELS: Record<string, string> = {
  PENDING: "بانتظار التفعيل",
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
  ARCHIVED: "مؤرشف",
};

export const LICENSE_STATUS_LABELS: Record<string, string> = {
  PENDING: "غير مفعّل",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  REVOKED: "ملغى",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  LOGIN: "تسجيل دخول",
  LOGOUT: "تسجيل خروج",
  CREATE: "إنشاء",
  UPDATE: "تعديل",
  DELETE: "حذف",
  STATUS_CHANGE: "تغيير حالة",
  DOC_REVIEW: "مراجعة مستند",
  UPLOAD: "رفع ملف",
  VIEW_FILE: "معاينة/تحميل ملف",
  IMPERSONATE: "انتحال للدعم",
  PAYMENT: "تسجيل دفعة",
  LICENSE: "عملية ترخيص",
};
