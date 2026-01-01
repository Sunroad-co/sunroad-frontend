import { LoginForm } from "@/components/login-form";
import AuthLayout from "@/components/auth-layout";
import { Suspense } from "react";

export default function Page() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      <Suspense fallback={<LoginForm />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
