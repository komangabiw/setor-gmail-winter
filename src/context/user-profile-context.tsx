"use client";

import * as React from "react";
import {
  type UserProfile,
  type DepositRecord,
  type WithdrawalRecord,
  type TransactionRecord,
  type ReportTicket,
} from "@/lib/mock-data";
import { type EWalletMethod } from "@/components/ui/ewallet-logos";
import { getStoredEWalletData } from "@/lib/generated-storage";
import {
  getCurrentAuthUser,
  fetchUserProfile,
  updateUserProfile,
  fetchUserDeposits,
  fetchUserWallet,
  fetchSavedEWallets,
  fetchUserWithdrawals,
  fetchUserTransactions,
  fetchUserTickets,
} from "@/lib/supabase";

export interface UserStats {
  total: number;
  diterima: number;
  pending: number;
  ditolak: number;
}

export interface UserWalletData {
  balance: number;
  minimumWithdrawal: number;
  danaNumber: string;
}

const defaultProfile: UserProfile = {
  name: "Pengguna",
  email: "-",
  uid: "-",
  role: "User",
  danaNumber: "-",
  joinedAt: "-",
  passwordChangedAt: "Belum pernah",
};

const defaultStats: UserStats = {
  total: 0,
  diterima: 0,
  pending: 0,
  ditolak: 0,
};

const defaultWallet: UserWalletData = {
  balance: 0,
  minimumWithdrawal: 5000,
  danaNumber: "",
};

const defaultEWallets: Record<EWalletMethod, string> = {
  DANA: "",
  SHOPEEPAY: "",
  GOPAY: "",
  OVO: "",
};

export interface GlobalDataContextValue {
  // Profil & Stats
  userProfile: UserProfile;
  stats: UserStats;
  avatarImage: string | null;
  userId: string | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isStatsLoading: boolean;

  // Saldo & E-Wallet
  wallet: UserWalletData;
  persistedAccounts: Record<EWalletMethod, string>;
  isWalletLoading: boolean;
  isEWalletLoading: boolean;

  // Riwayat Setoran
  deposits: DepositRecord[];
  isDepositsLoading: boolean;

  // Mutasi & Penarikan
  withdrawals: WithdrawalRecord[];
  transactions: TransactionRecord[];
  isHistoryLoading: boolean;

  // Laporan / Tiket
  tickets: ReportTicket[];
  isTicketsLoading: boolean;

  // Mutation & Refresh Methods (Stale-While-Revalidate)
  refreshAll: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshDeposits: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  refreshEWallets: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshTickets: () => Promise<void>;
  saveEWalletAccountLocally: (method: EWalletMethod, number: string) => void;
  addTicketLocally: (ticket: ReportTicket) => void;
  updateAvatar: (dataUrl: string) => Promise<void>;
  deleteAvatar: () => Promise<void>;
}

const GlobalDataContext = React.createContext<GlobalDataContextValue | undefined>(undefined);

