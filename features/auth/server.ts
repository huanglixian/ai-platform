import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession, sessionCookie } from "./session";
import { hasPermission, type Permission } from "./types";

export async function requirePageUser(permission?: Permission) {
  const user = readSession((await cookies()).get(sessionCookie)?.value);
  if (!user) redirect("/login");
  if (permission && !hasPermission(user, permission)) redirect("/");
  return user;
}
