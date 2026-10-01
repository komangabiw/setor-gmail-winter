"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ReferralPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/profil");
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2 className="size-7 animate-spin text-sky-600" />
    </div>
  );
}
