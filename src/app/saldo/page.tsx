import type { Metadata } from "next";
import { SaldoView } from "./saldo-view";

export const metadata: Metadata = {
  title: "Saldo & Penarikan",
};

export default function SaldoPage() {
  return <SaldoView />;
}
