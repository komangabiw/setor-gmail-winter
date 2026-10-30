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

export const timeRanges = [
  { value: "today", label: "Hari ini" },
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
  { value: "all", label: "Semua" },
] as const;

export type TimeRange = (typeof timeRanges)[number]["value"];

export const summaryStats = {
  diterima: 0,
  pending: 0,
  ditolak: 0,
  harga: 4500,
};
