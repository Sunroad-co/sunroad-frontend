import { LoginForm } from "@/components/login-form";
import AuthLayout from "@/components/auth-layout";
import { Suspense } from "react";

function LoginFormFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-0 shadow-2xl bg-white/95 backdrop-blur-md animate-pulse rounded-lg p-5 sm:p-8">
        <div className="space-y-6">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
