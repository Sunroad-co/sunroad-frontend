"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TurnstileCaptcha, TurnstileCaptchaHandle } from "@/components/auth/TurnstileCaptcha";
import { PasswordField } from "@/components/auth/PasswordField";
import { OTPInput } from "@/components/auth/OTPInput";
import { validatePassword, mapPasswordError } from "@/lib/utils/password-validation";

type Step = "request" | "verify" | "reset";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [resendCaptchaToken, setResendCaptchaToken] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  
  const captchaRef = useRef<TurnstileCaptchaHandle>(null);
  const resendCaptchaRef = useRef<TurnstileCaptchaHandle>(null);
  const router = useRouter();

  // Cooldown timer for resend OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Password validation
  useEffect(() => {
    if (newPassword) {
      setPasswordError(validatePassword(newPassword));
      // Re-validate confirm password if it exists
      if (confirmPassword && confirmPassword !== newPassword) {
        setConfirmPasswordError("Passwords do not match.");
      } else if (confirmPassword) {
        setConfirmPasswordError(null);
      }
    } else {
      setPasswordError(null);
      if (confirmPassword) {
        setConfirmPasswordError(null);
      }
    }
  }, [newPassword, confirmPassword]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      setError("Please complete the CAPTCHA verification.");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
        captchaToken,
      });
      if (error) throw error;
      setStep("verify");
      setResendCooldown(60); // 60 second cooldown
      captchaRef.current?.reset();
      setCaptchaToken(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      if (errorMessage.includes('captcha') || errorMessage.includes('CAPTCHA') || errorMessage.includes('turnstile')) {
        setError("CAPTCHA verification failed. Please try again.");
      } else {
        setError(errorMessage);
      }
      captchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "recovery",
      });
      if (error) throw error;
      setStep("reset");
      setOtp("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      if (errorMessage.includes("expired") || errorMessage.includes("invalid")) {
        setError("Invalid or expired code. Please request a new one.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    if (!resendCaptchaToken) {
      setError("Please complete the CAPTCHA verification.");
      return;
    }
    
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
        captchaToken: resendCaptchaToken,
      });
      if (error) throw error;
      setResendCooldown(60);
      resendCaptchaRef.current?.reset();
      setResendCaptchaToken(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to resend code. Please try again.";
      if (errorMessage.includes('captcha') || errorMessage.includes('CAPTCHA') || errorMessage.includes('turnstile')) {
        setError("CAPTCHA verification failed. Please try again.");
      } else {
        setError(errorMessage);
      }
      resendCaptchaRef.current?.reset();
      setResendCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      
      // Sign out and redirect to login for safety
      await supabase.auth.signOut();
      router.push("/auth/login?reset=success");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      const mappedError = mapPasswordError(errorMessage);
      setError(mappedError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto", className)} {...props}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-body">
            {step === "request" && "Reset Your Password"}
            {step === "verify" && "Verify Your Code"}
            {step === "reset" && "Set New Password"}
          </CardTitle>
          <CardDescription className="font-body">
            {step === "request" && "Enter your email to receive a password reset code"}
            {step === "verify" && `We sent a 6-digit code to ${email}`}
            {step === "reset" && "Enter your new password"}
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          {step === "request" ? (
            <form onSubmit={handleRequestOTP}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="font-body">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12 font-body"
                  />
                </div>
                {error && <p className="text-sm text-red-500 font-body">{error}</p>}
                <TurnstileCaptcha
                  ref={captchaRef}
                  onToken={setCaptchaToken}
                  onExpire={() => {
                    setCaptchaToken(null);
                  }}
                  onError={() => {
                    setCaptchaToken(null);
                  }}
                  className="my-2"
                  size="normal"
                />
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-sunroad-amber-600 hover:bg-sunroad-amber-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl font-body" 
                  disabled={isLoading || !captchaToken}
                >
                  {isLoading ? "Sending code..." : "Send code"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm font-body">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  prefetch={false}
                  className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline underline-offset-4 font-body"
                >
                  Sign in
                </Link>
              </div>
            </form>
          ) : step === "verify" ? (
            <form onSubmit={handleVerifyOTP}>
              <div className="flex flex-col gap-6">
                <OTPInput
                  id="otp"
                  label="Verification code"
                  value={otp}
                  onChange={setOtp}
                  error={error && error.includes("code") ? error : null}
                  disabled={isLoading}
                  autoFocus
                />
                {error && !error.includes("code") && (
                  <p className="text-sm text-red-500 font-body">{error}</p>
                )}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-sunroad-amber-600 hover:bg-sunroad-amber-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl font-body" 
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? "Verifying..." : "Verify code"}
                </Button>
                <div className="flex flex-col gap-3">
                  {resendCooldown === 0 && (
                    <TurnstileCaptcha
                      ref={resendCaptchaRef}
                      onToken={setResendCaptchaToken}
                      onExpire={() => {
                        setResendCaptchaToken(null);
                      }}
                      onError={() => {
                        setResendCaptchaToken(null);
                      }}
                      className="my-2"
                      size="compact"
                    />
                  )}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={isLoading || resendCooldown > 0 || !resendCaptchaToken}
                      className="text-sm text-sunroad-amber-600 hover:text-sunroad-amber-700 underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed font-body"
                    >
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Resend code"}
                    </button>
                  </div>
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("request");
                      setOtp("");
                      setError(null);
                      setResendCaptchaToken(null);
                      resendCaptchaRef.current?.reset();
                    }}
                    disabled={isLoading}
                    className="text-sm text-sunroad-brown-600 hover:text-sunroad-brown-700 underline underline-offset-4 disabled:opacity-50 font-body"
                  >
                    Change email
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="flex flex-col gap-6">
                <PasswordField
                  id="newPassword"
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  error={passwordError}
                  placeholder="Enter your new password"
                  required
                  disabled={isLoading}
                  autoFocus
                />
                <PasswordField
                  id="confirmPassword"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  error={confirmPasswordError}
                  placeholder="Confirm your new password"
                  required
                  disabled={isLoading}
                />
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600 font-body">{error}</p>
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-sunroad-amber-600 hover:bg-sunroad-amber-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl font-body" 
                  disabled={isLoading || !!passwordError || !!confirmPasswordError || !newPassword || !confirmPassword}
                >
                  {isLoading ? "Updating password..." : "Update password"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
