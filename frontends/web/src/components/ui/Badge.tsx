import type { ReactNode } from "react";

type BadgeColor = "blue" | "red" | "green" | "yellow" | "gray" | "purple" | "cyan";

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
}

const colors: Record<BadgeColor, string> = {
  blue: "bg-blue-100 text-blue-800",
  red: "bg-red-100 text-red-800",
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  gray: "bg-gray-100 text-gray-800",
  purple: "bg-purple-100 text-purple-800",
  cyan: "bg-cyan-100 text-cyan-800",
} as const;

export default function Badge(props: BadgeProps) {
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${colors[props.color ?? 'blue']} ${props.className}`}>
    {props.children}
  </span>
}