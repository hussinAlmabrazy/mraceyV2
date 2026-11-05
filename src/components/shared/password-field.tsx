"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

/** حقل كلمة مرور مع زر إظهار/إخفاء — name مستقل عن id لتفادي تعارض النماذج المتجاورة */
export function PasswordField({
  id, name, label, placeholder, autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold">
        {label} <span className="text-rose-500">*</span>
      </label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          dir="ltr"
          autoComplete={autoComplete}
          required
          className="h-10 text-xs pl-10 pr-3"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          className="absolute inset-y-0 left-0 flex items-center justify-center w-10 text-muted-foreground hover:text-foreground transition-colors"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
