import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SELECTED_MONTH_COOKIE,
  SELECTED_YEAR_COOKIE,
  readMonthCookies,
} from "@/lib/selected-month";

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const emailConfirmed = Boolean(user?.email_confirmed_at);

  if (user && !emailConfirmed && isDashboardRoute) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "unconfirmed");
    return NextResponse.redirect(url);
  }

  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && emailConfirmed && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Mes global: si falta en la URL, rellenar desde cookie (o mes actual).
  if (user && emailConfirmed && isDashboardRoute) {
    const hasMonth = request.nextUrl.searchParams.has("month");
    const hasYear = request.nextUrl.searchParams.has("year");
    if (!hasMonth || !hasYear) {
      const fromCookie = readMonthCookies((name) =>
        request.cookies.get(name)?.value
      );
      const url = request.nextUrl.clone();
      if (!hasMonth) url.searchParams.set("month", String(fromCookie.month));
      if (!hasYear) url.searchParams.set("year", String(fromCookie.year));
      const redirect = NextResponse.redirect(url);
      redirect.cookies.set(SELECTED_MONTH_COOKIE, String(fromCookie.month), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      redirect.cookies.set(SELECTED_YEAR_COOKIE, String(fromCookie.year), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return redirect;
    }
  }

  return supabaseResponse;
}
