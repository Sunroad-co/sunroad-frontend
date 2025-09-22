import { UpdatePasswordForm } from "@/components/update-password-form";
import AuthLayout from "@/components/auth-layout";

// Static generation for better performance
export const dynamic = 'force-static'

export default function Page() {
  return (
    <AuthLayout title="Update Password" subtitle="Enter your new password">
      <UpdatePasswordForm />
    </AuthLayout>
  );
}
