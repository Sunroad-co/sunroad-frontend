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
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Logo Section - Only show on mobile */}
      <div className="text-center mb-8 lg:hidden">
        <Link href="/" className="inline-block">
          <Image 
            src="/sunroad_logo.png" 
            alt="Sun Road" 
            width={120}
            height={64}
            className="h-16 w-auto mx-auto mb-4"
            priority
          />
        </Link>
      </div>

      <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md animate-glow">
        <CardContent className="p-8">
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
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 px-4 border-gray-200 rounded-lg focus:ring-2 focus:ring-sunroad-amber-600 focus:border-transparent transition-all duration-200 hover:border-sunroad-amber-300 font-body"
                />
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-sunroad-amber-600 hover:bg-sunroad-amber-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl font-body" 
                disabled={isLoading}
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
