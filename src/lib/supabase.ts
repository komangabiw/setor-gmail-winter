import { createClient } from "@supabase/supabase-js";
import {
  mockUser,
  mockWallet,
  mockDeposits,
  mockWithdrawals,
  mockTransactions,
  mockReports,
  type UserProfile,
  type DepositRecord,
  type WithdrawalRecord,
  type TransactionRecord,
  type ReportTicket,
} from "./mock-data";
import { getStoredSubmittedGmails, getStoredEWalletData } from "./generated-storage";

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
/* Auth & Session Helpers                                             */
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

/* ------------------------------------------------------------------ */
/* 1. Profile & Settings Helpers                                      */
/* ------------------------------------------------------------------ */

export async function fetchUserProfile(userId?: string): Promise<{
  profile: UserProfile;
  isFallback: boolean;
}> {
  if (!isSupabaseConfigured) {
    return { profile: mockUser, isFallback: true };
  }

  try {
    let targetUid = userId;
    if (!targetUid) {
      const user = await getCurrentAuthUser();
      targetUid = user?.id;
    }

    if (!targetUid) {
      return { profile: mockUser, isFallback: true };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUid)
      .maybeSingle();

    if (error || !data) {
      return { profile: mockUser, isFallback: true };
    }

    const profile: UserProfile = {
      uid: data.id,
      name: data.name || mockUser.name,
      email: data.email || mockUser.email,
      role: (data.role as UserProfile["role"]) || "User",
      avatarUrl: data.avatar_url || undefined,
      whatsappChannelUrl: data.whatsapp_channel_url || mockUser.whatsappChannelUrl,
      danaNumber: data.dana_number || mockUser.danaNumber,
      joinedAt: data.created_at
        ? new Date(data.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : mockUser.joinedAt,
      passwordChangedAt: data.password_changed_at
        ? new Date(data.password_changed_at).toLocaleDateString("id-ID")
        : "Belum pernah",
    };

    return { profile, isFallback: false };
  } catch {
    return { profile: mockUser, isFallback: true };
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
    const { error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal update" };
  }
}

/* ------------------------------------------------------------------ */
/* 2. Wallet & E-Wallet Helpers                                       */
/* ------------------------------------------------------------------ */

export async function fetchUserWallet(userId?: string): Promise<{
  balance: number;
  minimumWithdrawal: number;
  danaNumber: string;
  isFallback: boolean;
}> {
  if (!isSupabaseConfigured) {
    return {
      balance: mockWallet.balance,
      minimumWithdrawal: mockWallet.minimumWithdrawal,
      danaNumber: mockWallet.danaNumber,
      isFallback: true,
    };
  }

  try {
    let targetUid = userId;
    if (!targetUid) {
      const user = await getCurrentAuthUser();
      targetUid = user?.id;
    }

    if (!targetUid) {
      return {
        balance: mockWallet.balance,
        minimumWithdrawal: mockWallet.minimumWithdrawal,
        danaNumber: mockWallet.danaNumber,
        isFallback: true,
      };
    }

    const { data: walletData, error: walletErr } = await supabase
      .from("wallets")
      .select("balance, minimum_withdrawal")
      .eq("user_id", targetUid)
      .maybeSingle();

    const { data: profileData } = await supabase
      .from("profiles")
      .select("dana_number")
      .eq("id", targetUid)
      .maybeSingle();

    if (walletErr || !walletData) {
      return {
        balance: mockWallet.balance,
        minimumWithdrawal: mockWallet.minimumWithdrawal,
        danaNumber: profileData?.dana_number || mockWallet.danaNumber,
        isFallback: true,
      };
    }

    return {
      balance: Number(walletData.balance) || 0,
      minimumWithdrawal: Number(walletData.minimum_withdrawal) || 5000,
      danaNumber: profileData?.dana_number || mockWallet.danaNumber,
      isFallback: false,
    };
  } catch {
    return {
      balance: mockWallet.balance,
      minimumWithdrawal: mockWallet.minimumWithdrawal,
      danaNumber: mockWallet.danaNumber,
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
    let targetUid = userId;
    if (!targetUid) {
      const user = await getCurrentAuthUser();
      targetUid = user?.id;
    }

    if (!targetUid) {
      return { accounts: local.accounts, defaultMethod: local.defaultMethod, isFallback: true };
    }

    const { data, error } = await supabase
      .from("saved_ewallets")
      .select("method, account_number, is_default")
      .eq("user_id", targetUid);

    if (error || !data || data.length === 0) {
      return { accounts: local.accounts, defaultMethod: local.defaultMethod, isFallback: true };
    }

    const accounts: Record<string, string> = { ...local.accounts };
    let defaultMethod = local.defaultMethod;

    data.forEach((row) => {
      accounts[row.method] = row.account_number;
      if (row.is_default) {
        defaultMethod = row.method;
      }
    });

    return { accounts, defaultMethod, isFallback: false };
  } catch {
    return { accounts: local.accounts, defaultMethod: local.defaultMethod, isFallback: true };
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
    if (isDefault) {
      await supabase
        .from("saved_ewallets")
        .update({ is_default: false })
        .eq("user_id", userId);
    }

    const { error } = await supabase.from("saved_ewallets").upsert(
      {
        user_id: userId,
        method: method.toUpperCase(),
        account_number: accountNumber.trim(),
        is_default: isDefault,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,method" }
    );

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal simpan e-wallet" };
  }
}

/* ------------------------------------------------------------------ */
/* 3. Deposits / Setoran Helpers                                      */
/* ------------------------------------------------------------------ */

export async function fetchUserDeposits(userId?: string): Promise<{
  deposits: DepositRecord[];
  isFallback: boolean;
}> {
  if (!isSupabaseConfigured) {
    return { deposits: mockDeposits, isFallback: true };
  }

  try {
    let targetUid = userId;
    if (!targetUid) {
      const user = await getCurrentAuthUser();
      targetUid = user?.id;
    }

    if (!targetUid) {
      return { deposits: mockDeposits, isFallback: true };
    }

    const { data, error } = await supabase
      .from("deposits")
      .select("id, gmail, status, amount, category_id, note, created_at, updated_at")
      .eq("user_id", targetUid)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return { deposits: mockDeposits, isFallback: true };
    }

    const deposits: DepositRecord[] = data.map((d) => ({
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
  } catch {
    return { deposits: mockDeposits, isFallback: true };
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
    const records = emails.map((email) => {
      const clean = email.trim().toLowerCase();
      const atIdx = clean.lastIndexOf("@");
      const normalized =
        atIdx !== -1
          ? clean.slice(0, atIdx).replace(/\./g, "") + clean.slice(atIdx)
          : clean;

      return {
        user_id: userId,
        gmail: email.trim(),
        normalized_gmail: normalized,
        category_id: categoryId,
        status: "pending",
        amount: amountPerAccount,
      };
    });

    const { data, error } = await supabase
      .from("deposits")
      .insert(records)
      .select("id");

    if (error) {
      return { success: false, insertedCount: 0, error: error.message };
    }

    return { success: true, insertedCount: data?.length || records.length };
  } catch (err: unknown) {
    return {
      success: false,
      insertedCount: 0,
      error: err instanceof Error ? err.message : "Gagal menyimpan setoran",
    };
  }
}

/* ------------------------------------------------------------------ */
/* 4. Withdrawals / Penarikan Helpers                                 */
/* ------------------------------------------------------------------ */

export async function fetchUserWithdrawals(userId?: string): Promise<{
  withdrawals: WithdrawalRecord[];
  isFallback: boolean;
}> {
  if (!isSupabaseConfigured) {
    return { withdrawals: mockWithdrawals, isFallback: true };
  }

  try {
    let targetUid = userId;
    if (!targetUid) {
      const user = await getCurrentAuthUser();
      targetUid = user?.id;
    }

    if (!targetUid) {
      return { withdrawals: mockWithdrawals, isFallback: true };
    }

    const { data, error } = await supabase
      .from("withdrawals")
      .select("id, amount, status, method, account_number, created_at, updated_at")
      .eq("user_id", targetUid)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return { withdrawals: mockWithdrawals, isFallback: true };
    }

    const withdrawals: WithdrawalRecord[] = data.map((w) => ({
      id: w.id,
      amount: Number(w.amount),
      status: w.status as WithdrawalRecord["status"],
      method: w.method,
      accountNumber: w.account_number,
      createdAt: w.created_at,
      updatedAt: w.updated_at || undefined,
    }));

    return { withdrawals, isFallback: false };
  } catch {
    return { withdrawals: mockWithdrawals, isFallback: true };
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
  if (!isSupabaseConfigured) {
    return { success: true, id: `w-${Date.now()}` };
  }

  try {
    // 1. Insert into withdrawals table
    const { data, error } = await supabase
      .from("withdrawals")
      .insert({
        user_id: userId,
        amount: params.amount,
        tax_fee: params.taxFee,
        net_amount: params.netAmount,
        method: params.method.toUpperCase(),
        account_number: params.accountNumber.trim(),
        status: "diproses",
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // 2. Insert into transactions table
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "withdrawal",
      amount: params.amount,
      title: "Penarikan Saldo",
      description: `${params.method} ${params.accountNumber}`,
      status: "pending",
      reference_id: data.id,
    });

    // 3. Deduct balance from wallet
    const { data: currentWallet } = await supabase
      .from("wallets")
      .select("balance, total_withdrawn")
      .eq("user_id", userId)
      .single();

    if (currentWallet) {
      const newBalance = Math.max(0, Number(currentWallet.balance) - params.amount);
      await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    return { success: true, id: data.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memproses penarikan",
    };
  }
}

/* ------------------------------------------------------------------ */
/* 5. Transactions / Mutasi Helpers                                   */
/* ------------------------------------------------------------------ */

export async function fetchUserTransactions(userId?: string): Promise<{
  transactions: TransactionRecord[];
  isFallback: boolean;
}> {
  if (!isSupabaseConfigured) {
    return { transactions: mockTransactions, isFallback: true };
  }

  try {
    let targetUid = userId;
    if (!targetUid) {
      const user = await getCurrentAuthUser();
      targetUid = user?.id;
    }

    if (!targetUid) {
      return { transactions: mockTransactions, isFallback: true };
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("id, type, amount, title, description, status, created_at")
      .eq("user_id", targetUid)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return { transactions: mockTransactions, isFallback: true };
    }

    const transactions: TransactionRecord[] = data.map((t) => ({
      id: t.id,
      type: t.type as TransactionRecord["type"],
      amount: Number(t.amount),
      title: t.title,
      description: t.description || "",
      status: t.status as TransactionRecord["status"],
      createdAt: t.created_at,
    }));

    return { transactions, isFallback: false };
  } catch {
    return { transactions: mockTransactions, isFallback: true };
  }
}

/* ------------------------------------------------------------------ */
/* 6. Support Tickets / Laporan Helpers                               */
/* ------------------------------------------------------------------ */

export async function fetchUserTickets(userId?: string): Promise<{
  tickets: ReportTicket[];
  isFallback: boolean;
}> {
  if (!isSupabaseConfigured) {
    return { tickets: mockReports, isFallback: true };
  }

  try {
    let targetUid = userId;
    if (!targetUid) {
      const user = await getCurrentAuthUser();
      targetUid = user?.id;
    }

    if (!targetUid) {
      return { tickets: mockReports, isFallback: true };
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

    if (error || !data || data.length === 0) {
      return { tickets: mockReports, isFallback: true };
    }

    const tickets: ReportTicket[] = data.map((t) => {
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
  } catch {
    return { tickets: mockReports, isFallback: true };
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
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        ticket_code: params.code,
        user_id: userId,
        category: params.category,
        subject: params.subject,
        description: params.description,
        attachment_name: params.attachmentName || null,
        attachment_url: params.attachmentUrl || null,
        status: "baru",
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal membuat tiket laporan",
    };
  }
}
