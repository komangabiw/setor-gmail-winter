"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GradientBlobCardProps {
  children?: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
  fullScreen?: boolean;
}

export const GradientBlobCard: React.FC<GradientBlobCardProps> = ({
  children,
  className,
  wrapperClassName,
  fullScreen = false,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen ? "min-h-screen" : "py-4",
        wrapperClassName
      )}
    >
      <div
        className={cn(
          "relative w-[220px] sm:w-[240px] h-[260px] sm:h-[280px] rounded-[14px] flex flex-col items-center justify-center",
          "shadow-[16px_16px_40px_#e2e8f0,-16px_-16px_40px_#ffffff] dark:shadow-[20px_20px_60px_#111,-20px_-20px_60px_#222]",
          "overflow-hidden transition-all duration-300",
          className
        )}
      >
        {/* Glassy Background Container */}
        <div className="absolute inset-[5px] bg-white/95 dark:bg-black/70 backdrop-blur-[24px] rounded-[10px] outline outline-2 outline-white dark:outline-gray-700 z-10 flex flex-col items-center justify-center p-4">
          {children ? (
            children
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Gradient Blob Card
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Setor Gmail Component
              </span>
            </div>
          )}
        </div>

        {/* Animated Gradient Blob (same bold colors for light & dark mode) */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 w-[150px] h-[150px] rounded-full opacity-100 filter blur-[12px] z-0 animate-blob bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 pointer-events-none"
        />

        {/* Inline keyframes animation */}
        <style jsx>{`
          @keyframes blob {
            0% {
              transform: translate(-100%, -100%);
            }
            25% {
              transform: translate(0%, -100%);
            }
            50% {
              transform: translate(0%, 0%);
            }
            75% {
              transform: translate(-100%, 0%);
            }
            100% {
              transform: translate(-100%, -100%);
            }
          }

          .animate-blob {
            animation: blob 5s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

export default GradientBlobCard;
