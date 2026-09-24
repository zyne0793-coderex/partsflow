"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function signIn(form: FormData) {
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const { error } = await createClient().auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=credentials");
  redirect("/parts");
}
export async function signUp(form: FormData) {
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (password.length < 8) redirect("/login?error=password");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const { error } = await createClient().auth.signUp({ email, password, options: { emailRedirectTo: `${siteUrl}/auth/callback` } });
  if (error) redirect("/login?error=signup");
  redirect("/login?message=confirm");
}
export async function signOut() { await createClient().auth.signOut(); redirect("/login"); }
