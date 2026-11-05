// ============ قوالب الخدمات الجاهزة (FR-OF-06) وقوالب الإشعارات الافتراضية ============
import { DEFAULT_CLEARANCE_STAGES } from "@/lib/constants";

export type ServiceTemplate = {
  name: string;
  description: string;
  icon: string;
  price: number | null;
  priceLabel?: string;
  estimatedDays: number;
  isClearance: boolean;
  categoryName: string;
  requiredDocs: { name: string; isMandatory: boolean; description?: string }[];
  stages?: string[];
  formFields: { key: string; label: string; type: string; isRequired: boolean; options?: string; placeholder?: string }[];
};

const customsDocs = [
  { name: "الفاتورة التجارية", isMandatory: true, description: "Invoice موقّعة من المورد" },
  { name: "بوليصة الشحن", isMandatory: true, description: "Bill of Lading / Airway Bill" },
  { name: "قائمة التعبئة", isMandatory: true, description: "Packing List" },
  { name: "شهادة المنشأ", isMandatory: true },
  { name: "إذن التسليم", isMandatory: false, description: "Delivery Order من وكيل الشحن" },
  { name: "السجل التجاري للمستورد", isMandatory: true },
  { name: "البطاقة الضريبية للمستورد", isMandatory: true },
];

// ============ مستندات مشتركة للسفر والسياحة ============
const passportDoc = { name: "جواز سفر ساري المفعول (6 أشهر)", isMandatory: true, description: "صورة صفحة البيانات" };
const photoDoc = { name: "صورة شخصية بخلفية بيضاء", isMandatory: true, description: "مقاس 4×6 حديثة" };

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    name: "تخليص حاوية 20 قدم",
    description: "خدمة التخليص الجمركي الكاملة لحاوية 20 قدماً من ميناء عدن أو المنافذ، تشمل التدقيق المستندي والتصنيف والبيان الجمركي والمعاينة والإفراج.",
    icon: "container",
    price: null,
    priceLabel: "حسب الطلب",
    estimatedDays: 7,
    isClearance: true,
    categoryName: "التخليص الجمركي",
    requiredDocs: customsDocs,
    stages: DEFAULT_CLEARANCE_STAGES,
    formFields: [
      { key: "bl_number", label: "رقم بوليصة الشحن", type: "TEXT", isRequired: true },
      { key: "container_no", label: "رقم الحاوية", type: "TEXT", isRequired: true, placeholder: "مثل: MSCU1234567" },
      { key: "goods_desc", label: "وصف البضاعة", type: "TEXTAREA", isRequired: true },
      { key: "supplier", label: "اسم المورد", type: "TEXT", isRequired: false },
      { key: "origin", label: "بلد المنشأ", type: "SELECT", isRequired: true, options: "الصين,الهند,الإمارات,تركيا,السعودية,أخرى" },
      { key: "arrival_date", label: "تاريخ الوصول", type: "DATE", isRequired: false },
    ],
  },
  {
    name: "تخليص حاوية 40 قدم",
    description: "خدمة التخليص الجمركي الكاملة لحاوية 40 قدماً من ميناء عدن أو المنافذ البرية.",
    icon: "container",
    price: null,
    priceLabel: "حسب الطلب",
    estimatedDays: 8,
    isClearance: true,
    categoryName: "التخليص الجمركي",
    requiredDocs: customsDocs,
    stages: DEFAULT_CLEARANCE_STAGES,
    formFields: [
      { key: "bl_number", label: "رقم بوليصة الشحن", type: "TEXT", isRequired: true },
      { key: "container_no", label: "رقم الحاوية", type: "TEXT", isRequired: true },
      { key: "goods_desc", label: "وصف البضاعة", type: "TEXTAREA", isRequired: true },
      { key: "supplier", label: "اسم المورد", type: "TEXT", isRequired: false },
      { key: "origin", label: "بلد المنشأ", type: "SELECT", isRequired: true, options: "الصين,الهند,الإمارات,تركيا,السعودية,أخرى" },
      { key: "arrival_date", label: "تاريخ الوصول", type: "DATE", isRequired: false },
    ],
  },
  {
    name: "تخليص بضائع عامة (LCL)",
    description: "تخليص البضائع المجمعة والشحنات الجزئية من ميناء عدن أو المطارات.",
    icon: "package",
    price: null,
    priceLabel: "حسب الطلب",
    estimatedDays: 6,
    isClearance: true,
    categoryName: "التخليص الجمركي",
    requiredDocs: customsDocs,
    stages: DEFAULT_CLEARANCE_STAGES,
    formFields: [
      { key: "bl_number", label: "رقم بوليصة الشحن", type: "TEXT", isRequired: true },
      { key: "goods_desc", label: "وصف البضاعة", type: "TEXTAREA", isRequired: true },
      { key: "weight", label: "الوزن التقريبي (كجم)", type: "NUMBER", isRequired: false },
    ],
  },
  {
    name: "فحص مطابقة المواصفات والمقاييس",
    description: "إجراءات الفحص ومطابقة المواصفات لدى هيئة المواصفات والمقاييس ومعالجة القيود الفنية.",
    icon: "shield-check",
    price: null,
    priceLabel: "حسب الطلب",
    estimatedDays: 5,
    isClearance: true,
    categoryName: "التخليص الجمركي",
    requiredDocs: [
      { name: "الفاتورة التجارية", isMandatory: true },
      { name: "شهادة المنشأ", isMandatory: true },
      { name: "شهادة المطابقة إن وجدت", isMandatory: false },
    ],
    stages: ["استلام الطلب", "مراجعة المستندات", "تقديم الفحص", "نتيجة الفحص", "مكتمل"],
    formFields: [
      { key: "goods_desc", label: "وصف البضاعة", type: "TEXTAREA", isRequired: true },
      { key: "hs_code", label: "رمز النظام المنسق HS (إن وجد)", type: "TEXT", isRequired: false },
    ],
  },
  {
    name: "ترانزيت (عبور)",
    description: "إجراءات الترانزيت والعبور للبضائع العابرة عبر المنافذ اليمنية.",
    icon: "route",
    price: null,
    priceLabel: "حسب الطلب",
    estimatedDays: 4,
    isClearance: true,
    categoryName: "التخليص الجمركي",
    requiredDocs: customsDocs,
    stages: ["استلام الطلب", "التدقيق المستندي", "إصدار بيان الترانزيت", "تأمين العبور", "مكتمل"],
    formFields: [
      { key: "bl_number", label: "رقم بوليصة الشحن", type: "TEXT", isRequired: true },
      { key: "destination", label: "الوجهة النهائية", type: "TEXT", isRequired: true },
    ],
  },
  {
    name: "تجديد البطاقة الضريبية",
    description: "تجديد البطاقة الضريبية لدى مصلحة الضرائب – فرع عدن، مع متابعة كافة المراحل حتى الاستلام.",
    icon: "receipt",
    price: 15000,
    estimatedDays: 3,
    isClearance: false,
    categoryName: "وثائق تجارية وضريبية",
    requiredDocs: [
      { name: "صورة البطاقة الضريبية الحالية", isMandatory: true },
      { name: "السجل التجاري ساري المفعول", isMandatory: true },
      { name: "إقرار الدخل السنوي", isMandatory: false },
    ],
    stages: ["استلام الطلب", "مراجعة المستندات", "تقديم الطلب لمصلحة الضرائب", "سداد الرسوم", "جاهز للاستلام"],
    formFields: [
      { key: "tax_number", label: "الرقم الضريبي", type: "TEXT", isRequired: true },
      { key: "owner_name", label: "اسم المالك / المنشأة", type: "TEXT", isRequired: true },
    ],
  },
  {
    name: "استخراج / تجديد السجل التجاري",
    description: "إجراءات استخراج أو تجديد السجل التجاري لدى وزارة الصناعة والتجارة.",
    icon: "file-badge",
    price: 20000,
    estimatedDays: 5,
    isClearance: false,
    categoryName: "وثائق تجارية وضريبية",
    requiredDocs: [
      { name: "صورة هوية المالك", isMandatory: true },
      { name: "صورة السجل التجاري السابق (للتجديد)", isMandatory: false },
      { name: "عقد الإيجار أو ملكية المحل", isMandatory: true },
    ],
    stages: ["استلام الطلب", "تجهيز المستندات", "تقديم الطلب", "المتابعة", "جاهز للاستلام"],
    formFields: [
      { key: "activity", label: "النشاط التجاري", type: "TEXT", isRequired: true },
      { key: "entity_name", label: "اسم المنشأة", type: "TEXT", isRequired: true },
    ],
  },
  // ============ قوالب السفر والسياحة والخدمات اللوجستية ============
  {
    name: "تذاكر طيران دولية",
    description: "حجز وإصدار تذاكر الطيران لأفضل المسارات والأسعار، مع إمكانية التغيير والاسترجاع وفق أنظمة شركات الطيران.",
    icon: "plane",
    price: null,
    priceLabel: "حسب الوجهة والموسم",
    estimatedDays: 2,
    isClearance: false,
    categoryName: "السفر والطيران",
    requiredDocs: [passportDoc],
    stages: ["استلام الطلب", "تحديد أفضل رحلة", "تأكيد الحجز", "إصدار التذكرة", "التسليم"],
    formFields: [
      { key: "from", label: "مدينة/مطار المغادرة", type: "TEXT", isRequired: true, placeholder: "مثل: عدن أو صنعاء" },
      { key: "to", label: "الوجهة النهائية", type: "TEXT", isRequired: true },
      { key: "depart_date", label: "تاريخ المغادرة", type: "DATE", isRequired: true },
      { key: "return_date", label: "تاريخ العودة (إن وجد)", type: "DATE", isRequired: false },
      { key: "passengers", label: "عدد المسافرين", type: "NUMBER", isRequired: true },
      { key: "cabin", label: "درجة المقعد", type: "SELECT", isRequired: true, options: "اقتصادي,اقتصادي مميز,أعمال,أولى" },
    ],
  },
  {
    name: "حجز فنادق",
    description: "حجز غرف الفنادق والشقق الفندقية حول العالم بأسعار تفضيلية مع قسيمة إقامة مؤكدة.",
    icon: "hotel",
    price: null,
    priceLabel: "حسب المدينة والفندق",
    estimatedDays: 1,
    isClearance: false,
    categoryName: "السفر والطيران",
    requiredDocs: [passportDoc],
    stages: ["استلام الطلب", "اختيار الفندق", "تأكيد الحجز", "إصدار قسيمة الإقامة", "التسليم"],
    formFields: [
      { key: "city", label: "المدينة", type: "TEXT", isRequired: true },
      { key: "check_in", label: "تاريخ الوصول", type: "DATE", isRequired: true },
      { key: "check_out", label: "تاريخ المغادرة", type: "DATE", isRequired: true },
      { key: "rooms", label: "عدد الغرف", type: "NUMBER", isRequired: true },
      { key: "guests", label: "عدد الضيوف", type: "NUMBER", isRequired: true },
      { key: "stars", label: "فئة الفندق", type: "SELECT", isRequired: true, options: "ثلاث نجوم,أربع نجوم,خمس نجوم,شقة فندقية" },
    ],
  },
  {
    name: "تأشيرة سياحية",
    description: "تجهيز ملف طلب التأشيرة السياحية كاملاً والتقديم لدى السفارات والقنصليات ومتابعة النتيجة حتى استلام الجواز.",
    icon: "visa",
    price: null,
    priceLabel: "حسب الدولة ونوع التأشيرة",
    estimatedDays: 15,
    isClearance: false,
    categoryName: "التأشيرات",
    requiredDocs: [
      passportDoc,
      photoDoc,
      { name: "كشف حساب بنكي (آخر 6 أشهر)", isMandatory: true },
      { name: "تعريف بالعمل أو بالراتب", isMandatory: true },
      { name: "حجز فندق وتذاكر ذهاب وعودة", isMandatory: false },
    ],
    stages: ["استلام الطلب", "تجهيز ملف المتقدم", "تقديم الطلب للسفارة", "المتابعة مع السفارة", "استلام الجواز بالتأشيرة"],
    formFields: [
      { key: "destination", label: "دولة الوجهة", type: "TEXT", isRequired: true },
      { key: "visa_type", label: "نوع التأشيرة", type: "SELECT", isRequired: true, options: "سياحية,زيارة عائلية,زيارة تجارية قصيرة,علاجية" },
      { key: "entries", label: "عدد مرات الدخول", type: "SELECT", isRequired: true, options: "دخول واحد,دخول متعدد" },
      { key: "travelers", label: "عدد المتقدمين", type: "NUMBER", isRequired: true },
    ],
  },
  {
    name: "حزمة العمرة",
    description: "باقة عمرة متكاملة: التأشيرة وتذاكر الطيران والإقامة والتنقل بين المشاعر مع إشراف متفرغ طوال الرحلة.",
    icon: "umrah",
    price: null,
    priceLabel: "حسب الباقة والموسم",
    estimatedDays: 14,
    isClearance: false,
    categoryName: "الحج والعمرة",
    requiredDocs: [
      passportDoc,
      photoDoc,
      { name: "شهادة التطعيم (حمى الوادي المتصدع)", isMandatory: true },
      { name: "تعريف عائلي للنساء المصطحبات (إن وجد)", isMandatory: false },
    ],
    stages: ["الحجز والتسجيل", "استكمال المستندات", "إصدار التأشيرة", "تأكيد الطيران والإقامة", "جاهز للسفر"],
    formFields: [
      { key: "package_type", label: "نوع الباقة", type: "SELECT", isRequired: true, options: "اقتصادية,أربع نجوم,خمس نجوم,VIP" },
      { key: "departure_city", label: "مدينة المغادرة", type: "TEXT", isRequired: true },
      { key: "adults", label: "عدد البالغين", type: "NUMBER", isRequired: true },
      { key: "children", label: "عدد الأطفال", type: "NUMBER", isRequired: false },
      { key: "room_type", label: "نوع الغرفة", type: "SELECT", isRequired: true, options: "ثنائية,ثلاثية,رباعية" },
    ],
  },
  {
    name: "حزمة الحج",
    description: "برنامج الحج الشامل: التأشيرة والبعثة والنقل والإقامة والتغذية والإشراف الديني والطبي طوال موسم الحج.",
    icon: "umrah",
    price: null,
    priceLabel: "حسب الباقة والموسم",
    estimatedDays: 40,
    isClearance: false,
    categoryName: "الحج والعمرة",
    requiredDocs: [
      passportDoc,
      photoDoc,
      { name: "شهادة التطعيم (حمى الوادي المتصدع)", isMandatory: true },
      { name: "تعريف عائلي للنساء المصطحبات (إن وجد)", isMandatory: false },
    ],
    stages: ["الحجز والتسجيل", "استكمال المستندات", "إصدار التأشيرة", "تأكيد البعثة والنقل والإقامة", "جاهز للسفر"],
    formFields: [
      { key: "package_type", label: "نوع الباقة", type: "SELECT", isRequired: true, options: "قصيرة,طويلة,مخيم VIP" },
      { key: "departure_city", label: "مدينة المغادرة", type: "TEXT", isRequired: true },
      { key: "adults", label: "عدد الحجاج", type: "NUMBER", isRequired: true },
      { key: "room_type", label: "نوع الغرفة", type: "SELECT", isRequired: true, options: "ثنائية,ثلاثية,رباعية" },
    ],
  },
  {
    name: "برنامج سياحي داخلي",
    description: "برامج ورحلات سياحية داخلية (سقطرى، صنعاء القديمة وكوكبان، تعز وعدن، حضرموت وشبام) مع مرشد ونقل وإقامة.",
    icon: "route",
    price: null,
    priceLabel: "حسب البرنامج وعدد الأفراد",
    estimatedDays: 3,
    isClearance: false,
    categoryName: "البرامج السياحية",
    requiredDocs: [{ name: "صورة هوية أو جواز سفر", isMandatory: true }],
    stages: ["الحجز", "تأكيد البرنامج والمرشد", "تنفيذ البرنامج", "إنجاز"],
    formFields: [
      { key: "destination", label: "الوجهة", type: "SELECT", isRequired: true, options: "سقطرى,صنعاء القديمة وكوكبان,تعز وعدن,حضرموت وشبام,المهرة,مأرب" },
      { key: "start_date", label: "تاريخ الانطلاق", type: "DATE", isRequired: true },
      { key: "days", label: "عدد أيام البرنامج", type: "NUMBER", isRequired: true },
      { key: "group_size", label: "عدد الأفراد", type: "NUMBER", isRequired: true },
      { key: "guide", label: "الإشراف والمرشد", type: "SELECT", isRequired: true, options: "مع مرشد سياحي,بدون مرشد" },
    ],
  },
  {
    name: "شحن جوي دولي (Door to Door)",
    description: "شحن الطرود والبضائع الصغيرة جوياً من وإلى اليمن مع التغليف والتتبع والتسليم النهائي للباب.",
    icon: "package",
    price: null,
    priceLabel: "حسب الوزن والوجهة",
    estimatedDays: 10,
    isClearance: false,
    categoryName: "الخدمات اللوجستية",
    requiredDocs: [
      { name: "قائمة المحتويات المفصلة", isMandatory: true },
      { name: "صورة هوية المرسل", isMandatory: true },
    ],
    stages: ["استلام الطلب", "استلام الشحنة والتغليف", "الشحن والمتابعة", "التسليم النهائي"],
    formFields: [
      { key: "origin", label: "بلد/مدينة الإرسال", type: "TEXT", isRequired: true },
      { key: "destination", label: "بلد/مدينة الاستلام", type: "TEXT", isRequired: true },
      { key: "weight", label: "الوزن التقريبي (كجم)", type: "NUMBER", isRequired: true },
      { key: "contents", label: "وصف المحتويات", type: "TEXTAREA", isRequired: true },
    ],
  },
  {
    name: "النقل البري وتأجير السيارات",
    description: "تأجير سيارات وحافلات مع سائق، ونقل البضائع والركاب بين المدن اليمنية بأسطول مجهز.",
    icon: "route",
    price: null,
    priceLabel: "حسب المركبة والمسار",
    estimatedDays: 1,
    isClearance: false,
    categoryName: "الخدمات اللوجستية",
    requiredDocs: [{ name: "صورة هوية طالب الخدمة", isMandatory: true }],
    stages: ["استلام الطلب", "تأكيد المركبة والسائق", "تنفيذ النقل", "إنجاز"],
    formFields: [
      { key: "vehicle", label: "نوع المركبة", type: "SELECT", isRequired: true, options: "سيارة خاصة,سائق مع سيارة,بك أب,حافلة صغيرة,حافلة كبيرة,شاحنة نقل بضائع" },
      { key: "route", label: "المسار (من - إلى)", type: "TEXT", isRequired: true },
      { key: "date", label: "تاريخ النقل", type: "DATE", isRequired: true },
      { key: "days", label: "عدد أيام الاستئجار", type: "NUMBER", isRequired: false },
    ],
  },
];

