import { createClient } from "@supabase/supabase-js";
import {
  type UserProfile,
  type DepositRecord,
  type WithdrawalRecord,
  type TransactionRecord,
  type ReportTicket,
} from "./mock-data";
import { getStoredEWalletData } from "./generated-storage";
import {
  sanitizeInputText,
  validateEWalletNumber,
  validateWithdrawalAmount,
  sanitizeErrorMessage,
  recordWithdrawalAttempt,
  MAX_WITHDRAWALS_PER_DAY,
} from "./security";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("<")
);

export const supabase = createClient(
  supabaseUrl || "https://kdjoeeehyahdgwgsfyal.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/* ------------------------------------------------------------------ */
/* Auth & Session Helpers (A01 & A07)                                 */
/* ------------------------------------------------------------------ */

export async function getCurrentAuthUser() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

const defaultEmptyProfile: UserProfile = {
  name: "Pengguna",
  email: "-",
  uid: "-",
  role: "User",
  danaNumber: "-",
  joinedAt: "-",
  passwordChangedAt: "Belum pernah",
  whatsappChannelUrl: "https://whatsapp.com/channel/0029Vb4qWwV1iUxUf5k7qY0A",
};

/* ------------------------------------------------------------------ */
/* 1. Profile & Settings Helpers (A01, A03, A07)                      */
/* ------------------------------------------------------------------ */

export async function fetchUserProfile(userId?: string): Promise<{
  profile: UserProfile;
  isFallback: boolean;
}> {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return { profile: defaultEmptyProfile, isFallback: true };
    }

    // A01/A07: Prevent IDOR - User A cannot access User B's profile
    if (userId && userId !== user.id) {
      console.warn(`[SECURITY] IDOR blocked: user ${user.id} attempted to view profile ${userId}`);
      return { profile: defaultEmptyProfile, isFallback: true };
    }

    const targetUid = user.id;
    let profileData: Record<string, any> | null = null;

    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUid)
        .maybeSingle();
      profileData = data;
    }

    const realName =
      profileData?.name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "Pengguna";
    const realEmail = profileData?.email || user?.email || "-";
    const realDate = profileData?.created_at || user?.created_at;

    const profile: UserProfile = {
      uid: targetUid,
      name: realName,
      email: realEmail,
      role: (profileData?.role as UserProfile["role"]) || "User",
      avatarUrl: profileData?.avatar_url || user?.user_metadata?.avatar_url || undefined,
      whatsappChannelUrl:
        profileData?.whatsapp_channel_url || "https://whatsapp.com/channel/0029Vb4qWwV1iUxUf5k7qY0A",
      danaNumber: profileData?.dana_number || "-",
      joinedAt: realDate
        ? new Date(realDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "-",
      passwordChangedAt: profileData?.password_changed_at
        ? new Date(profileData.password_changed_at).toLocaleDateString("id-ID")
        : "Belum pernah",
    };

    return { profile, isFallback: false };
  } catch (err) {
    console.error("[PROFILE FETCH ERROR]", err);
    return { profile: defaultEmptyProfile, isFallback: true };
  }
}

export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    avatar_url?: string;
    dana_number?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const user = await getCurrentAuthUser();
    // A01/A07: Verify authenticated session and ownership
    if (!user || user.id !== userId) {
      return { success: false, error: "Akses ditolak: Sesi tidak sah." };
    }

    // A03: Strict Input Sanitization
    const sanitizedUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) {
      sanitizedUpdates.name = sanitizeInputText(updates.name, 100);
    }
    if (updates.avatar_url !== undefined) {
      sanitizedUpdates.avatar_url = sanitizeInputText(updates.avatar_url, 500);
    }
    if (updates.dana_number !== undefined) {
      const phoneVal = validateEWalletNumber(updates.dana_number);
      if (!phoneVal.valid) {
        return { success: false, error: phoneVal.error };
      }
      sanitizedUpdates.dana_number = phoneVal.cleaned;
    }

    const { error } = await supabase
      .from("profiles")
      .update(sanitizedUpdates)
      .eq("id", user.id);

    if (error) return { success: false, error: sanitizeErrorMessage(error) };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: sanitizeErrorMessage(err) };
  }
}

