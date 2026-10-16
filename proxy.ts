import { NextResponse, type NextRequest } from "next/server";

// The internal panel holds lead data: one shared password, asked by the browser.
export function proxy(request: NextRequest) {
  const password = process.env.PANEL_PASSWORD;
  if (!password) return NextResponse.next();

  const [scheme, encoded] = (request.headers.get("authorization") ?? "").split(" ");
  const given = scheme === "Basic" && encoded ? atob(encoded).split(":").slice(1).join(":") : "";
  if (given === password) return NextResponse.next();

  return new NextResponse("Senha necessária", {
    status: 401,
    headers: { "www-authenticate": 'Basic realm="Painel Paggo"' },
  });
}

export const config = { matcher: ["/painel/:path*"] };