// ============ قوالب الإشعارات الافتراضية ============
export const DEFAULT_TEMPLATES: {
  event: string;
  channel: string;
  subject?: string;
  body: string;
}[] = [
  {
    event: "NEW_REQUEST",
    channel: "INAPP",
    subject: "طلب جديد وارد",
    body: "ورد طلب جديد {{request_number}} من العميل {{client_name}} لخدمة {{service_name}}.",
  },
  {
    event: "NEW_REQUEST",
    channel: "EMAIL",
    subject: "طلب جديد {{request_number}}",
    body: "عميلنا الكريم {{client_name}}،\nتم استلام طلبكم رقم {{request_number}} لخدمة {{service_name}} وسيبدأ فريقنا بمراجعته فوراً.\nرابط التتبع: {{track_link}}",
  },
  {
    event: "NEW_REQUEST",
    channel: "WHATSAPP",
    body: "عميلنا الكريم {{client_name}}، تم استلام طلبكم {{request_number}} ({{service_name}}). تابعوه عبر: {{track_link}}",
  },
  {
    event: "MISSING_DOCS",
    channel: "INAPP",
    subject: "استكمال مستندات ناقصة",
    body: "طلبكم {{request_number}} بحاجة إلى استكمال المستندات التالية: {{missing_docs}}. الموعد النهائي: {{deadline}}",
  },
  {
    event: "MISSING_DOCS",
    channel: "WHATSAPP",
    body: "عميلنا الكريم {{client_name}}، لاستكمال طلبكم {{request_number}} يلزم رفع: {{missing_docs}} قبل {{deadline}}. ارفعوها من: {{track_link}}",
  },
  {
    event: "ACCEPTED",
    channel: "INAPP",
    subject: "تم قبول طلبكم",
    body: "تم قبول طلبكم {{request_number}}. المدة المتوقعة للإنجاز: {{estimated_days}} يوم عمل، والتاريخ المتوقع: {{expected_date}}.",
  },
  {
    event: "ACCEPTED",
    channel: "WHATSAPP",
    body: "عميلنا الكريم {{client_name}}، تم قبول طلبكم {{request_number}} ({{service_name}}). المدة المتوقعة {{estimated_days}} يوم عمل — التسليم المتوقع: {{expected_date}}",
  },
  {
    event: "REJECTED",
    channel: "INAPP",
    subject: "تم رفض الطلب",
    body: "نعتذر، تم رفض طلبكم {{request_number}} للسبب التالي: {{reason}}",
  },
  {
    event: "STAGE_CHANGE",
    channel: "INAPP",
    subject: "تحديث حالة الطلب",
    body: "طلبكم {{request_number}} انتقل إلى مرحلة: {{stage_name}}.",
  },
  {
    event: "STAGE_CHANGE",
    channel: "WHATSAPP",
    body: "تحديث طلبكم {{request_number}}: {{stage_name}} — {{track_link}}",
  },
  {
    event: "COMPLETED",
    channel: "INAPP",
    subject: "اكتملت معاملتكم 🎉",
    body: "اكتمل تنفيذ طلبكم {{request_number}} ({{service_name}}). المستندات النهائية متاحة عبر رابط التتبع: {{track_link}}",
  },
  {
    event: "COMPLETED",
    channel: "WHATSAPP",
    body: "عميلنا الكريم {{client_name}}، اكتملت معاملتكم {{request_number}} ✅ المستندات النهائية وتفاصيل الاستلام: {{track_link}}",
  },
  {
    event: "COMPLETED",
    channel: "EMAIL",
    subject: "اكتمال المعاملة {{request_number}}",
    body: "عميلنا الكريم {{client_name}}،\nيسرنا إبلاغكم باكتمال معاملتكم {{request_number}} لخدمة {{service_name}}.\nيمكنكم تحميل المستندات النهائية وتفاصيل الاستلام عبر: {{track_link}}\nشكراً لثقتكم.",
  },
  {
    event: "ASSIGNED",
    channel: "INAPP",
    subject: "تكليف بطلب جديد",
    body: "تم إسناد الطلب {{request_number}} إليكم.",
  },
  {
    event: "DELAYED",
    channel: "INAPP",
    subject: "تأخر عن المدة المتوقعة",
    body: "الطلب {{request_number}} تجاوز التاريخ المتوقع للإنجاز {{expected_date}}.",
  },
  {
    event: "PAYMENT_DUE",
    channel: "INAPP",
    subject: "استحقاق دفعة",
    body: "الطلب {{request_number}}: المتبقي المستحق {{remaining}}.",
  },
];

