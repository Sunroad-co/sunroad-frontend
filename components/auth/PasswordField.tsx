"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordFieldProps {
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

export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder = "Enter your password",
  required = false,
  disabled = false,
  className,
  autoFocus = false,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-sunroad-brown-700 font-body">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            "h-12 px-4 pr-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-sunroad-amber-600 focus:border-transparent transition-all duration-200 hover:border-sunroad-amber-300 font-body",
            error && "border-red-300 focus:ring-red-500"
          )}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sunroad-brown-500 hover:text-sunroad-brown-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-600 focus-visible:ring-offset-2 rounded"
          aria-label={showPassword ? "Hide password" : "Show password"}
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 font-body">{error}</p>
      )}
    </div>
  );
}

