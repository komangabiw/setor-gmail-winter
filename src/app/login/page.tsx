import type { Metadata } from "next";
import { LoginViewClient } from "./login-view-client";

export const metadata: Metadata = {
  title: "Masuk & Daftar | Setor Gmail by Winter",
};

export default function LoginPage() {
  return <LoginViewClient />;
}
