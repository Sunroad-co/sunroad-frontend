import { ForgotPasswordForm } from "@/components/forgot-password-form";
import AuthLayout from "@/components/auth-layout";

// Static generation for better performance
export const dynamic = 'force-static'

export default function Page() {
  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive reset instructions">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
