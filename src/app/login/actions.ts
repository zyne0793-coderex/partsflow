"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authError, siteUrl } from "@/lib/auth";
export async function signIn(form: FormData) {
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const { error } = await (
    await createClient()
  ).auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${authError(error.code)}`);
  redirect("/parts");
}
export async function signUp(form: FormData) {
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (password.length < 8) redirect("/login?error=password");
  const { error } = await (
    await createClient()
  ).auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
  });
  if (error) redirect("/login?error=signup");
  redirect("/login?message=confirm");
}
export async function signOut() {
  await (await createClient()).auth.signOut();
  redirect("/login");
}
export async function resendConfirmation(form: FormData) {
  const email = String(form.get("email") || "").trim();
  const { error } = await (
    await createClient()
  ).auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
  });
  if (error)
    redirect(`/login?error=${error.status === 429 ? "rate" : "email"}`);
  redirect("/login?message=confirm");
}
export async function resetPassword(form: FormData) {
  const email = String(form.get("email") || "").trim();
  const { error } = await (
    await createClient()
  ).auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback`,
  });
  if (error)
    redirect(`/login?error=${error.status === 429 ? "rate" : "email"}`);
  redirect("/login?message=reset");
}
export async function updatePassword(form: FormData) {
  const password = String(form.get("password") || "");
  if (password.length < 8 || password !== form.get("confirm"))
    redirect("/auth/password?error=invalid");
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login?error=confirmation");
  const { error } = await client.auth.updateUser({ password });
  if (error) redirect("/auth/password?error=save");
  redirect("/parts?message=password");
}
