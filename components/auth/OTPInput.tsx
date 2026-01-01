"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function OTPInput({
  id,
  label,
  value,
  onChange,
  error,
  placeholder = "Enter 6-digit code",
  required = false,
  disabled = false,
  className,
  autoFocus = false,
}: OTPInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input, max 6 digits
    const numericValue = e.target.value.replace(/\D/g, "").slice(0, 6);
    onChange(numericValue);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id} className="font-body">{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        maxLength={6}
        autoFocus={autoFocus}
        className={cn(
          "text-center text-2xl tracking-widest font-mono h-12",
          error && "border-red-300 focus:ring-red-500"
        )}
      />
      {error && (
        <p className="text-sm text-red-600 font-body">{error}</p>
      )}
    </div>
  );
}

