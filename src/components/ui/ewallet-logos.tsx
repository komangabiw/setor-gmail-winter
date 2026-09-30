"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type EWalletMethod = "DANA" | "OVO" | "GOPAY" | "SHOPEEPAY";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Official DANA Logo (Biru #118EEA + Ikon DANA resmi)
 */
export function DanaLogo({ className, size = "md" }: LogoProps) {
  const sizeMap = {
    sm: "h-5 w-auto",
    md: "h-7 w-auto",
    lg: "h-9 w-auto",
  };

  return (
    <svg
      viewBox="0 0 120 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeMap[size], className)}
      aria-label="Logo DANA"
    >
      <rect width="120" height="36" rx="8" fill="#118EEA" />
      {/* Official DANA Monogram + Wordmark */}
      <g fill="#FFFFFF">
        {/* D icon symbol */}
        <path
          d="M12 9.5C12 8.67 12.67 8 13.5 8H20.5C25.2 8 28.5 11.3 28.5 18C28.5 24.7 25.2 28 20.5 28H13.5C12.67 28 12 27.33 12 26.5V9.5ZM16.5 24.2H20.3C23.2 24.2 24.8 21.8 24.8 18C24.8 14.2 23.2 11.8 20.3 11.8H16.5V24.2Z"
        />
        {/* D letter */}
        <path d="M37.5 11.5H41.8C45.2 11.5 47.5 13.8 47.5 18C47.5 22.2 45.2 24.5 41.8 24.5H37.5V11.5ZM40.5 22.2H41.7C43.5 22.2 44.5 20.7 44.5 18C44.5 15.3 43.5 13.8 41.7 13.8H40.5V22.2Z" />
        {/* A letter */}
        <path d="M57.8 24.5L56.9 22H52.5L51.6 24.5H48.5L53.2 11.5H56.2L60.9 24.5H57.8ZM54.7 15.4L53.4 19.8H56L54.7 15.4Z" />
        {/* N letter */}
        <path d="M64.5 11.5H67.5L72.2 19.2V11.5H75.2V24.5H72.2L67.5 16.8V24.5H64.5V11.5Z" />
        {/* A letter */}
        <path d="M85.8 24.5L84.9 22H80.5L79.6 24.5H76.5L81.2 11.5H84.2L88.9 24.5H85.8ZM82.7 15.4L81.4 19.8H84L82.7 15.4Z" />
      </g>
    </svg>
  );
}

/**
 * Official OVO Logo (Ungu #4C3494 + Tulisan OVO resmi)
 */