// ============ جدول HS Code أولي (بيانات استرشادية قابلة للتحديث من مدير النظام) ============
export const HS_CODES_SEED: {
  code: string;
  descriptionAr: string;
  descriptionEn: string;
  unit?: string;
  dutyRate: number;
  salesTaxRate: number;
}[] = [
  { code: "030199", descriptionAr: "أسماك حية أخرى", descriptionEn: "Live fish, other", unit: "كجم", dutyRate: 5, salesTaxRate: 5 },
  { code: "100590", descriptionAr: "ذرة (ذرة صفراء) غير مطحونة", descriptionEn: "Maize (corn), other", unit: "كجم", dutyRate: 5, salesTaxRate: 5 },
  { code: "100630", descriptionAr: "أرز شبه مبيّض أو مبيّض بالكامل", descriptionEn: "Semi-milled or wholly milled rice", unit: "كجم", dutyRate: 5, salesTaxRate: 5 },
  { code: "110100", descriptionAr: "دقيق قمح", descriptionEn: "Wheat flour", unit: "كجم", dutyRate: 5, salesTaxRate: 5 },
  { code: "170199", descriptionAr: "سكر قصب أو بنجر مكرر آخر", descriptionEn: "Cane or beet sugar, refined", unit: "كجم", dutyRate: 20, salesTaxRate: 5 },
  { code: "151110", descriptionAr: "زيت نخيل الخام", descriptionEn: "Palm oil, crude", unit: "لتر", dutyRate: 5, salesTaxRate: 5 },
  { code: "170210", descriptionAr: "سكر جلوكوز في صورة صلبة", descriptionEn: "Glucose in solid form", unit: "كجم", dutyRate: 15, salesTaxRate: 5 },
  { code: "190211", descriptionAr: "معكرونة غير مطبوخة", descriptionEn: "Uncooked pasta", unit: "كجم", dutyRate: 15, salesTaxRate: 5 },
  { code: "210690", descriptionAr: "مستحضرات غذائية غير محددة", descriptionEn: "Food preparations n.e.s.", unit: "كجم", dutyRate: 20, salesTaxRate: 5 },
  { code: "220210", descriptionAr: "مياه معدنية ومشروبات غير كحولية", descriptionEn: "Waters & non-alcoholic beverages", unit: "لتر", dutyRate: 20, salesTaxRate: 5 },
  { code: "240220", descriptionAr: "سجائر تحتوي تبغاً", descriptionEn: "Cigarettes containing tobacco", unit: "ألف حبة", dutyRate: 100, salesTaxRate: 20 },
  { code: "252329", descriptionAr: "أسمنت بورتلاندي آخر", descriptionEn: "Other Portland cement", unit: "كجم", dutyRate: 10, salesTaxRate: 5 },
  { code: "271019", descriptionAr: "زيوت نفطية أخرى (سولار/ديزل)", descriptionEn: "Other petroleum oils", unit: "لتر", dutyRate: 5, salesTaxRate: 5 },
  { code: "300490", descriptionAr: "أدوية معبأة للبيع بالتجزئة", descriptionEn: "Medicaments, packaged", unit: "كجم", dutyRate: 5, salesTaxRate: 0 },
  { code: "330499", descriptionAr: "مستحضرات تجميل أخرى", descriptionEn: "Beauty preparations n.e.s.", unit: "كجم", dutyRate: 25, salesTaxRate: 5 },
  { code: "340250", descriptionAr: "منظفات ومواد تلميع", descriptionEn: "Preparations for washing/cleaning", unit: "كجم", dutyRate: 20, salesTaxRate: 5 },
  { code: "380891", descriptionAr: "مبيدات حشرية", descriptionEn: "Insecticides", unit: "كجم", dutyRate: 5, salesTaxRate: 5 },
  { code: "392010", descriptionAr: "صفائح وأغشية من بلاستيك البولي إيثيلين", descriptionEn: "Plates/sheets of polymers of ethylene", unit: "كجم", dutyRate: 15, salesTaxRate: 5 },
  { code: "392321", descriptionAr: "أكياس من البلاستيك", descriptionEn: "Sacks and bags of plastics", unit: "كجم", dutyRate: 15, salesTaxRate: 5 },
  { code: "401110", descriptionAr: "إطارات مطاطية جديدة للسيارات", descriptionEn: "New pneumatic tyres, cars", unit: "قطعة", dutyRate: 15, salesTaxRate: 5 },
  { code: "481910", descriptionAr: "كراتين من الورق المقوى", descriptionEn: "Cartons of corrugated paper", unit: "كجم", dutyRate: 15, salesTaxRate: 5 },
  { code: "520512", descriptionAr: "غزل قطني مفرد", descriptionEn: "Single cotton yarn", unit: "كجم", dutyRate: 15, salesTaxRate: 5 },
  { code: "540761", descriptionAr: "أقمشة من نسج البوليستر", descriptionEn: "Woven fabrics of polyester", unit: "متر", dutyRate: 20, salesTaxRate: 5 },
  { code: "610910", descriptionAr: "تيشيرتات قطنية موصولة", descriptionEn: "T-shirts, cotton, knitted", unit: "قطعة", dutyRate: 20, salesTaxRate: 5 },
  { code: "640399", descriptionAr: "أحذية بأسطح من الجلد الطبيعي", descriptionEn: "Footwear, leather uppers", unit: "زوج", dutyRate: 25, salesTaxRate: 5 },
  { code: "701090", descriptionAr: "أوعية زجاجية للمواد الغذائية", descriptionEn: "Glass containers for food", unit: "كجم", dutyRate: 15, salesTaxRate: 5 },
  { code: "720851", descriptionAr: "منتجات مسطحة من حديد غير مطلي", descriptionEn: "Flat-rolled iron, non-alloy steel", unit: "كجم", dutyRate: 10, salesTaxRate: 5 },
  { code: "730890", descriptionAr: "منشآت وأجزاء من حديد للمباني", descriptionEn: "Structures/parts of iron", unit: "كجم", dutyRate: 10, salesTaxRate: 5 },
  { code: "731815", descriptionAr: "براغي ومسامير من حديد أو فولاذ", descriptionEn: "Bolts and screws", unit: "كجم", dutyRate: 10, salesTaxRate: 5 },
  { code: "841370", descriptionAr: "مضخات طرد مركزي للسوائل", descriptionEn: "Centrifugal pumps", unit: "قطعة", dutyRate: 10, salesTaxRate: 5 },
  { code: "841581", descriptionAr: "أجهزة تكييف هوائية", descriptionEn: "Air conditioners", unit: "قطعة", dutyRate: 15, salesTaxRate: 5 },
  { code: "847130", descriptionAr: "أجهزة معالجة بيانات محمولة (حاسوب)", descriptionEn: "Portable data processing machines", unit: "قطعة", dutyRate: 5, salesTaxRate: 5 },
  { code: "851713", descriptionAr: "هواتف ذكية", descriptionEn: "Smartphones", unit: "قطعة", dutyRate: 5, salesTaxRate: 5 },
  { code: "853400", descriptionAr: "لوحات دوائر مطبوعة", descriptionEn: "Printed circuits", unit: "كجم", dutyRate: 5, salesTaxRate: 5 },
  { code: "854140", descriptionAr: "خلايا شمسية ووحدات كهروضوئية", descriptionEn: "Photovoltaic cells/modules", unit: "قطعة", dutyRate: 5, salesTaxRate: 5 },
  { code: "870323", descriptionAr: "سيارات ركوب سعة 1500-3000 سم³", descriptionEn: "Motor cars 1500-3000cc", unit: "قطعة", dutyRate: 25, salesTaxRate: 5 },
  { code: "870421", descriptionAr: "شاحنات نقل بضائع", descriptionEn: "Goods transport vehicles", unit: "قطعة", dutyRate: 25, salesTaxRate: 5 },
  { code: "870899", descriptionAr: "قطع غيار السيارات الأخرى", descriptionEn: "Motor vehicle parts n.e.s.", unit: "كجم", dutyRate: 15, salesTaxRate: 5 },
  { code: "940360", descriptionAr: "أثاث خشبي آخر", descriptionEn: "Other wooden furniture", unit: "قطعة", dutyRate: 25, salesTaxRate: 5 },
  { code: "940511", descriptionAr: "ثريات كهربائية", descriptionEn: "Electrical chandeliers", unit: "قطعة", dutyRate: 20, salesTaxRate: 5 },
  { code: "320810", descriptionAr: "دهانات وطلاءات", descriptionEn: "Paints and varnishes", unit: "كجم", dutyRate: 20, salesTaxRate: 5 },
  { code: "350610", descriptionAr: "مواد لاصقة", descriptionEn: "Adhesives", unit: "كجم", dutyRate: 15, salesTaxRate: 5 },
  { code: "381600", descriptionAr: "مواد كيميائية صناعية أخرى", descriptionEn: "Other industrial chemicals", unit: "كجم", dutyRate: 10, salesTaxRate: 5 },
  { code: "760110", descriptionAr: "ألومنيوم غير مطلي", descriptionEn: "Aluminium, not alloyed", unit: "كجم", dutyRate: 10, salesTaxRate: 5 },
  { code: "691010", descriptionAr: "أحواض ومغاسل خزفية", descriptionEn: "Ceramic sinks/washbasins", unit: "قطعة", dutyRate: 20, salesTaxRate: 5 },
  { code: "630260", descriptionAr: "مناشف مطبخ وحمام من قطن", descriptionEn: "Terry towels of cotton", unit: "كجم", dutyRate: 20, salesTaxRate: 5 },
];
