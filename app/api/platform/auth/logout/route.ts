import { NextResponse } from "next/server";
import { withApiAuth } from "@/features/auth/api";
import {
  deleteSession,
  sessionCookie,
  sessionToken,
} from "@/features/auth/session";

export const POST = withApiAuth(async function POST(request: Request) {
  deleteSession(sessionToken(request));
  const response = NextResponse.json({ data: { loggedOut: true } });
  response.cookies.set(sessionCookie, "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
});
