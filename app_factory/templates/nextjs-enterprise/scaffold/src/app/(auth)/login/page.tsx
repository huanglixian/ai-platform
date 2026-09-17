import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background p-4">
      <section className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-primary">{{APP_NAME_JS}}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">登录</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">使用由应用管理员创建的内部账号继续。</p>
        <LoginForm />
      </section>
    </main>
  );
}
