import type { Metadata } from "next";
import { SetorView } from "./setor-view";

export const metadata: Metadata = {
  title: "Setor Gmail",
};

export default function SetorPage() {
  return <SetorView />;
}