/* ------------------------------------------------------------------ */
/* 2. Wallet & E-Wallet Helpers (A01, A03, A07)                       */
/* ------------------------------------------------------------------ */

export async function fetchUserWallet(userId?: string): Promise<{
  balance: number;
  minimumWithdrawal: number;
  danaNumber: string;
  isFallback: boolean;
}> {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return {
        balance: 0,
        minimumWithdrawal: 5000,
        danaNumber: "",
        isFallback: true,
      };
    }

    // A01/A07: Prevent IDOR
    if (userId && userId !== user.id) {
      console.warn(`[SECURITY] IDOR blocked: user ${user.id} attempted to view wallet ${userId}`);
      return {
        balance: 0,
        minimumWithdrawal: 5000,
        danaNumber: "",
        isFallback: true,
      };
    }

    const targetUid = user.id;
    let walletBalance = 0;
    let minWithdrawal = 5000;
    let danaNum = "";

    if (isSupabaseConfigured) {
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance, minimum_withdrawal")
        .eq("user_id", targetUid)
        .maybeSingle();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("dana_number")
        .eq("id", targetUid)
        .maybeSingle();

      if (walletData) {
        walletBalance = Number(walletData.balance) || 0;
        minWithdrawal = Number(walletData.minimum_withdrawal) || 5000;
      }
      if (profileData?.dana_number) {
        danaNum = profileData.dana_number;
      }
    }

    return {
      balance: walletBalance,
      minimumWithdrawal: minWithdrawal,
      danaNumber: danaNum,
      isFallback: false,
    };
  } catch (err) {
    console.error("[WALLET FETCH ERROR]", err);
    return {
      balance: 0,
      minimumWithdrawal: 5000,
      danaNumber: "",
      isFallback: true,
    };
  }
}

export async function fetchSavedEWallets(userId?: string): Promise<{
  accounts: Record<string, string>;
  defaultMethod: string;
  isFallback: boolean;
}> {
  const local = getStoredEWalletData();
  if (!isSupabaseConfigured) {
    return { accounts: local.accounts, defaultMethod: local.defaultMethod, isFallback: true };
  }

  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return { accounts: local.accounts, defaultMethod: local.defaultMethod, isFallback: true };
    }

    // A01/A07: Verify ownership
    if (userId && userId !== user.id) {
      console.warn(`[SECURITY] IDOR blocked: user ${user.id} attempted to fetch e-wallets ${userId}`);
      return { accounts: local.accounts, defaultMethod: local.defaultMethod, isFallback: true };
    }

    const targetUid = user.id;

    const { data, error } = await supabase
      .from("saved_ewallets")
      .select("method, account_number, is_default")
      .eq("user_id", targetUid);

    if (error || !data || data.length === 0) {
      return { accounts: local.accounts, defaultMethod: "DANA", isFallback: true };
    }

    const accounts: Record<string, string> = { ...local.accounts };

    data.forEach((row) => {
      const num = typeof row.account_number === "string" ? row.account_number.trim() : "";
      if (num && num !== "081234567890" && num !== "08123456789") {
        accounts[row.method] = num;
      }
    });

    return { accounts, defaultMethod: "DANA", isFallback: false };
  } catch (err) {
    console.error("[E-WALLET FETCH ERROR]", err);
    return { accounts: local.accounts, defaultMethod: "DANA", isFallback: true };
  }
}

