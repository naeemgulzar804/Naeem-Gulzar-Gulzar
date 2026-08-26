import { AuthForm } from "@/components/auth-form";
import { signup } from "@/lib/auth/actions";

export const metadata = { title: "Sign up — TradeLog" };

export default function SignupPage() {
  return <AuthForm mode="signup" action={signup} />;
}
