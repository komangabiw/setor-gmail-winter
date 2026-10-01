import type { Metadata } from "next";
import { RiwayatView } from "./riwayat-view";

export const metadata: Metadata = {
  title: "Riwayat Setoran",
};

export default function RiwayatPage() {
  return <RiwayatView />;
}
