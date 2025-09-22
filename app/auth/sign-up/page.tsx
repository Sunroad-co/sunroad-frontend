import { SignUpForm } from "@/components/sign-up-form";
import AuthLayout from "@/components/auth-layout";

// Static generation for better performance
export const dynamic = 'force-static'

export default function Page() {
  return (
    <AuthLayout title="Join Sun Road" subtitle="Create your account and connect with local creatives">
      <SignUpForm />
    </AuthLayout>
  );
}
