import type { Metadata } from "next";
import { LaporanView } from "./laporan-view";

export const metadata: Metadata = {
  title: "Laporan & Bantuan",
};

export default function LaporanPage() {
  return <LaporanView />;
}
