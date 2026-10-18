import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession, sessionCookie } from "@/features/auth/session";
import { LoginForm } from "@/features/auth/login-form";

export default async function LoginPage() {
  if (readSession((await cookies()).get(sessionCookie)?.value)) redirect("/");
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[var(--skin-surface-soft)] px-5 py-12">
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[var(--skin-surface-accent)] blur-3xl"
      />
      <div className="relative w-full max-w-[420px]">
        <p className="mb-7 text-center text-xs font-medium tracking-[0.2em] text-[var(--skin-primary)]">
          AI PLATFORM
        </p>
        <section className="rounded-3xl border border-[var(--skin-border)] bg-white/95 p-8 shadow-[0_20px_70px_rgba(var(--skin-shadow-rgb),0.08)]">
          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight text-title">
              登录工作台
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              使用管理员分配的账号访问应用与工作空间
            </p>
          </div>
          <LoginForm />
        </section>
        <p className="mt-6 text-center text-xs text-[var(--skin-text-subtle)]">
          账号由管理员创建与分配
        </p>
      </div>
    </main>
  );
}
