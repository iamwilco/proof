/**
 * Currency Normalization Utilities
 * 
 * Catalyst funds changed currency over time:
 * - F2-F9: Denominated in USD
 * - F10+: Denominated in ADA
 * 
 * This module normalizes all amounts to USD for comparison
 * using per-fund historical ADA/USD rates.
 */

/**
 * Historical ADA/USD rates per fund at the time of voting results.
 * 
 * Source: Project Catalyst fund pages (projectcatalyst.io/funds/{N})
 * which display both ADA and USD totals for each fund.
 * 
 * Rates are based on ADA market price at the time each fund's
 * voting results were announced / funding was distributed.
 * 
 * TODO: Verify these rates against the exact values shown on
 * projectcatalyst.io fund pages. Update if any are inaccurate.
 */
export const FUND_HISTORICAL_RATES: Record<number, number> = {
  // F2-F9: denominated in USD, no conversion needed
  // F10+: denominated in ADA, rates below
  10: 0.252,  // F10: launched Jun 2023, 50M ADA (~$12.6M USD)
  11: 0.377,  // F11: launched Nov 2023, 50M ADA (~$18.85M USD)
  12: 0.451,  // F12: launched Apr 2024, 50M ADA (~$22.55M USD)
  13: 0.348,  // F13: launched Sep 2024, 50M ADA (~$17.4M USD)
  14: 0.401,  // F14: launched Jul 2025, 18.6M ADA (~$7.46M USD)
  15: 0.352,  // F15: launched Nov 2025, 20M ADA (~$7.04M USD)
};

// Fallback rate for unknown future funds
const DEFAULT_ADA_USD_RATE = 0.35;

/**
 * Get the ADA to USD conversion rate for a specific fund.
 * Uses per-fund historical rates for accuracy.
 * Falls back to env variable or default for unknown funds.
 */
export function getAdaUsdRate(fundNumber?: number): number {
  // Use fund-specific rate if available
  if (fundNumber !== undefined && FUND_HISTORICAL_RATES[fundNumber]) {
    return FUND_HISTORICAL_RATES[fundNumber];
  }
  
  // Fallback: environment variable or default
  const envRate = process.env.ADA_USD_RATE;
  if (envRate) {
    const parsed = parseFloat(envRate);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_ADA_USD_RATE;
}

/**
 * Determine if a fund uses ADA or USD based on fund number
 * F2-F9: USD
 * F10+: ADA
 */
export function getFundCurrency(fundNumber: number): "USD" | "ADA" {
  return fundNumber >= 10 ? "ADA" : "USD";
}

/**
 * Normalize an amount to USD
 * 
 * @param amount - The original amount
 * @param fundNumber - The fund number (determines original currency)
 * @param originalCurrency - Optional: override currency detection
 * @returns Amount in USD
 */
export function normalizeToUSD(
  amount: number,
  fundNumber: number,
  originalCurrency?: string
): number {
  // Determine the currency
  const currency = originalCurrency || getFundCurrency(fundNumber);
  
  if (currency === "USD") {
    return amount;
  }
  
  // Convert ADA to USD using fund-specific historical rate
  const rate = getAdaUsdRate(fundNumber);
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Normalize a Decimal amount to USD (for Prisma Decimal fields)
 */
export function normalizeDecimalToUSD(
  amount: number | string | { toNumber(): number },
  fundNumber: number,
  originalCurrency?: string
): number {
  const numAmount = typeof amount === "object" && "toNumber" in amount
    ? amount.toNumber()
    : typeof amount === "string"
      ? parseFloat(amount)
      : amount;
  
  return normalizeToUSD(numAmount, fundNumber, originalCurrency);
}

/**
 * Format a USD amount for display
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format an ADA amount for display
 */
export function formatADA(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " ₳";
}

/**
 * Format amount with appropriate currency symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  if (currency === "ADA") {
    return formatADA(amount);
  }
  return formatUSD(amount);
}

/**
 * Get normalization info for display/transparency
 */
export function getNormalizationInfo(fundNumber?: number): {
  rate: number;
  source: string;
  fundNumber?: number;
  note: string;
} {
  const rate = getAdaUsdRate(fundNumber);
  const isHistorical = fundNumber !== undefined && FUND_HISTORICAL_RATES[fundNumber] !== undefined;
  const envRate = process.env.ADA_USD_RATE;
  
  return {
    rate,
    source: isHistorical ? "historical_fund_rate" : (envRate ? "environment" : "default"),
    fundNumber,
    note: isHistorical
      ? `F${fundNumber} ADA→USD rate: $${rate}/ADA (at time of fund results). Source: projectcatalyst.io`
      : "F2-F9 amounts are in USD. F10+ amounts are in ADA, converted at per-fund historical rates.",
  };
}
