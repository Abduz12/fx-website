import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMarketMultiplier(market: string): number {
  if (market === "XAUUSD") return 100;
  if (["NAS100", "US30", "BTCUSD", "ETHUSD"].includes(market)) return 1;
  if (market.includes("JPY")) return 1000;
  return 100000; // Default for standard forex pairs
}
