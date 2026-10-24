import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, isAuthConfigured, verifyToken } from "@/lib/session";

/**
 * La liste se lit sans compte : c'est tout l'intérêt de la partager. Tout le
 * reste (la gestion de la liste) est fermé ici, en amont du rendu, pour qu'une
 * route ajoutée plus tard soit privée par défaut plutôt que publique par oubli.
 */
const PUBLIC_PATHS = ["/", "/login"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