// LocalStorage Cache Keys for Stale-While-Revalidate Hydration
const CACHE_PROFILE_KEY = "setorgmail_cached_profile_v1";
const CACHE_STATS_KEY = "setorgmail_cached_stats_v1";
const CACHE_AVATAR_KEY = "user_profile_avatar";
const CACHE_WALLET_KEY = "setorgmail_cached_wallet_v1";
const CACHE_EWALLETS_KEY = "setorgmail_cached_ewallets_v1";
const CACHE_DEPOSITS_KEY = "setorgmail_cached_deposits_v1";
const CACHE_WITHDRAWALS_KEY = "setorgmail_cached_withdrawals_v1";
const CACHE_TRANSACTIONS_KEY = "setorgmail_cached_transactions_v1";
const CACHE_TICKETS_KEY = "setorgmail_cached_tickets_v1";

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  // State
  const [userProfile, setUserProfile] = React.useState<UserProfile>(defaultProfile);
  const [stats, setStats] = React.useState<UserStats>(defaultStats);
  const [avatarImage, setAvatarImage] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  const [wallet, setWallet] = React.useState<UserWalletData>(defaultWallet);
  const [persistedAccounts, setPersistedAccounts] = React.useState<Record<EWalletMethod, string>>(defaultEWallets);

  const [deposits, setDeposits] = React.useState<DepositRecord[]>([]);
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalRecord[]>([]);
  const [transactions, setTransactions] = React.useState<TransactionRecord[]>([]);
  const [tickets, setTickets] = React.useState<ReportTicket[]>([]);

  // Granular Loading flags (true only before cache hydration or first network fetch)
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isProfileLoading, setIsProfileLoading] = React.useState<boolean>(true);
  const [isStatsLoading, setIsStatsLoading] = React.useState<boolean>(true);
  const [isWalletLoading, setIsWalletLoading] = React.useState<boolean>(true);
  const [isEWalletLoading, setIsEWalletLoading] = React.useState<boolean>(true);
  const [isDepositsLoading, setIsDepositsLoading] = React.useState<boolean>(true);
  const [isHistoryLoading, setIsHistoryLoading] = React.useState<boolean>(true);
  const [isTicketsLoading, setIsTicketsLoading] = React.useState<boolean>(true);

  const isFetchedRef = React.useRef(false);

  // 1. Instant hydration from localStorage on mount (Stale-While-Revalidate)
  React.useEffect(() => {
    try {
      const cachedAvatar = localStorage.getItem(CACHE_AVATAR_KEY);
      if (cachedAvatar) {
        setAvatarImage(cachedAvatar);
      }

      const cachedProfileRaw = localStorage.getItem(CACHE_PROFILE_KEY);
      if (cachedProfileRaw) {
        const parsed = JSON.parse(cachedProfileRaw);
        if (parsed && typeof parsed === "object" && parsed.uid && parsed.uid !== "-") {
          setUserProfile(parsed);
          setIsProfileLoading(false);
          setIsLoading(false);
        }
      }

      const cachedStatsRaw = localStorage.getItem(CACHE_STATS_KEY);
      if (cachedStatsRaw) {
        const parsedStats = JSON.parse(cachedStatsRaw);
        if (parsedStats && typeof parsedStats === "object") {
          setStats(parsedStats);
          setIsStatsLoading(false);
        }
      }

      const cachedWalletRaw = localStorage.getItem(CACHE_WALLET_KEY);
      if (cachedWalletRaw) {
        const parsedWallet = JSON.parse(cachedWalletRaw);
        if (parsedWallet && typeof parsedWallet.balance === "number") {
          setWallet(parsedWallet);
          setIsWalletLoading(false);
        }
      }

      const cachedEWalletsRaw = localStorage.getItem(CACHE_EWALLETS_KEY);
      if (cachedEWalletsRaw) {
        const parsedEWallets = JSON.parse(cachedEWalletsRaw);
        if (parsedEWallets && typeof parsedEWallets === "object") {
          setPersistedAccounts(parsedEWallets);
          setIsEWalletLoading(false);
        }
      } else {
        const stored = getStoredEWalletData();
        if (stored?.accounts) {
          const cleanAccounts: Record<EWalletMethod, string> = { ...defaultEWallets };
          for (const [k, v] of Object.entries(stored.accounts)) {
            const str = typeof v === "string" ? v.trim() : "";
            if (str && str !== "081234567890" && str !== "08123456789") {
              cleanAccounts[k as EWalletMethod] = str;
            }
          }
          setPersistedAccounts(cleanAccounts);
          setIsEWalletLoading(false);
        }
      }

      const cachedDepositsRaw = localStorage.getItem(CACHE_DEPOSITS_KEY);
      if (cachedDepositsRaw) {
        const parsedDeposits = JSON.parse(cachedDepositsRaw);
        if (Array.isArray(parsedDeposits)) {
          setDeposits(parsedDeposits);
          setIsDepositsLoading(false);
        }
      }

      const cachedWithdrawalsRaw = localStorage.getItem(CACHE_WITHDRAWALS_KEY);
      if (cachedWithdrawalsRaw) {
        const parsedWithdrawals = JSON.parse(cachedWithdrawalsRaw);
        if (Array.isArray(parsedWithdrawals)) {
          setWithdrawals(parsedWithdrawals);
          setIsHistoryLoading(false);
        }
      }

      const cachedTransactionsRaw = localStorage.getItem(CACHE_TRANSACTIONS_KEY);
      if (cachedTransactionsRaw) {
        const parsedTransactions = JSON.parse(cachedTransactionsRaw);
        if (Array.isArray(parsedTransactions)) {
          setTransactions(parsedTransactions);
          setIsHistoryLoading(false);
        }
      }

      const cachedTicketsRaw = localStorage.getItem(CACHE_TICKETS_KEY);
      if (cachedTicketsRaw) {
        const parsedTickets = JSON.parse(cachedTicketsRaw);
        if (Array.isArray(parsedTickets)) {
          setTickets(parsedTickets);
          setIsTicketsLoading(false);
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }, []);

  // 2. Refresh All (Full Stale-While-Revalidate network revalidation)
  const refreshAll = React.useCallback(async () => {
    try {
      const user = await getCurrentAuthUser();
      if (!user) {
        setIsLoading(false);
        setIsProfileLoading(false);
        setIsStatsLoading(false);
        setIsWalletLoading(false);
        setIsEWalletLoading(false);
        setIsDepositsLoading(false);
        setIsHistoryLoading(false);
        setIsTicketsLoading(false);
        return;
      }

      setUserId(user.id);

      const [pRes, dRes, wRes, ewRes, wdRes, txRes, tkRes] = await Promise.all([
        fetchUserProfile(user.id),
        fetchUserDeposits(user.id),
        fetchUserWallet(user.id),
        fetchSavedEWallets(user.id),
        fetchUserWithdrawals(user.id),
        fetchUserTransactions(user.id),
        fetchUserTickets(user.id),
      ]);

      if (!pRes.isFallback && pRes.profile) {
        setUserProfile(pRes.profile);
        if (pRes.profile.avatarUrl) {
          setAvatarImage(pRes.profile.avatarUrl);
          try {
            localStorage.setItem(CACHE_AVATAR_KEY, pRes.profile.avatarUrl);
          } catch {}
        }
        try {
          localStorage.setItem(CACHE_PROFILE_KEY, JSON.stringify(pRes.profile));
        } catch {}
      }

      if (!dRes.isFallback && Array.isArray(dRes.deposits)) {
        const deps = dRes.deposits;
        setDeposits(deps);
        const newStats: UserStats = {
          total: deps.length,
          diterima: deps.filter((d) => d.status === "diterima").length,
          pending: deps.filter((d) => d.status === "pending" || d.status === "dicek").length,
          ditolak: deps.filter((d) => d.status === "ditolak").length,
        };
        setStats(newStats);
        try {
          localStorage.setItem(CACHE_DEPOSITS_KEY, JSON.stringify(deps));
          localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(newStats));
        } catch {}
      }

      if (!wRes.isFallback) {
        const newWallet: UserWalletData = {
          balance: wRes.balance,
          minimumWithdrawal: wRes.minimumWithdrawal,
          danaNumber: wRes.danaNumber,
        };
        setWallet(newWallet);
        try {
          localStorage.setItem(CACHE_WALLET_KEY, JSON.stringify(newWallet));
        } catch {}
      }

      if (!ewRes.isFallback && ewRes.accounts) {
        const cleanAccounts: Record<EWalletMethod, string> = { ...defaultEWallets };
        for (const [k, v] of Object.entries(ewRes.accounts)) {
          const str = typeof v === "string" ? v.trim() : "";
          if (str && str !== "081234567890" && str !== "08123456789") {
            cleanAccounts[k as EWalletMethod] = str;
          }
        }
        setPersistedAccounts(cleanAccounts);
        try {
          localStorage.setItem(CACHE_EWALLETS_KEY, JSON.stringify(cleanAccounts));
        } catch {}
      }

      if (!wdRes.isFallback && Array.isArray(wdRes.withdrawals)) {
        setWithdrawals(wdRes.withdrawals);
        try {
          localStorage.setItem(CACHE_WITHDRAWALS_KEY, JSON.stringify(wdRes.withdrawals));
        } catch {}
      }

      if (!txRes.isFallback && Array.isArray(txRes.transactions)) {
        setTransactions(txRes.transactions);
        try {
          localStorage.setItem(CACHE_TRANSACTIONS_KEY, JSON.stringify(txRes.transactions));
        } catch {}
      }

      if (!tkRes.isFallback && Array.isArray(tkRes.tickets)) {
        setTickets(tkRes.tickets);
        try {
          localStorage.setItem(CACHE_TICKETS_KEY, JSON.stringify(tkRes.tickets));
        } catch {}
      }
    } catch (err) {
      console.warn("[GlobalDataContext] refreshAll error:", err);
    } finally {
      setIsLoading(false);
      setIsProfileLoading(false);
      setIsStatsLoading(false);
      setIsWalletLoading(false);
      setIsEWalletLoading(false);
      setIsDepositsLoading(false);
      setIsHistoryLoading(false);
      setIsTicketsLoading(false);
    }
  }, []);

  // Fetch once on mount in background
  React.useEffect(() => {
    if (!isFetchedRef.current) {
      isFetchedRef.current = true;
      refreshAll();
    }
  }, [refreshAll]);

  // Granular Refreshers
  const refreshProfile = React.useCallback(async () => {
    try {
      const user = await getCurrentAuthUser();
      if (!user) return;
      const pRes = await fetchUserProfile(user.id);
      if (!pRes.isFallback && pRes.profile) {
        setUserProfile(pRes.profile);
        try {
          localStorage.setItem(CACHE_PROFILE_KEY, JSON.stringify(pRes.profile));
        } catch {}
      }
    } catch (err) {
      console.warn("[GlobalDataContext] refreshProfile error:", err);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  const refreshDeposits = React.useCallback(async () => {
    try {
      const user = await getCurrentAuthUser();
      if (!user) return;
      const dRes = await fetchUserDeposits(user.id);
      if (!dRes.isFallback && Array.isArray(dRes.deposits)) {
        const deps = dRes.deposits;
        setDeposits(deps);
        const newStats: UserStats = {
          total: deps.length,
          diterima: deps.filter((d) => d.status === "diterima").length,
          pending: deps.filter((d) => d.status === "pending" || d.status === "dicek").length,
          ditolak: deps.filter((d) => d.status === "ditolak").length,
        };
        setStats(newStats);
        try {
          localStorage.setItem(CACHE_DEPOSITS_KEY, JSON.stringify(deps));
          localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(newStats));
        } catch {}
      }
    } catch (err) {
      console.warn("[GlobalDataContext] refreshDeposits error:", err);
    } finally {
      setIsDepositsLoading(false);
      setIsStatsLoading(false);
    }
  }, []);

  const refreshWallet = React.useCallback(async () => {
    try {
      const user = await getCurrentAuthUser();
      if (!user) return;
      const wRes = await fetchUserWallet(user.id);
      if (!wRes.isFallback) {
        const newWallet: UserWalletData = {
          balance: wRes.balance,
          minimumWithdrawal: wRes.minimumWithdrawal,
          danaNumber: wRes.danaNumber,
        };
        setWallet(newWallet);
        try {
          localStorage.setItem(CACHE_WALLET_KEY, JSON.stringify(newWallet));
        } catch {}
      }
    } catch (err) {
      console.warn("[GlobalDataContext] refreshWallet error:", err);
    } finally {
      setIsWalletLoading(false);
    }
  }, []);

  const refreshEWallets = React.useCallback(async () => {
    try {
      const user = await getCurrentAuthUser();
      if (!user) return;
      const ewRes = await fetchSavedEWallets(user.id);
      if (!ewRes.isFallback && ewRes.accounts) {
        const cleanAccounts: Record<EWalletMethod, string> = { ...defaultEWallets };
        for (const [k, v] of Object.entries(ewRes.accounts)) {
          const str = typeof v === "string" ? v.trim() : "";
          if (str && str !== "081234567890" && str !== "08123456789") {
            cleanAccounts[k as EWalletMethod] = str;
          }
        }
        setPersistedAccounts(cleanAccounts);
        try {
          localStorage.setItem(CACHE_EWALLETS_KEY, JSON.stringify(cleanAccounts));
        } catch {}
      }
    } catch (err) {
      console.warn("[GlobalDataContext] refreshEWallets error:", err);
    } finally {
      setIsEWalletLoading(false);
    }
  }, []);

  const refreshHistory = React.useCallback(async () => {
    try {
      const user = await getCurrentAuthUser();
      if (!user) return;
      const [wdRes, txRes] = await Promise.all([
        fetchUserWithdrawals(user.id),
        fetchUserTransactions(user.id),
      ]);
      if (!wdRes.isFallback && Array.isArray(wdRes.withdrawals)) {
        setWithdrawals(wdRes.withdrawals);
        try {
          localStorage.setItem(CACHE_WITHDRAWALS_KEY, JSON.stringify(wdRes.withdrawals));
        } catch {}
      }
      if (!txRes.isFallback && Array.isArray(txRes.transactions)) {
        setTransactions(txRes.transactions);
        try {
          localStorage.setItem(CACHE_TRANSACTIONS_KEY, JSON.stringify(txRes.transactions));
        } catch {}
      }
    } catch (err) {
      console.warn("[GlobalDataContext] refreshHistory error:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const refreshTickets = React.useCallback(async () => {
    try {
      const user = await getCurrentAuthUser();
      if (!user) return;
      const tkRes = await fetchUserTickets(user.id);
      if (!tkRes.isFallback && Array.isArray(tkRes.tickets)) {
        setTickets(tkRes.tickets);
        try {
          localStorage.setItem(CACHE_TICKETS_KEY, JSON.stringify(tkRes.tickets));
        } catch {}
      }
    } catch (err) {
      console.warn("[GlobalDataContext] refreshTickets error:", err);
    } finally {
      setIsTicketsLoading(false);
    }
  }, []);

  const saveEWalletAccountLocally = React.useCallback(
    (method: EWalletMethod, number: string) => {
      setPersistedAccounts((prev) => {
        const next = { ...prev, [method]: number.trim() };
        try {
          localStorage.setItem(CACHE_EWALLETS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const addTicketLocally = React.useCallback((ticket: ReportTicket) => {
    setTickets((prev) => {
      const next = [ticket, ...prev];
      try {
        localStorage.setItem(CACHE_TICKETS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const updateAvatar = React.useCallback(
    async (dataUrl: string) => {
      setAvatarImage(dataUrl);
      try {
        localStorage.setItem(CACHE_AVATAR_KEY, dataUrl);
      } catch {}

      if (userId) {
        try {
          await updateUserProfile(userId, { avatar_url: dataUrl });
        } catch (err) {
          console.warn("[GlobalDataContext] update avatar error:", err);
        }
      }
    },
    [userId]
  );

  const deleteAvatar = React.useCallback(async () => {
    setAvatarImage(null);
    try {
      localStorage.removeItem(CACHE_AVATAR_KEY);
    } catch {}

    if (userId) {
      try {
        await updateUserProfile(userId, { avatar_url: "" });
      } catch (err) {
        console.warn("[GlobalDataContext] delete avatar error:", err);
      }
    }
  }, [userId]);

  const value = React.useMemo<GlobalDataContextValue>(
    () => ({
      userProfile,
      stats,
      avatarImage,
      userId,
      isLoading,
      isProfileLoading,
      isStatsLoading,
      wallet,
      persistedAccounts,
      isWalletLoading,
      isEWalletLoading,
      deposits,
      isDepositsLoading,
      withdrawals,
      transactions,
      isHistoryLoading,
      tickets,
      isTicketsLoading,
      refreshAll,
      refreshProfile,
      refreshDeposits,
      refreshWallet,
      refreshEWallets,
      refreshHistory,
      refreshTickets,
      saveEWalletAccountLocally,
      addTicketLocally,
      updateAvatar,
      deleteAvatar,
    }),
    [
      userProfile,
      stats,
      avatarImage,
      userId,
      isLoading,
      isProfileLoading,
      isStatsLoading,
      wallet,
      persistedAccounts,
      isWalletLoading,
      isEWalletLoading,
      deposits,
      isDepositsLoading,
      withdrawals,
      transactions,
      isHistoryLoading,
      tickets,
      isTicketsLoading,
      refreshAll,
      refreshProfile,
      refreshDeposits,
      refreshWallet,
      refreshEWallets,
      refreshHistory,
      refreshTickets,
      saveEWalletAccountLocally,
      addTicketLocally,
      updateAvatar,
      deleteAvatar,
    ]
  );

  return <GlobalDataContext.Provider value={value}>{children}</GlobalDataContext.Provider>;
}

// Hook export with backward-compatible name and new alias
export function useUserProfile(): GlobalDataContextValue {
  const context = React.useContext(GlobalDataContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}

export const useGlobalData = useUserProfile;
