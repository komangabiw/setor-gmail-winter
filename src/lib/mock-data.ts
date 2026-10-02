export type UserProfile = {
  name: string;
  email: string;
  uid: string;
  role: "User" | "Admin" | "Reseller";
  avatarUrl?: string;
  whatsappChannelUrl?: string;
  danaNumber?: string;
  joinedAt?: string;
  passwordChangedAt?: string;
};

export const mockUser: UserProfile = {
  name: "Pengguna",
  email: "-",
  uid: "-",
  role: "User",
  danaNumber: "-",
  joinedAt: "-",
  passwordChangedAt: "Belum pernah",
  whatsappChannelUrl: "https://whatsapp.com/channel/0029VbEImqX7j6gFzKU9Qy1Y",
};

export type SetorCategory = {
  id: "good" | "captcha" | "bebas";
  label: string;
  price: number;
  description: string;
  badge?: string;
  disabled?: boolean;
};

export const setorCategories: SetorCategory[] = [
  {
    id: "good",
    label: "Setor Gmail Good",
    price: 4500,
    description: "Untuk Gmail dengan status Good",
    badge: "Rekomendasi",
  },
  {
    id: "bebas",
    label: "Setor Gmail Bebas",
    price: 2500,
    description: "Format bebas, fleksibel untuk semua kebutuhan",
    disabled: false,
  },
];

export const defaultPassword = "winter1212";

export const rulesBannerText = "Cek Rules dulu sebelum setor";

export const statusConfig = {
  diterima: { label: "DITERIMA", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "PENDING", className: "bg-amber-50 text-amber-700 border-amber-200" },
  dicek: { label: "DI CEK", className: "bg-sky-50 text-sky-700 border-sky-200" },
  ditolak: { label: "DITOLAK", className: "bg-rose-50 text-rose-700 border-rose-200" },
  semua: { label: "SEMUA", className: "" },
} as const;

export type DepositStatus = keyof typeof statusConfig;

export type DepositRecord = {
  id: string;
  gmail: string;
  status: Exclude<DepositStatus, "semua">;
  amount: number;
  category: SetorCategory["id"];
  createdAt: string;
  updatedAt?: string;
  note?: string;
};

export const mockDeposits: DepositRecord[] = [];

export type WithdrawalStatus = "diproses" | "berhasil" | "ditolak";

export type WithdrawalRecord = {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  method: "DANA" | "OVO" | "GOPAY" | "SHOPEEPAY" | string;
  accountNumber: string;
  createdAt: string;
  updatedAt?: string;
};

export type TransactionRecord = {
  id: string;
  type: "deposit" | "withdrawal" | "bonus";
  amount: number;
  title: string;
  description: string;
  createdAt: string;
  status: "success" | "pending" | "failed";
};

export const mockWallet = {
  balance: 0,
  minimumWithdrawal: 5000,
  danaNumber: "",
};

export const mockWithdrawals: WithdrawalRecord[] = [];

export const mockTransactions: TransactionRecord[] = [];

export type QuickMenuIconName =
  | "send"
  | "scale"
  | "shield-check"
  | "trophy"
  | "gift"
  | "file-text";

/** Either a link to a route, or an in-page action such as opening the rules. */
export type QuickMenuItem = {
  key: string;
  label: string;
  iconName: QuickMenuIconName;
} & ({ href: string; action?: undefined } | { action: "rules"; href?: undefined });

export const quickMenuItems: QuickMenuItem[] = [
  { key: "setor", label: "Setor", href: "/setor", iconName: "send" },
  { key: "rules", label: "Rules", action: "rules", iconName: "scale" },
  { key: "checker", label: "Checker", href: "/checker", iconName: "shield-check" },
  { key: "leaderboard", label: "Leaderboard", href: "/leaderboard", iconName: "trophy" },
  { key: "referral", label: "Referral", href: "/profil#referral", iconName: "gift" },
  { key: "laporan", label: "Laporan", href: "/laporan", iconName: "file-text" },
];

/* ------------------------------------------------------------------ */
/* Support reports (/laporan)                                          */
/* ------------------------------------------------------------------ */

/** First entry is the default selection in the "Buat Laporan" modal. */
export const reportCategories = [
  "Setoran Gmail",
  "Penarikan Saldo",
  "Bug / Error",
  "Saran & Masukan",
  "Lainnya",
] as const;