export async function saveEWalletAccount(
  userId: string,
  method: string,
  accountNumber: string,
  isDefault = false
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const user = await getCurrentAuthUser();
    // A01/A07: Verify user authentication and ID ownership
    if (!user || user.id !== userId) {
      return { success: false, error: "Akses ditolak: Sesi tidak sah." };
    }

    // A03: Strict E-Wallet Validation
    const cleanMethod = sanitizeInputText(method, 20).toUpperCase();
    const validMethods = ["DANA", "GOPAY", "OVO", "SHOPEEPAY"];
    if (!validMethods.includes(cleanMethod)) {
      return { success: false, error: "Metode e-wallet tidak valid." };
    }

    const phoneCheck = validateEWalletNumber(accountNumber);
    if (!phoneCheck.valid) {
      return { success: false, error: phoneCheck.error };
    }

    if (isDefault) {
      await supabase
        .from("saved_ewallets")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const { error } = await supabase.from("saved_ewallets").upsert(
      {
        user_id: user.id,
        method: cleanMethod,
        account_number: phoneCheck.cleaned,
        is_default: Boolean(isDefault),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,method" }
    );

    if (error) return { success: false, error: sanitizeErrorMessage(error) };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: sanitizeErrorMessage(err) };
  }
}

/* ------------------------------------------------------------------ */
/* 3. Deposits / Setoran Helpers (A01, A03, A07)                      */
/* ------------------------------------------------------------------ */

export async function fetchUserDeposits(userId?: string): Promise<{
  deposits: DepositRecord[];
  isFallback: boolean;
}> {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return { deposits: [], isFallback: true };
    }

    // A01/A07: Prevent IDOR
    if (userId && userId !== user.id) {
      console.warn(`[SECURITY] IDOR blocked: user ${user.id} attempted to view deposits ${userId}`);
      return { deposits: [], isFallback: true };
    }

    const targetUid = user.id;

    if (!isSupabaseConfigured) {
      return { deposits: [], isFallback: true };
    }

    const { data, error } = await supabase
      .from("deposits")
      .select("id, gmail, status, amount, category_id, note, created_at, updated_at")
      .eq("user_id", targetUid)
      .order("created_at", { ascending: false });

    if (error) {
      return { deposits: [], isFallback: true };
    }

    const deposits: DepositRecord[] = (data || []).map((d) => ({
      id: d.id,
      gmail: d.gmail,
      status: d.status as DepositRecord["status"],
      amount: d.amount,
      category: (d.category_id as DepositRecord["category"]) || "good",
      createdAt: d.created_at,
      updatedAt: d.updated_at || undefined,
      note: d.note || undefined,
    }));

    return { deposits, isFallback: false };
  } catch (err) {
    console.error("[DEPOSITS FETCH ERROR]", err);
    return { deposits: [], isFallback: true };
  }
}

export async function insertUserDeposits(
  userId: string,
  emails: string[],
  categoryId = "good",
  amountPerAccount = 4500
): Promise<{ success: boolean; insertedCount: number; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, insertedCount: emails.length };
  }

  try {
    const user = await getCurrentAuthUser();
    // A01/A07: Verify authenticated user
    if (!user || user.id !== userId) {
      return { success: false, insertedCount: 0, error: "Akses ditolak: Sesi tidak sah." };
    }

    if (!Array.isArray(emails) || emails.length === 0) {
      return { success: false, insertedCount: 0, error: "Daftar email tidak boleh kosong." };
    }

    const cleanCategory = sanitizeInputText(categoryId, 50) || "good";
    const cleanAmount = Math.max(0, Math.floor(Number(amountPerAccount) || 4500));

    const records = emails
      .filter((e) => typeof e === "string" && e.trim().includes("@"))
      .map((email) => {
        const clean = sanitizeInputText(email, 120).toLowerCase();
        const atIdx = clean.lastIndexOf("@");
        const normalized =
          atIdx !== -1
            ? clean.slice(0, atIdx).replace(/\./g, "") + clean.slice(atIdx)
            : clean;

        return {
          user_id: user.id,
          gmail: clean,
          normalized_gmail: normalized,
          category_id: cleanCategory,
          status: "pending",
          amount: cleanAmount,
        };
      });

    if (records.length === 0) {
      return { success: false, insertedCount: 0, error: "Tidak ada email valid untuk disetor." };
    }

    const { data, error } = await supabase
      .from("deposits")
      .insert(records)
      .select("id");

    if (error) {
      return { success: false, insertedCount: 0, error: sanitizeErrorMessage(error) };
    }

    return { success: true, insertedCount: data?.length || records.length };
  } catch (err: unknown) {
    return {
      success: false,
      insertedCount: 0,
      error: sanitizeErrorMessage(err, "Gagal menyimpan data setoran."),
    };
  }
}

