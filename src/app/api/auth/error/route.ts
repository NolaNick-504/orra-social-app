import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Redirect auth errors back to the home page
  // Use the request URL as fallback so it works behind reverse proxies (e.g. Caddy on port 81)
  const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  return NextResponse.redirect(new URL("/", baseUrl));
}
