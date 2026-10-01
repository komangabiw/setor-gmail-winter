import type { Metadata } from "next";
import { LeaderboardView } from "./leaderboard-view";

export const metadata: Metadata = {
  title: "Peringkat Setoran",
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
