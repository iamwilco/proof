/**
 * Currency Normalization Utilities
 * 
 * Catalyst funds changed currency over time:
 * - F2-F9: Denominated in USD
 * - F10+: Denominated in ADA
 * 
 * This module normalizes all amounts to USD for comparison.
 */

// Default ADA/USD rate - can be overridden via environment variable
// Historical average around F10-F15 period
const DEFAULT_ADA_USD_RATE = 0.35;

/**
 * Get the current ADA to USD conversion rate
 * Uses environment variable if set, otherwise falls back to default
 */
export function getAdaUsdRate(): number {
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
  
  // Convert ADA to USD
  const rate = getAdaUsdRate();
  return amount * rate;
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
export function getNormalizationInfo(): {
  rate: number;
  source: string;
  note: string;
} {
  const envRate = process.env.ADA_USD_RATE;
  return {
    rate: getAdaUsdRate(),
    source: envRate ? "environment" : "default",
    note: "F2-F9 amounts are in USD. F10+ amounts are in ADA, converted at the displayed rate.",
  };
}
