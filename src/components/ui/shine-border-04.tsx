import React, { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, ShoppingCart, Star } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================= */
/* ShineBorder (Meteor Beam)     */
/* ============================= */

export type ShineBorderProps = {
  children: ReactNode;
  className?: string;
  borderWidth?: number;
  duration?: number;
  color?: string;
  onClick?: () => void;
};

export const ShineBorder = ({
  children,
  className,
  borderWidth = 3,
  duration = 4,
  color = "var(--color-blue-500, #0ea5e9)",
  onClick,
}: ShineBorderProps) => {
  return (
    <>
      <style>{`
        @keyframes rotating-beam {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-rotating-beam {
          animation: rotating-beam var(--duration, 4s) linear infinite;
        }
      `}</style>
      <div
        onClick={onClick}
        className={cn(
          "relative rounded-2xl overflow-hidden border border-slate-200/80 bg-white",
          className,
        )}
        style={
          {
            padding: `${borderWidth}px`,
            "--bw": `${borderWidth}px`,
          } as React.CSSProperties
        }
      >
        {/* Animated Conic Beam (meteor effect) */}
        <div className="absolute inset-0 pointer-events-none z-0 select-none overflow-hidden">
          <div
            className="absolute left-1/2 top-1/2 h-[250%] w-[250%] animate-rotating-beam origin-center pointer-events-none select-none"
            style={
              {
                background: `conic-gradient(from 90deg, transparent 0%, transparent 60%, ${color} 100%)`,
                "--duration": `${duration}s`,
              } as React.CSSProperties
            }
          />
        </div>

        {/* Subtle static border */}
        <div className="absolute inset-0 rounded-2xl border border-slate-200/50 dark:border-border/50 pointer-events-none z-10" />

        {/* Content Layer with high z-index and explicit pointer-events-auto */}
        <div className="relative z-20 rounded-[calc(1rem-var(--bw))] bg-white dark:bg-card w-full h-full pointer-events-auto">
          {children}
        </div>
      </div>
    </>
  );
};

/* ============================= */
/* Stats / Achievement Card      */
/* ============================= */

const stats = [
  {
    icon: Users,
    label: "Total Users",
    value: "48,329",
    change: "+12.4%",
    positive: true,
  },
  {
    icon: ShoppingCart,
    label: "Orders Today",
    value: "1,284",
    change: "+8.1%",
    positive: true,
  },
  {
    icon: TrendingUp,
    label: "Revenue",
    value: "$92,840",
    change: "+21.7%",
    positive: true,
  },
];

export const StatsCard = () => {
  return (
    <Card className="relative h-full rounded-[inherit] border-0 ring-0 bg-transparent shadow-none">
      <CardHeader className="p-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <Badge className="mb-2 gap-1" variant="secondary">
              <Star className="size-3 fill-current" />
              Live Dashboard
            </Badge>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-foreground">
              Business Overview
            </h3>
            <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
              Real‑time metrics — updated every 30s
            </p>
          </div>
          <span className="size-2.5 rounded-full bg-teal-400 animate-pulse" />
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-4 flex flex-col gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-muted/50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-sky-100 text-sky-600 dark:bg-primary/10 flex items-center justify-center">
                <stat.icon className="size-4 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-muted-foreground">{stat.label}</p>
                <p className="text-base font-bold text-slate-900 dark:text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "text-xs font-semibold px-2 py-1 rounded-full",
                stat.positive
                  ? "text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-400/10"
                  : "text-red-500 bg-red-50 dark:bg-red-500/10",
              )}
            >
              {stat.change}
            </span>
          </div>
        ))}

        <Button className="w-full mt-2 h-10 gap-2">
          <TrendingUp className="size-4" />
          View Full Report
        </Button>
      </CardContent>
    </Card>
  );
};

/* ============================= */
/* Demo */
/* ============================= */

export default function ShineBorderDemo() {
  return (
    <ShineBorder
      borderWidth={3}
      duration={3}
      color="var(--color-blue-500, #0ea5e9)"
      className="w-full max-w-sm"
    >
      <StatsCard />
    </ShineBorder>
  );
}
