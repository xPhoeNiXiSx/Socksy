import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, isAuthConfigured, verifyToken } from "@/lib/session";

/**
 * Seule la gestion de la liste (`/ma-liste`) demande le mot de passe. La
 * liste elle-même, sur l'accueil, est ouverte : un invité doit pouvoir
 * réserver un cadeau sans rien créer.
 */
const PRIVATE_PREFIXES = ["/ma-liste"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Sans mot de passe configuré, personne ne pourrait se connecter : la page
  // affiche alors ce qui manque plutôt que de boucler sur la connexion.
  if (!isAuthConfigured()) {
    return NextResponse.next();
  }

  if (await verifyToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)"],
};
