import { AuthForm } from "@/components/auth-form";
import { login } from "@/lib/auth/actions";

export const metadata = { title: "Sign in — TradeLog" };

export default function LoginPage() {
  return <AuthForm mode="login" action={login} />;
}
