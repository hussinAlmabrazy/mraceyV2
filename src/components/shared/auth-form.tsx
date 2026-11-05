"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  dir?: "ltr" | "rtl";
  hint?: string;
  value?: string;
};

type SelectField = {
  name: string;
  label: string;
  type: "select";
  options: { value: string; label: string }[];
  required?: boolean;
};

export type ActionState = { error?: string } | undefined;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full font-bold gap-2 h-11" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function AuthForm({
  action, fields, submitLabel, className, footer,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: (Field | SelectField)[];
  submitLabel: string;
  className?: string;
  footer?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <form action={formAction} className={cn("space-y-4", className)}>
      {state?.error && (
        <Alert variant="destructive" className="py-2.5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs font-medium">{state.error}</AlertDescription>
        </Alert>
      )}
      {fields.map((f) => {
        if (f.type === "hidden") {
          return <input key={f.name} type="hidden" name={f.name} value={(f as any).value ?? ""} />;
        }
        return (
        <div key={f.name} className="space-y-1.5">
          <Label htmlFor={f.name} className="text-xs font-bold">
            {f.label}
            {f.required !== false && f.label && <span className="text-rose-500 mr-1">*</span>}
          </Label>
          {f.type === "select" ? (
            <select
              id={f.name}
              name={f.name}
              defaultValue={(f as SelectField).options[0]?.value}
              className="flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {(f as SelectField).options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <Input
              id={f.name}
              name={f.name}
              type={f.type || "text"}
              placeholder={f.placeholder}
              dir={(f as Field).dir}
              className="h-11"
              autoComplete="off"
              required={f.required !== false}
            />
          )}
          {(f as Field).hint && <p className="text-[11px] text-muted-foreground">{(f as Field).hint}</p>}
        </div>
        );
      })}
      <SubmitButton label={submitLabel} />
      {footer}
    </form>
  );
}