export type ReportCategory = (typeof reportCategories)[number];

export type ReportStatus = "baru" | "diproses" | "selesai";

export type ReportReply = {
  id: string;
  from: "user" | "admin";
  body: string;
  createdAt: string;
};

export type ReportTicket = {
  id: string;
  code: string;
  subject: string;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  createdAt: string;
  attachmentName?: string;
  replies: ReportReply[];
};

/** Empty by design so the "Belum ada laporan" empty state shows on first load. */
export const mockReports: ReportTicket[] = [];

/* ------------------------------------------------------------------ */
/* Referral (/referral)                                                */
/* ------------------------------------------------------------------ */

export const referralMission = {
  headline: "MISI REFERRAL",
  title: "Undang 10 teman & dapatkan Rp10.000",
  target: 10,
  reward: 10000,
  invited: 0,
  successful: 0,
  bonusReceived: 0,
  code: "7E5ZH18F",
  link: "https://setorgmail.co.id/undangan/7E5ZH18F",
  requirement: "Syarat: Teman melakukan setor Gmail pertama yang diterima.",
};

export type ReferralRecord = {
  id: string;
  name: string;
  email: string;
  status: "menunggu" | "berhasil";
  reward: number;
  joinedAt: string;
};

/** Empty until the user actually invites someone. */
export const mockReferralHistory: ReferralRecord[] = [];

export type BonusRecord = {
  id: string;
  label: string;
  amount: number;
  createdAt: string;
};

/** Empty until a mission is completed. */
export const mockBonusHistory: BonusRecord[] = [];

/* ------------------------------------------------------------------ */
/* Leaderboard (/leaderboard)                                          */
/* ------------------------------------------------------------------ */

export const leaderboardRanges = [
  { value: "today", label: "Hari Ini" },
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
  { value: "all", label: "Sepanjang Masa" },
] as const;

export type LeaderboardRange = (typeof leaderboardRanges)[number]["value"];

export type LeaderboardEntry = {
  rank: number;
  name: string;
  avatarUrl: string;
  gmailAccepted: number;
  revenue: number;
};

const LEADERBOARD_BASE = [
  { name: "Ayu Kartika Sari", img: 47, gmailAccepted: 412 },
  { name: "Bagus Prasetyo", img: 12, gmailAccepted: 356 },
  { name: "Citra Dewi Lestari", img: 32, gmailAccepted: 298 },
  { name: "Dimas Anggara", img: 15, gmailAccepted: 241 },
  { name: "Eka Wulandari", img: 44, gmailAccepted: 205 },
  { name: "Fajar Nugroho", img: 8, gmailAccepted: 178 },
  { name: "Gita Maharani", img: 26, gmailAccepted: 152 },
  { name: "Hendra Gunawan", img: 60, gmailAccepted: 131 },
  { name: "Indah Permata", img: 38, gmailAccepted: 114 },
  { name: "Joko Susilo", img: 52, gmailAccepted: 97 },
];

/** Shorter windows settle a fraction of the all-time volume. */
const RANGE_SCALE: Record<LeaderboardRange, number> = {
  today: 0.12,
  "7d": 0.38,
  "30d": 0.72,
  all: 1,
};

/** Revenue always mirrors the Good category price so totals stay believable. */
export function getLeaderboard(range: LeaderboardRange): LeaderboardEntry[] {
  const scale = RANGE_SCALE[range];
  return LEADERBOARD_BASE.map((user, index) => {
    const wobble = 0.85 + (((index * 7 + range.length * 3) % 5) / 10);
    const gmailAccepted = Math.max(1, Math.round(user.gmailAccepted * scale * wobble));
    return {
      rank: index + 1,
      name: user.name,
      avatarUrl: `https://i.pravatar.cc/160?img=${user.img}`,
      gmailAccepted,
      revenue: gmailAccepted * 4500,
    };
  });
}


export const timeRanges = [
  { value: "today", label: "Hari ini" },
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
] as const;

export type TimeRange = (typeof timeRanges)[number]["value"];

export const summaryStats = {
  diterima: 0,
  pending: 0,
  ditolak: 0,
  harga: 4500,
};
