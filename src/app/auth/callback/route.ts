import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const { error } = await (
      await createClient()
    ).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/auth/continue`);
  }
  return NextResponse.redirect(`${origin}/login?error=confirmation`);
}
