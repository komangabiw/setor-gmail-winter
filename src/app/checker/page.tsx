import type { Metadata } from "next";
import { CheckerView } from "./checker-view";

export const metadata: Metadata = {
  title: "Checker Gmail",
};

export default function CheckerPage() {
  return <CheckerView />;
}
