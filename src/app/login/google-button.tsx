"use client";

import * as React from "react";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "737775499762-ith3o3248k9g59mt9jisgvh9qgljg7ia.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number;
              locale?: string;
            }
          ) => void;
          prompt: (momentListener?: (moment: any) => void) => void;
        };
      };
    };
  }
}

interface GoogleButtonProps {
  onSuccess: (credential: string) => void;
  onFallbackClick?: () => void;
  isLoading?: boolean;
}

export function GoogleButton({
  onSuccess,
  onFallbackClick,
  isLoading = false,
}: GoogleButtonProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isGsiReady, setIsGsiReady] = React.useState(false);
  const onSuccessRef = React.useRef(onSuccess);
  const onFallbackClickRef = React.useRef(onFallbackClick);

  React.useEffect(() => {
    onSuccessRef.current = onSuccess;
    onFallbackClickRef.current = onFallbackClick;
  });

  React.useEffect(() => {
    let isMounted = true;

    const loadGsi = () => {
      if (typeof window === "undefined") return;

      const initAndRender = () => {
        if (!isMounted || !window.google?.accounts?.id || !containerRef.current) {
          return;
        }

        // Avoid re-rendering if already rendered inside container
        if (containerRef.current.childElementCount > 0 && isGsiReady) {
          return;
        }

        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
              if (response?.credential) {
                onSuccessRef.current(response.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          const width = containerRef.current.clientWidth || 360;
          const targetWidth = Math.min(Math.max(width, 240), 400);

          containerRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(containerRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "pill",
            logo_alignment: "left",
            width: targetWidth,
          });

          setIsGsiReady(true);

          try {
            window.google.accounts.id.prompt();
          } catch {}
        } catch (err) {
          console.warn("GSI initialization error:", err);
        }
      };

      if (window.google?.accounts?.id) {
        initAndRender();
        return;
      }

      const existingScript = document.getElementById("google-gsi-script");
      if (existingScript) {
        existingScript.addEventListener("load", initAndRender);
        return;
      }

      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initAndRender;
      script.onerror = () => {
        console.warn("Failed to load Google Identity Services script");
      };
      document.body.appendChild(script);
    };

    loadGsi();

    return () => {
      isMounted = false;
    };
  }, []); // Run once on mount!

  const handleCustomClick = () => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
        return;
      } catch {}
    }
    if (onFallbackClickRef.current) {
      onFallbackClickRef.current();
    }
  };

  return (
    <div className="relative h-11 min-h-[44px] w-full flex items-center justify-center">
      {/* Official Google Identity Services button container */}
      <div
        ref={containerRef}
        className="w-full flex justify-center [&>div]:!mx-auto"
      />

      {/* Fallback button shown when GSI is loading or unavailable */}
      {!isGsiReady && (
        <button
          type="button"
          onClick={handleCustomClick}
          disabled={isLoading}
          className="absolute inset-0 flex h-11 w-full items-center justify-center gap-3 rounded-full border border-zinc-700 bg-zinc-900/90 text-sm font-semibold text-zinc-100 shadow-sm transition hover:bg-zinc-800 hover:border-zinc-600 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
        >
          <GoogleMark />
          <span>{isLoading ? "Menghubungkan..." : "Lanjutkan dengan Google"}</span>
        </button>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29a7.2 7.2 0 0 1 0-4.58V6.61H1.28a12 12 0 0 0 0 10.78l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}
