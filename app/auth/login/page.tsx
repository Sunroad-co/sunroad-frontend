import { LoginForm } from "@/components/login-form";
import AuthLayout from "@/components/auth-layout";

// Static generation for better performance
export const dynamic = 'force-static'

export default function Page() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      <LoginForm />
    </AuthLayout>
  );
}
