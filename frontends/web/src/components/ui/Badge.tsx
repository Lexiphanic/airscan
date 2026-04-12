import type { ReactNode } from "react";

type BadgeColor = "blue" | "red" | "green" | "yellow" | "gray" | "purple" | "cyan";

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
}

const colors: Record<BadgeColor, string> = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  yellow: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  gray: "bg-slate-700/30 text-slate-400 border-slate-600/30",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
} as const;

export default function Badge(props: BadgeProps) {
  return <span className={`px-2 py-0.5 text-xs font-mono rounded border ${colors[props.color ?? 'blue']} ${props.className}`}>
    {props.children}
  </span>
}