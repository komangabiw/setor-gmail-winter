"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function GoogleCallbackClientFallback() {
  const router = useRouter();

  React.useEffect(() => {
    // If reached on client (e.g. static host or local dev), forward query params to /auth/callback
    const search = window.location.search;
    router.replace(`/auth/callback${search}`);
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 shadow-sm">
        <Loader2 className="size-7 animate-spin" />
      </div>
      <p className="mt-4 text-base font-semibold text-ink-900">
        Memproses callback Google...
      </p>
      <p className="mt-1 text-xs text-ink-500">
        Mohon tunggu sebentar, Anda akan dialihkan...
      </p>
    </div>
  );
}
