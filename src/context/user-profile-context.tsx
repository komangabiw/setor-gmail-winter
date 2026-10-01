"use client";

import * as React from "react";
import { type UserProfile } from "@/lib/mock-data";
import {
  getCurrentAuthUser,
  fetchUserProfile,
  updateUserProfile,
  fetchUserDeposits,
} from "@/lib/supabase";

export interface UserStats {
  total: number;
  diterima: number;
  pending: number;
  ditolak: number;
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

interface UserProfileContextValue {
  userProfile: UserProfile;
  stats: UserStats;
  avatarImage: string | null;
  userId: string | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  updateAvatar: (dataUrl: string) => Promise<void>;
  deleteAvatar: () => Promise<void>;
}

const UserProfileContext = React.createContext<UserProfileContextValue | undefined>(undefined);

const CACHE_PROFILE_KEY = "setorgmail_cached_profile_v1";
const CACHE_STATS_KEY = "setorgmail_cached_stats_v1";
const CACHE_AVATAR_KEY = "user_profile_avatar";

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = React.useState<UserProfile>(defaultProfile);
  const [stats, setStats] = React.useState<UserStats>(defaultStats);
  const [avatarImage, setAvatarImage] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const isFetchedRef = React.useRef(false);

  // Instant hydration from localStorage on mount (if available)
  React.useEffect(() => {
    try {
      const cachedAvatar = localStorage.getItem(CACHE_AVATAR_KEY);
      if (cachedAvatar) {
        setAvatarImage(cachedAvatar);
      }

      const cachedProfileRaw = localStorage.getItem(CACHE_PROFILE_KEY);
      const cachedStatsRaw = localStorage.getItem(CACHE_STATS_KEY);

      if (cachedProfileRaw) {
        const parsed = JSON.parse(cachedProfileRaw);
        if (parsed && typeof parsed === "object" && parsed.uid && parsed.uid !== "-") {
          setUserProfile(parsed);
          setIsLoading(false);
        }
      }

      if (cachedStatsRaw) {
        const parsedStats = JSON.parse(cachedStatsRaw);
        if (parsedStats && typeof parsedStats === "object") {
          setStats(parsedStats);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshProfile = React.useCallback(async () => {
    try {
      const user = await getCurrentAuthUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      const [pRes, dRes] = await Promise.all([
        fetchUserProfile(user.id),
        fetchUserDeposits(user.id),
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
        const newStats: UserStats = {
          total: deps.length,
          diterima: deps.filter((d) => d.status === "diterima").length,
          pending: deps.filter((d) => d.status === "pending" || d.status === "dicek").length,
          ditolak: deps.filter((d) => d.status === "ditolak").length,
        };
        setStats(newStats);
        try {
          localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(newStats));
        } catch {}
      }
    } catch (err) {
      console.warn("[UserProfileContext] load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch once on mount in background
  React.useEffect(() => {
    if (!isFetchedRef.current) {
      isFetchedRef.current = true;
      refreshProfile();
    }
  }, [refreshProfile]);

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
          console.warn("[UserProfileContext] update avatar error:", err);
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
        console.warn("[UserProfileContext] delete avatar error:", err);
      }
    }
  }, [userId]);

  const value = React.useMemo(
    () => ({
      userProfile,
      stats,
      avatarImage,
      userId,
      isLoading,
      refreshProfile,
      updateAvatar,
      deleteAvatar,
    }),
    [userProfile, stats, avatarImage, userId, isLoading, refreshProfile, updateAvatar, deleteAvatar]
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const context = React.useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
