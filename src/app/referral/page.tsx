import type { Metadata } from "next";
import { ReferralView } from "./referral-view";

export const metadata: Metadata = {
  title: "Program Referral",
};

export default function ReferralPage() {
  return <ReferralView />;
}