export function OvoLogo({ className, size = "md" }: LogoProps) {
  const sizeMap = {
    sm: "h-5 w-auto",
    md: "h-7 w-auto",
    lg: "h-9 w-auto",
  };

  return (
    <svg
      viewBox="0 0 120 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeMap[size], className)}
      aria-label="Logo OVO"
    >
      <rect width="120" height="36" rx="8" fill="#4C3494" />
      {/* OVO official typography with concentric rings */}
      <g fill="#FFFFFF">
        {/* First O */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24 10C19.58 10 16 13.58 16 18C16 22.42 19.58 26 24 26C28.42 26 32 22.42 32 18C32 13.58 28.42 10 24 10ZM24 13.8C26.32 13.8 28.2 15.68 28.2 18C28.2 20.32 26.32 22.2 24 22.2C21.68 22.2 19.8 20.32 19.8 18C19.8 15.68 21.68 13.8 24 13.8Z"
        />
        {/* V letter */}
        <path d="M42.5 10.5H38.5L46 25.5H49L56.5 10.5H52.5L47.5 21L42.5 10.5Z" />
        {/* Second O */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M71 10C66.58 10 63 13.58 63 18C63 22.42 66.58 26 71 26C75.42 26 79 22.42 79 18C79 13.58 75.42 10 71 10ZM71 13.8C73.32 13.8 75.2 15.68 75.2 18C75.2 20.32 73.32 22.2 71 22.2C68.68 22.2 66.8 20.32 66.8 18C66.8 15.68 68.68 13.8 71 13.8Z"
        />
      </g>
      {/* Inner cyan-purple dot of OVO */}
      <circle cx="98" cy="18" r="4.5" fill="#00D2B4" />
      <circle cx="98" cy="18" r="2.2" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Official GoPay Logo (Biru-Toska #00AED6 + gopay wordmark)
 */
export function GopayLogo({ className, size = "md" }: LogoProps) {
  const sizeMap = {
    sm: "h-5 w-auto",
    md: "h-7 w-auto",
    lg: "h-9 w-auto",
  };

  return (
    <svg
      viewBox="0 0 120 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeMap[size], className)}
      aria-label="Logo GoPay"
    >
      <rect width="120" height="36" rx="8" fill="#00AED6" />
      {/* GoPay circular icon mark */}
      <g>
        <circle cx="21" cy="18" r="9" fill="#FFFFFF" />
        <circle cx="21" cy="18" r="5" fill="#00AED6" />
        <circle cx="21" cy="18" r="2.2" fill="#FFFFFF" />
      </g>
      {/* Official "gopay" typography */}
      <g fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800">
        {/* g */}
        <path d="M40.5 16.5C40.5 14.2 42.2 12.5 44.8 12.5C47.2 12.5 48.8 14 48.8 16.2V22.5C48.8 25.2 46.8 26.8 44 26.8C42 26.8 40.5 25.8 40 24.5L42.2 23.5C42.5 24.3 43.2 24.8 44.2 24.8C45.5 24.8 46.4 24 46.4 22.6V21.5C45.8 22.3 44.8 22.7 43.8 22.7C41.6 22.7 40.5 21 40.5 18.8V16.5ZM46.4 17.5V16.5C46.4 15.2 45.6 14.5 44.6 14.5C43.5 14.5 42.8 15.3 42.8 16.6C42.8 18 43.6 18.8 44.7 18.8C45.7 18.8 46.4 18.1 46.4 17.5Z" />
        {/* o */}
        <path d="M56 12.5C59 12.5 61.2 14.7 61.2 17.6C61.2 20.5 59 22.7 56 22.7C53 22.7 50.8 20.5 50.8 17.6C50.8 14.7 53 12.5 56 12.5ZM56 14.5C54.3 14.5 53.2 15.8 53.2 17.6C53.2 19.4 54.3 20.7 56 20.7C57.7 20.7 58.8 19.4 58.8 17.6C58.8 15.8 57.7 14.5 56 14.5Z" />
        {/* p */}
        <path d="M64 12.8H66.2V14.2C66.8 13.2 68 12.5 69.5 12.5C72 12.5 73.8 14.5 73.8 17.6C73.8 20.7 72 22.7 69.5 22.7C68 22.7 66.8 22 66.2 21V26.5H64V12.8ZM68.8 14.5C67.4 14.5 66.3 15.7 66.3 17.6C66.3 19.5 67.4 20.7 68.8 20.7C70.3 20.7 71.4 19.4 71.4 17.6C71.4 15.8 70.3 14.5 68.8 14.5Z" />
        {/* a */}
        <path d="M80.5 15.8C80.5 14.8 79.7 14.2 78.5 14.2C77.4 14.2 76.6 14.8 76.4 15.6L74.4 15.2C74.8 13.6 76.4 12.5 78.5 12.5C81.2 12.5 82.8 13.8 82.8 16.2V22.5H80.6V21.2C80 22.2 78.8 22.7 77.6 22.7C75.6 22.7 74.2 21.5 74.2 19.6C74.2 17.6 75.8 16.5 78 16.5H80.5V15.8ZM80.5 18.2H78.2C77.1 18.2 76.4 18.8 76.4 19.6C76.4 20.4 77.1 21 78.2 21C79.6 21 80.5 20.1 80.5 18.9V18.2Z" />
        {/* y */}
        <path d="M85 12.8H87.3L89.8 19.2L92.2 12.8H94.5L90.5 23.2C89.5 25.8 88.2 26.6 86.2 26.6H85.2V24.8H86C87.2 24.8 87.8 24.2 88.4 22.6L85 12.8Z" />
      </g>
    </svg>
  );
}

/**
 * Official ShopeePay Logo (Merah-Oranye #EE4D2D + Tas Shopee & Tulisan ShopeePay)
 */
export function ShopeepayLogo({ className, size = "md" }: LogoProps) {
  const sizeMap = {
    sm: "h-5 w-auto",
    md: "h-7 w-auto",
    lg: "h-9 w-auto",
  };

  return (
    <svg
      viewBox="0 0 120 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeMap[size], className)}
      aria-label="Logo ShopeePay"
    >
      <rect width="120" height="36" rx="8" fill="#EE4D2D" />
      {/* Shopee bag emblem */}
      <g fill="#FFFFFF">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M17.5 10C17.5 8.34 18.84 7 20.5 7C22.16 7 23.5 8.34 23.5 10H25.5C25.5 7.24 23.26 5 20.5 5C17.74 5 15.5 7.24 15.5 10H17.5Z"
        />
        <path
          d="M13.2 11.2C13.08 11.2 13 11.3 13 11.42L14.2 26.2C14.28 27.2 15.1 28 16.1 28H24.9C25.9 28 26.72 27.2 26.8 26.2L28 11.42C28 11.3 27.92 11.2 27.8 11.2H13.2Z"
        />
        {/* S shape on bag */}
        <path
          d="M21.5 16.5C21.5 15.8 20.9 15.2 20.2 15.2H19.5C18.8 15.2 18.2 15.8 18.2 16.5C18.2 17.2 18.8 17.8 19.5 17.8H21C22 17.8 22.8 18.6 22.8 19.6C22.8 20.6 22 21.4 21 21.4H19.2C18.2 21.4 17.4 20.6 17.4 19.6H18.8C18.8 20.1 19.2 20.4 19.7 20.4H20.5C21 20.4 21.4 20 21.4 19.5C21.4 19 21 18.6 20.5 18.6H19C18 18.6 17.2 17.8 17.2 16.8C17.2 15.8 18 15 19 15H20.8C21.8 15 22.6 15.8 22.6 16.8H21.5Z"
          fill="#EE4D2D"
        />
      </g>
      {/* ShopeePay Text */}
      <g fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800">
        <text x="32" y="23" fontSize="13.5" letterSpacing="-0.3">
          Shopee<tspan fill="#FFF176">Pay</tspan>
        </text>
      </g>
    </svg>
  );
}

/**
 * Bendera Merah Putih Indonesia
 */
export function IndonesiaFlag({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={cn("rounded-[2px] shadow-2xs overflow-hidden border border-slate-300/80 shrink-0", className)}
      aria-label="Bendera Indonesia"
    >
      <rect width="24" height="8" fill="#E70011" />
      <rect y="8" width="24" height="8" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Urutan resmi E-Wallet: Dana -> ShopeePay -> GoPay -> OVO
 */
export const EWALLET_ORDER: EWalletMethod[] = [
  "DANA",
  "SHOPEEPAY",
  "GOPAY",
  "OVO",
];

/**
 * Metadata configuration for each supported E-Wallet
 */
export const EWALLET_CONFIGS: Record<
  EWalletMethod,
  {
    id: EWalletMethod;
    name: string;
    taxFee: number;
    feeLabel: string;
    hasTax: boolean;
    brandColor: string;
    textColor: string;
    bgSelected: string;
    activeClass: string;
    inactiveClass: string;
    bgHover: string;
    bgActive: string;
    borderActive: string;
    placeholder: string;
    description: string;
    Logo: React.ComponentType<LogoProps>;
  }
> = {
  DANA: {
    id: "DANA",
    name: "DANA",
    taxFee: 0,
    feeLabel: "Bebas Biaya Admin",
    hasTax: false,
    brandColor: "#118EEA",
    textColor: "text-[#118EEA]",
    bgSelected: "bg-[#118EEA] text-white border-[#118EEA] shadow-md ring-2 ring-sky-300",
    activeClass: "bg-[#118EEA] text-white border-[#118EEA] shadow-md ring-2 ring-sky-300 font-bold",
    inactiveClass: "bg-[#118EEA]/15 text-[#0b7bc9] border-[#118EEA]/30 hover:bg-[#118EEA]/25 font-semibold",
    bgHover: "hover:border-sky-300 hover:bg-sky-50/50",
    bgActive: "border-sky-500 bg-sky-50/70 ring-2 ring-sky-300",
    borderActive: "border-sky-500",
    placeholder: "08xxxxxxxxxx (Nomor Akun DANA)",
    description: "Tarik saldo instan ke akun DANA kamu.",
    Logo: DanaLogo,
  },
  SHOPEEPAY: {
    id: "SHOPEEPAY",
    name: "ShopeePay",
    taxFee: 0,
    feeLabel: "Bebas Biaya Admin",
    hasTax: false,
    brandColor: "#EE4D2D",
    textColor: "text-[#EE4D2D]",
    bgSelected: "bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-md ring-2 ring-orange-300",
    activeClass: "bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-md ring-2 ring-orange-300 font-bold",
    inactiveClass: "bg-[#EE4D2D]/15 text-[#d93817] border-[#EE4D2D]/30 hover:bg-[#EE4D2D]/25 font-semibold",
    bgHover: "hover:border-orange-300 hover:bg-orange-50/50",
    bgActive: "border-orange-500 bg-orange-50/70 ring-2 ring-orange-300",
    borderActive: "border-orange-500",
    placeholder: "08xxxxxxxxxx (Nomor Akun ShopeePay)",
    description: "Tarik saldo instan ke akun ShopeePay kamu.",
    Logo: ShopeepayLogo,
  },
  GOPAY: {
    id: "GOPAY",
    name: "GoPay",
    taxFee: 1000,
    feeLabel: "Pajak Transfer Rp 1.000",
    hasTax: true,
    brandColor: "#00AED6",
    textColor: "text-[#0089a8]",
    bgSelected: "bg-[#00AED6] text-white border-[#00AED6] shadow-md ring-2 ring-cyan-300",
    activeClass: "bg-[#00AED6] text-white border-[#00AED6] shadow-md ring-2 ring-cyan-300 font-bold",
    inactiveClass: "bg-[#00AED6]/15 text-[#0087a6] border-[#00AED6]/30 hover:bg-[#00AED6]/25 font-semibold",
    bgHover: "hover:border-cyan-300 hover:bg-cyan-50/50",
    bgActive: "border-cyan-500 bg-cyan-50/70 ring-2 ring-cyan-300",
    borderActive: "border-cyan-500",
    placeholder: "08xxxxxxxxxx (Nomor Akun GoPay)",
    description: "Tarik saldo instan ke akun GoPay kamu (pajak transfer Rp 1.000).",
    Logo: GopayLogo,
  },
  OVO: {
    id: "OVO",
    name: "OVO",
    taxFee: 1000,
    feeLabel: "Pajak Transfer Rp 1.000",
    hasTax: true,
    brandColor: "#4C3494",
    textColor: "text-[#4C3494]",
    bgSelected: "bg-[#4C3494] text-white border-[#4C3494] shadow-md ring-2 ring-purple-300",
    activeClass: "bg-[#4C3494] text-white border-[#4C3494] shadow-md ring-2 ring-purple-300 font-bold",
    inactiveClass: "bg-[#4C3494]/15 text-[#4C3494] border-[#4C3494]/30 hover:bg-[#4C3494]/25 font-semibold",
    bgHover: "hover:border-purple-300 hover:bg-purple-50/50",
    bgActive: "border-purple-600 bg-purple-50/70 ring-2 ring-purple-300",
    borderActive: "border-purple-600",
    placeholder: "08xxxxxxxxxx (Nomor Akun OVO)",
    description: "Tarik saldo instan ke akun OVO kamu (pajak transfer Rp 1.000).",
    Logo: OvoLogo,
  },
};