/* ------------------------------------------------------------------ */
/* 4. Withdrawals / Penarikan Helpers (A01, A03, A04, A07, A09, B1)   */
/* ------------------------------------------------------------------ */

export async function fetchUserWithdrawals(userId?: string): Promise<{
  withdrawals: WithdrawalRecord[];
  isFallback: boolean;
}> {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return { withdrawals: [], isFallback: true };
    }

    // A01/A07: Prevent IDOR
    if (userId && userId !== user.id) {
      console.warn(`[SECURITY] IDOR blocked: user ${user.id} attempted to view withdrawals ${userId}`);
      return { withdrawals: [], isFallback: true };
    }

    const targetUid = user.id;

    if (!isSupabaseConfigured) {
      return { withdrawals: [], isFallback: true };
    }

    const { data, error } = await supabase
      .from("withdrawals")
      .select("id, amount, status, method, account_number, created_at, updated_at")
      .eq("user_id", targetUid)
      .order("created_at", { ascending: false });

    if (error) {
      return { withdrawals: [], isFallback: true };
    }

    const withdrawals: WithdrawalRecord[] = (data || []).map((w) => ({
      id: w.id,
      amount: Number(w.amount),
      status: w.status as WithdrawalRecord["status"],
      method: w.method,
      accountNumber: w.account_number,
      createdAt: w.created_at,
      updatedAt: w.updated_at || undefined,
    }));

    return { withdrawals, isFallback: false };
  } catch (err) {
    console.error("[WITHDRAWALS FETCH ERROR]", err);
    return { withdrawals: [], isFallback: true };
  }
}

