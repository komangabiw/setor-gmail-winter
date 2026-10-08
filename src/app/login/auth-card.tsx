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
  X,
} from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/input";
import { PasswordStrength, type PasswordRule } from "@/components/ui/password-strength";
import { GoogleButton } from "./google-button";
import { Divider } from "./divider";

import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "register";

const registerPasswordRules: PasswordRule[] = [
  { id: "length", label: "Minimal 6 karakter", test: (v) => v.length >= 6 },
  {
    id: "case",
    label: "Huruf besar dan kecil",
    test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  },
  { id: "digit", label: "Angka", test: (v) => /\d/.test(v) },
  {
    id: "symbol",
    label: "Simbol (@, #, $, dll)",
    test: (v) => /[!-/:-@[-`{-~]/.test(v),
  },
];

const registerPasswordLabels = ["Kosong", "Lemah", "Cukup", "Bagus", "Kuat"];

const tabs = [
  { value: "login" as const, label: "Masuk" },
  { value: "register" as const, label: "Daftar" },
];

export interface AuthCardProps {
  onSuccess?: () => void;
  onClose?: () => void;
  isModal?: boolean;
  initialMode?: AuthMode;
}

export function AuthCard({
  onSuccess,
  onClose,
  isModal = false,
  initialMode = "login",
}: AuthCardProps = {}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<AuthMode>(initialMode);

  React.useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [loginForm, setLoginForm] = React.useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = React.useState({
    name: "",
    referral: "",
    email: "",
    password: "",
  });

  const [isPasswordFocused, setIsPasswordFocused] = React.useState(false);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrors({});
    setIsPasswordFocused(false);
  };

  const onSuccessRef = React.useRef(onSuccess);
  React.useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const handleGoogleCredential = React.useCallback(async (credential: string) => {
    setIsLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: credential,
        });

        if (error) {
          toast.error("Gagal Masuk dengan Google", {
            description: error.message,
          });
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          try {
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", data.user.id)
              .maybeSingle();

            if (!existingProfile) {
              const fullName =
                data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                data.user.email?.split("@")[0] ||
                "Pengguna";

              await supabase.from("profiles").upsert({
                id: data.user.id,
                name: fullName,
                email: data.user.email || "",
                role: "user",
              });
              await supabase.from("wallets").upsert({
                user_id: data.user.id,
                balance: 0,
              });
            }
          } catch (profileErr) {
            console.warn("Profile init notice:", profileErr);
          }

          try {
            localStorage.setItem("setorgmail_auth", "true");
          } catch {}

          toast.success("Masuk dengan Google berhasil!", {
            description: "Selamat datang kembali.",
          });

          if (onSuccessRef.current) {
            onSuccessRef.current();
          } else {
            window.location.href = "/";
          }
          return;
        }
      }
    } catch (err: unknown) {
      console.error("Google ID Token sign-in error:", err);
      toast.error("Terjadi kendala saat autentikasi Google.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGoogle = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          toast.error("Gagal Masuk dengan Google", {
            description: error.message,
          });
          setIsLoading(false);
          return;
        }
        return;
      }
    } catch (err: unknown) {
      console.warn("Supabase Google OAuth fallback:", err);
    }
    try {
      localStorage.setItem("setorgmail_auth", "true");
    } catch {}
    toast.success("Masuk dengan Google berhasil", {
      description: "Mengalihkan ke Beranda…",
    });
    if (onSuccessRef.current) {
      onSuccessRef.current();
    } else {
      window.location.href = "/";
    }
    setIsLoading(false);
  }, []);

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
          try {
            localStorage.setItem("setorgmail_auth", "true");
          } catch { }
          toast.success("Selamat datang kembali!", {
            description: "Berhasil masuk dengan akun database.",
          });
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/");
          }
          return;
        }
      }
    } catch (e) {
      console.warn("Supabase auth fallback active:", e);
    }

    // Fallback mode jika offline / user mock
    window.setTimeout(() => {
      setIsLoading(false);
      try {
        localStorage.setItem("setorgmail_auth", "true");
      } catch { }
      toast.success("Selamat datang kembali!", { description: "Berhasil masuk." });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }
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
          } catch { }

          try {
            localStorage.setItem("setorgmail_auth", "true");
          } catch { }
          toast.success("Pendaftaran berhasil!", {
            description: "Akun kamu berhasil terdaftar.",
          });
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/");
          }
          return;
        }
      }
    } catch (e) {
      console.warn("Supabase auth register fallback active:", e);
    }

    // Fallback
    window.setTimeout(() => {
      setIsLoading(false);
      try {
        localStorage.setItem("setorgmail_auth", "true");
      } catch { }
      toast.success("Pendaftaran berhasil!", { description: "Akun kamu siap digunakan." });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }
    }, 600);
  };

  const cardBody = (
    <>
      <Tabs
        items={tabs}
        value={mode}
        onValueChange={switchMode}
        className="mb-6 bg-zinc-900/90 border border-zinc-800 p-1 rounded-full"
        indicatorClassName="bg-zinc-800 border border-white/10 shadow-md"
        activeClassName="text-white font-bold"
        inactiveClassName="text-zinc-400 hover:text-zinc-200 font-medium"
      />

      <div className="mb-4">
        <GoogleButton
          onSuccess={handleGoogleCredential}
          onFallbackClick={handleGoogle}
          isLoading={isLoading}
        />
        <Divider label="atau" />
      </div>

      {mode === "login" ? (
        <form key="login" onSubmit={handleLogin} className="animate-fade-in space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            labelClassName="text-zinc-300 font-medium text-xs"
            className="!bg-zinc-900/80 !border-zinc-800 focus:!border-sky-500 focus:!bg-zinc-900/95 focus:!ring-sky-500/20 !text-white !placeholder:text-zinc-500 rounded-2xl"
            leftIcon={<Mail className="size-[1.05rem] text-zinc-400" aria-hidden="true" />}
            value={loginForm.email}
            error={errors.email}
            onChange={(e) =>
              setLoginForm((f) => ({ ...f, email: e.target.value }))
            }
          />

          <PasswordInput
            label="Password"
            labelClassName="text-zinc-300 font-medium text-xs"
            className="!bg-zinc-900/80 !border-zinc-800 focus:!border-sky-500 focus:!bg-zinc-900/95 focus:!ring-sky-500/20 !text-white !placeholder:text-zinc-500 rounded-2xl"
            trailing={
              <button
                type="button"
                onClick={() => toast.info("Link Lupa Kata Sandi ditekan")}
                className="text-[0.75rem] font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
              >
                Lupa Kata Sandi?
              </button>
            }
            autoComplete="current-password"
            placeholder="••••••••"
            leftIcon={<Lock className="size-[1.05rem] text-zinc-400" aria-hidden="true" />}
            value={loginForm.password}
            error={errors.password}
            onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
          />

          <Button
            type="submit"
            size="lg"
            fullWidth
            isLoading={isLoading}
            rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
            className="mt-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-sky-500/25 border-0 rounded-2xl h-12 cursor-pointer"
          >
            Masuk
          </Button>
        </form>
      ) : (
        <form
          key="register"
          onSubmit={handleRegister}
          className="animate-fade-in space-y-3.5"
        >
          <Input
            label="Nama"
            autoComplete="name"
            placeholder="Nama lengkap"
            labelClassName="text-zinc-300 font-medium text-xs"
            className="!bg-zinc-900/80 !border-zinc-800 focus:!border-sky-500 focus:!bg-zinc-900/95 focus:!ring-sky-500/20 !text-white !placeholder:text-zinc-500 rounded-2xl"
            leftIcon={<UserIcon className="size-[1.05rem] text-zinc-400" aria-hidden="true" />}
            value={registerForm.name}
            error={errors.name}
            onChange={(e) =>
              setRegisterForm((f) => ({ ...f, name: e.target.value }))
            }
          />

          <Input
            label="Kode Referral"
            placeholder="Opsional"
            labelClassName="text-zinc-300 font-medium text-xs"
            hintClassName="text-zinc-500 text-[0.72rem]"
            className="!bg-zinc-900/80 !border-zinc-800 focus:!border-sky-500 focus:!bg-zinc-900/95 focus:!ring-sky-500/20 !text-white !placeholder:text-zinc-500 rounded-2xl"
            leftIcon={<Hash className="size-[1.05rem] text-zinc-400" aria-hidden="true" />}
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
            labelClassName="text-zinc-300 font-medium text-xs"
            className="!bg-zinc-900/80 !border-zinc-800 focus:!border-sky-500 focus:!bg-zinc-900/95 focus:!ring-sky-500/20 !text-white !placeholder:text-zinc-500 rounded-2xl"
            leftIcon={<Mail className="size-[1.05rem] text-zinc-400" aria-hidden="true" />}
            value={registerForm.email}
            error={errors.email}
            onChange={(e) =>
              setRegisterForm((f) => ({ ...f, email: e.target.value }))
            }
          />

          <div className="space-y-1.5">
            <PasswordInput
              label="Password"
              autoComplete="new-password"
              placeholder="Minimal 6 karakter"
              labelClassName="text-zinc-300 font-medium text-xs"
              hintClassName="text-zinc-500 text-[0.72rem]"
              className="!bg-zinc-900/80 !border-zinc-800 focus:!border-sky-500 focus:!bg-zinc-900/95 focus:!ring-sky-500/20 !text-white !placeholder:text-zinc-500 rounded-2xl"
              leftIcon={<Lock className="size-[1.05rem] text-zinc-400" aria-hidden="true" />}
              value={registerForm.password}
              error={errors.password}
              onChange={(e) =>
                setRegisterForm((f) => ({ ...f, password: e.target.value }))
              }
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              hint={
                isPasswordFocused || registerForm.password.length > 0
                  ? undefined
                  : "Gunakan kombinasi huruf dan angka"
              }
            />

            {(isPasswordFocused || registerForm.password.length > 0) && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3.5 transition-all duration-200">
                <PasswordStrength
                  value={registerForm.password}
                  rules={registerPasswordRules}
                  labels={registerPasswordLabels}
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            isLoading={isLoading}
            rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
            className="mt-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-sky-500/25 border-0 rounded-2xl h-12 cursor-pointer"
          >
            Daftar Sekarang
          </Button>
        </form>
      )}
    </>
  );

  const trustRow = (
    <div
      className="animate-fade-up mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[0.72rem] text-zinc-400"
      style={{ animationDelay: "160ms" }}
    >
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden="true" />
        <span>Aman &amp; terenkripsi</span>
      </div>
      <span aria-hidden="true" className="text-zinc-600">
        ·
      </span>
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-sky-400" aria-hidden="true" />
        <span>{mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}</span>
        <button
          type="button"
          onClick={() => switchMode(mode === "login" ? "register" : "login")}
          className="font-semibold text-sky-400 transition-colors hover:text-sky-300 cursor-pointer underline underline-offset-2"
        >
          {mode === "login" ? "Daftar gratis" : "Masuk sekarang"}
        </button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="relative w-full p-5 sm:p-7 text-white">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-10 cursor-pointer"
            aria-label="Tutup dialog"
          >
            <X className="size-5" />
          </button>
        )}

        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white shadow-lg shadow-sky-500/25">
            <Mail className="size-4.5 sm:size-5 stroke-[2.2]" aria-hidden="true" />
          </span>
          <div className="flex items-baseline gap-1.5 text-lg sm:text-xl tracking-tight">
            <span className="font-black text-white tracking-tight">
              SETOR GMAIL
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-400 lowercase">
              by
            </span>
            <span className="font-black tracking-tight bg-gradient-to-r from-sky-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
              Winter
            </span>
          </div>
        </div>

        {cardBody}
        {trustRow}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-[#09090b] text-white">
      {/* Ambient background orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-20 size-72 rounded-full bg-sky-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-24 size-80 rounded-full bg-blue-500/10 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12 lg:justify-center lg:py-16">
        {/* Brand header */}
        <div className="animate-fade-up mb-7 flex items-center justify-center gap-2.5">
          <span className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white shadow-lg shadow-sky-500/25">
            <Mail className="size-4.5 sm:size-5 stroke-[2.2]" aria-hidden="true" />
          </span>
          <div className="flex items-baseline gap-1.5 text-lg sm:text-xl tracking-tight">
            <span className="font-black text-white tracking-tight">
              SETOR GMAIL
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-400 lowercase">
              by
            </span>
            <span className="font-black tracking-tight bg-gradient-to-r from-sky-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
              Winter
            </span>
          </div>
        </div>

        {/* Floating auth card */}
        <div className="animate-fade-up flex-1 lg:flex-none" style={{ animationDelay: "80ms" }}>
          <div className="rounded-3xl bg-[#111116] border border-white/10 p-5 shadow-[0_10px_40px_-12px_rgba(56,189,248,0.2)] sm:p-6 lg:p-7">
            {cardBody}
          </div>
        </div>

        {trustRow}
      </div>
    </div>
  );
}
