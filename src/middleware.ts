import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(items) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (request.nextUrl.pathname.startsWith("/parts") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const redirected = NextResponse.redirect(url);
    response.cookies
      .getAll()
      .forEach((cookie) => redirected.cookies.set(cookie));
    redirected.headers.set("Cache-Control", "private, no-store");
    return redirected;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/parts/:path*", "/login", "/auth/:path*"] };
