import type { Metadata } from "next";
import { LandingView } from "@/app/landing-view";

export const metadata: Metadata = {
  title: "Masuk & Daftar | Setor Gmail by Winter",
};

export default function LoginPage() {
  return <LandingView defaultModalMode="login" />;
}
