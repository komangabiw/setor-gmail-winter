"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

export default function GoogleAuthInitiatePage() {
  React.useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

    if (!clientId) {
      // Fallback redirect to login with error
      window.location.replace("/login?error=missing_google_client_id");
      return;
    }

    const redirectUri = `${window.location.origin}/api/auth/callback/google`;
    const scope = encodeURIComponent("openid email profile");
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    window.location.replace(googleAuthUrl);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 shadow-sm">
        <Loader2 className="size-7 animate-spin" />
      </div>
      <p className="mt-4 text-base font-semibold text-ink-900">
        Menghubungkan ke Google...
      </p>
      <p className="mt-1 text-xs text-ink-500">
        Anda akan diarahkan ke halaman login Google resmi.
      </p>
    </div>
  );
}
