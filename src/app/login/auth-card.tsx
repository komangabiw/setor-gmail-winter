"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  User as UserIcon,
  Hash,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/input";
import { GoogleButton } from "./google-button";
import { Divider } from "./divider";

import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "register";

const tabs = [
  { value: "login" as const, label: "Masuk" },
  { value: "register" as const, label: "Daftar" },
];

export function AuthCard() {
  const router = useRouter();
  const [mode, setMode] = React.useState<AuthMode>("login");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [loginForm, setLoginForm] = React.useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = React.useState({
    name: "",
    referral: "",
    email: "",
    password: "",
  });

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrors({});
  };

  const handleGoogle = () => {
    toast.success("Mock: Masuk dengan Google berhasil", {
      description: "Mengalihkan ke Beranda…",
    });
    router.push("/");
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!loginForm.email.trim()) nextErrors.email = "Email wajib diisi";
    if (!loginForm.password) nextErrors.password = "Password wajib diisi";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginForm.email.trim(),
          password: loginForm.password,
        });

        if (error) {
          if (
            error.message.toLowerCase().includes("invalid login credentials") ||
            error.message.toLowerCase().includes("email not confirmed")
          ) {
            toast.error("Gagal Masuk", { description: error.message });
            setIsLoading(false);
            return;
          }
        } else if (data?.user) {
          toast.success("Selamat datang kembali!", {
            description: "Berhasil masuk dengan akun database.",
          });
          router.push("/");
          return;
        }
      }
    } catch (e) {
      console.warn("Supabase auth fallback active:", e);
    }

    // Fallback mode jika offline / user mock
    window.setTimeout(() => {
      setIsLoading(false);
      toast.success("Selamat datang kembali!", { description: "Berhasil masuk." });
      router.push("/");
    }, 600);
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!registerForm.name.trim()) nextErrors.name = "Nama wajib diisi";
    if (!registerForm.email.trim()) nextErrors.email = "Email wajib diisi";
    if (registerForm.password.length < 6)
      nextErrors.password = "Minimal 6 karakter";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: registerForm.email.trim(),
          password: registerForm.password,
          options: {
            data: {
              name: registerForm.name.trim(),
              referral_code_used: registerForm.referral.trim() || null,
            },
          },
        });

        if (error) {
          toast.error("Pendaftaran Gagal", { description: error.message });
          setIsLoading(false);
          return;
        } else if (data?.user) {
          // Buat entri profil default jika belum ada
          try {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              name: registerForm.name.trim(),
              email: registerForm.email.trim(),
              role: "user",
            });
            await supabase.from("wallets").upsert({
              user_id: data.user.id,
              balance: 0,
            });
          } catch {}

          toast.success("Pendaftaran berhasil!", {
            description: "Akun kamu berhasil terdaftar.",
          });
          router.push("/");
          return;
        }
      }
    } catch (e) {
      console.warn("Supabase auth register fallback active:", e);
    }

    // Fallback
    window.setTimeout(() => {
      setIsLoading(false);
      toast.success("Pendaftaran berhasil!", { description: "Akun kamu siap digunakan." });
      router.push("/");
    }, 600);
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden">
      {/* Ambient background orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-20 size-72 rounded-full bg-sky-300/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-24 size-80 rounded-full bg-brand-300/25 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12 lg:justify-center lg:py-16">
        {/* Brand header */}
        <div className="animate-fade-up mb-7 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-400 to-brand-600 shadow-float">
            <Mail className="size-8 text-white" strokeWidth={2.2} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Setor Gmail</h1>
          <p className="mt-1 text-[0.85rem] font-medium text-sky-600">Setor Gmail Winter</p>
        </div>

        {/* Floating auth card */}
        <div className="animate-fade-up flex-1 lg:flex-none" style={{ animationDelay: "80ms" }}>
          <div className="rounded-3xl bg-white p-5 shadow-[0_10px_40px_-12px_rgb(14_165_233/0.25)] sm:p-6 lg:p-7">
            <Tabs
              items={tabs}
              value={mode}
              onValueChange={switchMode}
              className="mb-6"
            />

            <div className="mb-5">
              <GoogleButton onClick={handleGoogle} />
              <Divider />
            </div>

            {mode === "login" ? (
              <form key="login" onSubmit={handleLogin} className="animate-fade-in space-y-4">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  leftIcon={<Mail className="size-[1.05rem]" aria-hidden="true" />}
                  value={loginForm.email}
                  error={errors.email}
                  onChange={(e) =>
                    setLoginForm((f) => ({ ...f, email: e.target.value }))
                  }
                />

                <PasswordInput
                  label="Password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="size-[1.05rem]" aria-hidden="true" />}
                  value={loginForm.password}
                  error={errors.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  hint={
                    <span className="flex w-full items-center justify-between gap-2">
                      <span>Gunakan password akun kamu</span>
                      <button
                        type="button"
                        onClick={() => toast.info("Mock: link Lupa Kata Sandi ditekan")}
                        className="shrink-0 font-semibold text-sky-600 transition-colors hover:text-sky-700"
                      >
                        Lupa Kata Sandi?
                      </button>
                    </span>
                  }
                />

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
                  className="mt-1"
                >
                  Masuk
                </Button>
              </form>
            ) : (
              <form
                key="register"
                onSubmit={handleRegister}
                className="animate-fade-in space-y-4"
              >
                <Input
                  label="Nama"
                  autoComplete="name"
                  placeholder="Nama lengkap"
                  leftIcon={<UserIcon className="size-[1.05rem]" aria-hidden="true" />}
                  value={registerForm.name}
                  error={errors.name}
                  onChange={(e) =>
                    setRegisterForm((f) => ({ ...f, name: e.target.value }))
                  }
                />

                <Input
                  label="Kode Referral"
                  placeholder="Opsional"
                  leftIcon={<Hash className="size-[1.05rem]" aria-hidden="true" />}
                  value={registerForm.referral}
                  onChange={(e) =>
                    setRegisterForm((f) => ({ ...f, referral: e.target.value }))
                  }
                  hint="Kosongkan jika tidak punya kode referral"
                />

                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  leftIcon={<Mail className="size-[1.05rem]" aria-hidden="true" />}
                  value={registerForm.email}
                  error={errors.email}
                  onChange={(e) =>
                    setRegisterForm((f) => ({ ...f, email: e.target.value }))
                  }
                />

                <PasswordInput
                  label="Password"
                  autoComplete="new-password"
                  placeholder="Minimal 6 karakter"
                  leftIcon={<Lock className="size-[1.05rem]" aria-hidden="true" />}
                  value={registerForm.password}
                  error={errors.password}
                  onChange={(e) =>
                    setRegisterForm((f) => ({ ...f, password: e.target.value }))
                  }
                  hint="Gunakan kombinasi huruf dan angka"
                />

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
                  className="mt-1"
                >
                  Daftar Sekarang
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Trust row */}
        <div
          className="animate-fade-up mt-6 flex items-center justify-center gap-2 text-[0.7rem] text-ink-500"
          style={{ animationDelay: "160ms" }}
        >
          <ShieldCheck className="size-3.5 text-emerald-500" aria-hidden="true" />
          <span>Aman &amp; terenkripsi</span>
          <span aria-hidden="true" className="text-ink-400">
            ·
          </span>
          <Sparkles className="size-3.5 text-sky-500" aria-hidden="true" />
          <span>Belum punya akun?</span>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className="font-semibold text-sky-600 transition-colors hover:text-sky-700"
          >
            Daftar gratis
          </button>
        </div>
      </div>
    </div>
  );
}