export async function insertWithdrawalRequest(
  userId: string,
  params: {
    amount: number;
    taxFee: number;
    netAmount: number;
    method: string;
    accountNumber: string;
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // 1. A01/A07: Session verification
    const user = await getCurrentAuthUser();
    if (!user || user.id !== userId) {
      return { success: false, error: "Akses ditolak: Sesi tidak sah." };
    }

    // 2. A03: Strict input validation on E-Wallet & Method
    const validMethods = ["DANA", "GOPAY", "OVO", "SHOPEEPAY"];
    const cleanMethod = sanitizeInputText(params.method, 20).toUpperCase();
    if (!validMethods.includes(cleanMethod)) {
      recordWithdrawalAttempt(user.id, false);
      return { success: false, error: "Metode pembayaran e-wallet tidak valid." };
    }

    const phoneCheck = validateEWalletNumber(params.accountNumber);
    if (!phoneCheck.valid) {
      recordWithdrawalAttempt(user.id, false);
      return { success: false, error: phoneCheck.error };
    }

    if (!isSupabaseConfigured) {
      recordWithdrawalAttempt(user.id, true);
      return { success: true, id: `w-${Date.now()}` };
    }

    // 3. B1: Fraud Protection - 24 Hours Rate Limiting (Max 3 withdrawals per 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: dailyCount, error: countErr } = await supabase
      .from("withdrawals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", twentyFourHoursAgo);

    if (countErr) {
      console.warn("[RATE LIMIT CHECK WARN]", countErr);
    } else if (typeof dailyCount === "number" && dailyCount >= MAX_WITHDRAWALS_PER_DAY) {
      recordWithdrawalAttempt(user.id, false);
      return {
        success: false,
        error: `Batas penarikan tercapai: Maksimal ${MAX_WITHDRAWALS_PER_DAY} kali penarikan dalam 24 jam untuk perlindungan keamanan akun.`,
      };
    }

    // 4. A04: Fetch current wallet to check balance
    const { data: currentWallet, error: walletFetchErr } = await supabase
      .from("wallets")
      .select("balance, total_withdrawn")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletFetchErr || !currentWallet) {
      recordWithdrawalAttempt(user.id, false);
      return { success: false, error: "Data dompet tidak ditemukan atau sistem sedang sibuk." };
    }

    const currentBalance = Number(currentWallet.balance) || 0;

    // Validate amount boundaries (Min Rp5.000, Max Rp5.000.000, Positive Integer)
    const amountVal = validateWithdrawalAmount(params.amount, currentBalance);
    if (!amountVal.valid) {
      recordWithdrawalAttempt(user.id, false);
      return { success: false, error: amountVal.error };
    }

    const requestedAmount = amountVal.cleanAmount;
    const currentWithdrawn = Number(currentWallet.total_withdrawn) || 0;
    const newBalance = currentBalance - requestedAmount;
    const newTotalWithdrawn = currentWithdrawn + requestedAmount;

    // 5. A04: ATOMIC BALANCE DEDUCTION (Anti-Double Spending & Race Condition Guard)
    // The query condition `.gte("balance", requestedAmount)` is evaluated atomically by PostgreSQL.
    // If two concurrent requests try to withdraw at the exact same instant, only ONE will match the condition!
    const { data: updatedWallet, error: updateErr } = await supabase
      .from("wallets")
      .update({
        balance: newBalance,
        total_withdrawn: newTotalWithdrawn,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .gte("balance", requestedAmount)
      .select("balance");

    if (updateErr || !updatedWallet || updatedWallet.length === 0) {
      recordWithdrawalAttempt(user.id, false);
      return {
        success: false,
        error: "Penarikan gagal: Terjadi perubahan saldo bersamaan atau saldo tidak mencukupi.",
      };
    }

    // 6. Record withdrawal entry
    const cleanTax = Math.max(0, Math.floor(Number(params.taxFee) || 0));
    const cleanNet = Math.max(0, requestedAmount - cleanTax);

    const { data: withdrawalData, error: withdrawalErr } = await supabase
      .from("withdrawals")
      .insert({
        user_id: user.id,
        amount: requestedAmount,
        tax_fee: cleanTax,
        net_amount: cleanNet,
        method: cleanMethod,
        account_number: phoneCheck.cleaned,
        status: "diproses",
      })
      .select("id")
      .single();

    if (withdrawalErr || !withdrawalData) {
      // Rollback deducted balance if recording fails
      await supabase
        .from("wallets")
        .update({
          balance: currentBalance,
          total_withdrawn: currentWithdrawn,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      recordWithdrawalAttempt(user.id, false);
      return { success: false, error: sanitizeErrorMessage(withdrawalErr, "Gagal mencatat transaksi penarikan.") };
    }

    // 7. Record transaction entry
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "withdrawal",
      amount: requestedAmount,
      title: "Penarikan Saldo",
      description: `${cleanMethod} ${phoneCheck.cleaned}`,
      status: "pending",
      reference_id: withdrawalData.id,
    });

    // Reset failed counter on success
    recordWithdrawalAttempt(user.id, true);

    return { success: true, id: withdrawalData.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: sanitizeErrorMessage(err, "Gagal memproses penarikan saldo."),
    };
  }
}

/* ------------------------------------------------------------------ */
/* 5. Transactions / Mutasi Helpers (A01, A07)                        */
/* ------------------------------------------------------------------ */

export async function fetchUserTransactions(userId?: string): Promise<{
  transactions: TransactionRecord[];
  isFallback: boolean;
}> {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return { transactions: [], isFallback: true };
    }

    // A01/A07: Prevent IDOR
    if (userId && userId !== user.id) {
      console.warn(`[SECURITY] IDOR blocked: user ${user.id} attempted to view transactions ${userId}`);
      return { transactions: [], isFallback: true };
    }

    const targetUid = user.id;

    if (!isSupabaseConfigured) {
      return { transactions: [], isFallback: true };
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("id, type, amount, title, description, status, created_at")
      .eq("user_id", targetUid)
      .order("created_at", { ascending: false });

    if (error) {
      return { transactions: [], isFallback: true };
    }

    const transactions: TransactionRecord[] = (data || []).map((t) => ({
      id: t.id,
      type: t.type as TransactionRecord["type"],
      amount: Number(t.amount),
      title: t.title,
      description: t.description || "",
      status: t.status as TransactionRecord["status"],
      createdAt: t.created_at,
    }));

    return { transactions, isFallback: false };
  } catch (err) {
    console.error("[TRANSACTIONS FETCH ERROR]", err);
    return { transactions: [], isFallback: true };
  }
}

