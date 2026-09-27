import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signIn, signUp, resendConfirmation, resetPassword } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const errors: Record<string, string> = {
  credentials:
    "Email or password is incorrect. Use your PartsFlow password, or request a password reset below.",
  unconfirmed:
    "Your email is not confirmed yet. Use Resend confirmation below, then open the newest email link.",
  rate: "Too many email requests. Please wait before trying again.",
  email:
    "The email could not be sent. Please check the address and try again later.",
  password: "Use a password with at least 8 characters.",
  signup: "We could not create the account. Check the email and try again.",
  confirmation:
    "The confirmation link has expired. Please sign in or try again.",
};
export default async function Login(props: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const searchParams = await props.searchParams;
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (user) redirect("/parts");
  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[10px] bg-[#4f46e5] text-white font-bold">
            P
          </span>
          <span className="text-xl font-semibold tracking-tight">
            PartsFlow
          </span>
        </div>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Welcome to your parts catalog</CardTitle>
            <CardDescription>
              Sign in to manage your spare parts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {searchParams.error && errors[searchParams.error] && (
              <p
                role="alert"
                className="rounded-md bg-red-50 p-3 text-sm text-red-700"
              >
                {errors[searchParams.error]}
              </p>
            )}
            {searchParams.message === "confirm" && (
              <p
                role="status"
                className="rounded-md bg-indigo-50 p-3 text-sm text-indigo-800"
              >
                Check your email to confirm your account, then sign in.
              </p>
            )}
            {searchParams.message === "reset" && (
              <p
                role="status"
                className="rounded-md bg-indigo-50 p-3 text-sm text-indigo-800"
              >
                If an account exists, a password reset email will arrive
                shortly. Open it in this browser, then choose a new password.
              </p>
            )}
            <form action={signIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  minLength={8}
                  required
                />
              </div>
              <Button className="w-full">Sign in</Button>
              <Button formAction={signUp} variant="outline" className="w-full">
                Create account
              </Button>
            </form>
            <p className="text-xs text-slate-500">
              New here? Enter an email and a new PartsFlow password, then select
              Create account. Your GitHub password is separate.
            </p>
            <details className="border-t pt-4 text-sm">
              <summary className="cursor-pointer font-medium">
                Need help signing in?
              </summary>
              <form className="mt-4 space-y-3" action={resetPassword}>
                <Label htmlFor="help-email">Account email</Label>
                <Input
                  id="help-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
                <Button variant="outline" className="w-full">
                  Send password reset
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  formAction={resendConfirmation}
                >
                  Resend confirmation
                </Button>
              </form>
            </details>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
