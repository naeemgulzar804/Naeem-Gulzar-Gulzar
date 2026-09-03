import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/* Prefix-matched: everything below these is public. */
const PUBLIC_PREFIXES = ["/login", "/signup", "/auth/callback"];

/* Exact-matched. "/" cannot be a prefix — it would make every route public. */
const PUBLIC_EXACT = ["/"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // IMPORTANT: avoid writing logic between createServerClient and getUser().
  // A simple mistake could make it very hard to debug session refresh issues.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((path) => pathname.startsWith(path));

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/dashboard";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  // IMPORTANT: return supabaseResponse as-is so cookies stay in sync.
  return supabaseResponse;
}