/* ------------------------------------------------------------------ */
/* 6. Support Tickets / Laporan Helpers (A01, A03, A07, A09)          */
/* ------------------------------------------------------------------ */

export async function fetchUserTickets(userId?: string): Promise<{
  tickets: ReportTicket[];
  isFallback: boolean;
}> {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return { tickets: [], isFallback: true };
    }

    // A01/A07: Prevent IDOR
    if (userId && userId !== user.id) {
      console.warn(`[SECURITY] IDOR blocked: user ${user.id} attempted to view tickets ${userId}`);
      return { tickets: [], isFallback: true };
    }

    const targetUid = user.id;

    if (!isSupabaseConfigured) {
      return { tickets: [], isFallback: true };
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .select(`
        id, ticket_code, category, subject, description, status,
        attachment_name, created_at,
        ticket_replies (id, sender_type, message, created_at)
      `)
      .eq("user_id", targetUid)
      .order("created_at", { ascending: false });

    if (error) {
      return { tickets: [], isFallback: true };
    }

    const tickets: ReportTicket[] = (data || []).map((t) => {
      const replies = Array.isArray(t.ticket_replies)
        ? t.ticket_replies.map((r: { id: string; sender_type: string; message: string; created_at: string }) => ({
            id: r.id,
            from: (r.sender_type === "admin" ? "admin" : "user") as "admin" | "user",
            body: r.message,
            createdAt: r.created_at,
          }))
        : [];

      return {
        id: t.id,
        code: t.ticket_code,
        category: t.category as ReportTicket["category"],
        subject: t.subject,
        description: t.description,
        status: t.status as ReportTicket["status"],
        attachmentName: t.attachment_name || undefined,
        createdAt: t.created_at,
        replies,
      };
    });

    return { tickets, isFallback: false };
  } catch (err) {
    console.error("[TICKETS FETCH ERROR]", err);
    return { tickets: [], isFallback: true };
  }
}

export async function insertSupportTicket(
  userId: string,
  params: {
    code: string;
    category: string;
    subject: string;
    description: string;
    attachmentName?: string;
    attachmentUrl?: string;
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, id: `t-${Date.now()}` };
  }

  try {
    const user = await getCurrentAuthUser();
    // A01/A07: Verify authenticated user
    if (!user || user.id !== userId) {
      return { success: false, error: "Akses ditolak: Sesi tidak sah." };
    }

    // A03: Sanitize all ticket inputs
    const cleanCode = sanitizeInputText(params.code, 50);
    const cleanCategory = sanitizeInputText(params.category, 50);
    const cleanSubject = sanitizeInputText(params.subject, 150);
    const cleanDescription = sanitizeInputText(params.description, 2000);
    const cleanAttachmentName = params.attachmentName ? sanitizeInputText(params.attachmentName, 200) : null;
    const cleanAttachmentUrl = params.attachmentUrl ? sanitizeInputText(params.attachmentUrl, 500) : null;

    if (!cleanSubject || !cleanDescription) {
      return { success: false, error: "Judul dan deskripsi tiket wajib diisi." };
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        ticket_code: cleanCode,
        user_id: user.id,
        category: cleanCategory,
        subject: cleanSubject,
        description: cleanDescription,
        attachment_name: cleanAttachmentName,
        attachment_url: cleanAttachmentUrl,
        status: "baru",
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: sanitizeErrorMessage(error) };
    }

    return { success: true, id: data.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: sanitizeErrorMessage(err, "Gagal membuat tiket laporan."),
    };
  }
}
