import { redirect } from "next/navigation";

// Redirect to new signup flow
export default function Page() {
  redirect("/signup");
}
