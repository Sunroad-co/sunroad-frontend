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
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { TurnstileCaptcha, TurnstileCaptchaHandle } from "@/components/auth/TurnstileCaptcha";

type Step = "email" | "otp";

export default function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [resendCaptchaToken, setResendCaptchaToken] = useState<string | null>(null);
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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      setError("Please complete the CAPTCHA verification.");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          captchaToken,
        },
      });
      if (error) throw error;
      setStep("otp");
      setResendCooldown(60); // 60 second cooldown
      captchaRef.current?.reset();
      setCaptchaToken(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send OTP. Please try again.";
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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          captchaToken: resendCaptchaToken,
        },
      });
      if (error) throw error;
      setResendCooldown(60);
      resendCaptchaRef.current?.reset();
      setResendCaptchaToken(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to resend OTP. Please try again.";
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) throw error;
      // On success, redirect to onboarding
      router.push("/onboarding");
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

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto", className)} {...props}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-body">
            {step === "email" ? "Sign up" : "Verify your email"}
          </CardTitle>
          <CardDescription className="font-body">
            {step === "email"
              ? "Enter your email to receive a verification code"
              : `We sent a code to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          {step === "email" ? (
            <form onSubmit={handleSendOTP}>
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
                  {isLoading ? "Sending code..." : "Send verification code"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm font-body">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline underline-offset-4">
                  Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="otp" className="font-body">Verification code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter 6-digit code"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={isLoading}
                    maxLength={6}
                    autoFocus
                    className="text-center text-2xl tracking-widest font-mono h-12"
                  />
                  <p className="text-xs text-muted-foreground font-body">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>
                {error && <p className="text-sm text-red-500 font-body">{error}</p>}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-sunroad-amber-600 hover:bg-sunroad-amber-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl font-body" 
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? "Verifying..." : "Verify code"}
                </Button>
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
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="text-sm text-sunroad-brown-600 hover:text-sunroad-brown-700 underline underline-offset-4 disabled:opacity-50 font-body"
                  >
                    Change email
                  </button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

