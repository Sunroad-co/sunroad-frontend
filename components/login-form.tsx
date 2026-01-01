"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TurnstileCaptcha, TurnstileCaptchaHandle } from "@/components/auth/TurnstileCaptcha";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileCaptchaHandle>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccessMessage("Password reset successful! Please sign in with your new password.");
      // Clear the query parameter from URL
      router.replace("/auth/login", { scroll: false });
    }
  }, [searchParams, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      setError("Please complete the CAPTCHA verification.");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken,
        },
      });
      if (error) throw error;
      // Redirect to user dashboard after successful login
      router.push("/dashboard/profile");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      // Map Supabase password policy errors to user-friendly messages
      if (errorMessage.includes('captcha') || errorMessage.includes('CAPTCHA') || errorMessage.includes('turnstile')) {
        setError("CAPTCHA verification failed. Please try again.");
        captchaRef.current?.reset();
        setCaptchaToken(null);
      } else if (errorMessage.includes('password') || errorMessage.includes('policy') || errorMessage.includes('Invalid login')) {
        setError("Invalid email or password. Please try again.");
        captchaRef.current?.reset();
        setCaptchaToken(null);
      } else {
        setError(errorMessage);
        captchaRef.current?.reset();
        setCaptchaToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md animate-glow">
        <CardContent className="p-5 sm:p-8">
          {/* Logo and Title - Only show on mobile, inside card */}
          <div className="text-center mb-5 lg:hidden">
            <Link href="/" className="inline-block mb-3">
              <Image 
                src="/sunroad_logo.png" 
                alt="Sun Road" 
                width={100}
                height={53}
                className="h-12 w-auto mx-auto"
                priority
              />
            </Link>
            <h1 className="font-bold text-xl text-sunroad-brown-800 mb-1">Welcome back</h1>
            <p className="text-xs sm:text-sm text-sunroad-brown-600">Sign in to your account</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-medium text-sunroad-brown-700 font-body">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 px-4 border-gray-200 rounded-lg focus:ring-2 focus:ring-sunroad-amber-600 focus:border-transparent transition-all duration-200 hover:border-sunroad-amber-300 font-body"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-sm font-medium text-sunroad-brown-700 font-body">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm text-sunroad-amber-600 hover:text-sunroad-amber-700 underline-offset-4 hover:underline transition-colors font-body"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 px-4 pr-10 border-gray-200 rounded-lg focus:ring-2 focus:ring-sunroad-amber-600 focus:border-transparent transition-all duration-200 hover:border-sunroad-amber-300 font-body"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sunroad-brown-500 hover:text-sunroad-brown-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-600 focus-visible:ring-offset-2 rounded"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-600 font-body">{successMessage}</p>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600 font-body">{error}</p>
                </div>
              )}

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
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-sunroad-brown-600 font-body">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/sign-up"
                  className="text-sunroad-amber-600 hover:text-sunroad-amber-700 font-medium underline-offset-4 hover:underline transition-colors font-body"
                >
                  Create one here
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="text-center">
        <p className="text-xs text-sunroad-brown-500 font-body">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline font-body">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline font-body">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
