import prisma from "./prisma";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

interface PriceCache {
  price: number;
  timestamp: number;
}

// In-memory price cache (5-minute TTL)
let currentPriceCache: PriceCache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Historical daily prices cache
const historicalPriceCache: Map<string, number> = new Map();

export async function getCurrentAdaPrice(): Promise<number> {
  // Check cache
  if (currentPriceCache && Date.now() - currentPriceCache.timestamp < CACHE_TTL) {
    return currentPriceCache.price;
  }

  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=cardano&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data.cardano?.usd || 0.5;

    currentPriceCache = { price, timestamp: Date.now() };
    return price;
  } catch (error) {
    console.error("Failed to fetch current ADA price:", error);
    // Return last cached price or fallback
    return currentPriceCache?.price || 0.5;
  }
}

export async function getHistoricalAdaPrice(date: Date): Promise<number> {
  const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

  // Check cache
  if (historicalPriceCache.has(dateKey)) {
    return historicalPriceCache.get(dateKey)!;
  }

  try {
    const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/cardano/history?date=${formattedDate}`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data.market_data?.current_price?.usd || getEstimatedPrice(date);

    historicalPriceCache.set(dateKey, price);
    return price;
  } catch (error) {
    console.error("Failed to fetch historical ADA price:", error);
    return getEstimatedPrice(date);
  }
}

// Historical ADA price approximations by period
const priceHistory: Record<string, number> = {
  "2019": 0.04,
  "2020-H1": 0.05,
  "2020-H2": 0.12,
  "2021-Q1": 1.20,
  "2021-Q2": 1.50,
  "2021-Q3": 2.50,
  "2021-Q4": 1.40,
  "2022-Q1": 1.00,
  "2022-Q2": 0.50,
  "2022-Q3": 0.45,
  "2022-Q4": 0.30,
  "2023-Q1": 0.35,
  "2023-Q2": 0.30,
  "2023-Q3": 0.25,
  "2023-Q4": 0.40,
  "2024-Q1": 0.60,
  "2024-Q2": 0.45,
  "2024-Q3": 0.35,
  "2024-Q4": 0.50,
  "2025": 0.55,
  "2026": 0.60,
};

// Estimated ADA prices by Catalyst fund number (approximate time of funding)
const fundPrices: Record<number, number> = {
  1: 0.10,   // Fund 1 - late 2020
  2: 0.15,   // Fund 2 - early 2021
  3: 1.20,   // Fund 3 - Q1 2021
  4: 1.40,   // Fund 4 - Q2 2021
  5: 2.00,   // Fund 5 - Q3 2021
  6: 1.80,   // Fund 6 - Q3 2021
  7: 1.30,   // Fund 7 - Q4 2021
  8: 1.00,   // Fund 8 - Q1 2022
  9: 0.50,   // Fund 9 - Q2 2022
  10: 0.35,  // Fund 10 - Q3 2022
  11: 0.30,  // Fund 11 - Q4 2022
  12: 0.35,  // Fund 12 - Q1 2023
  13: 0.30,  // Fund 13 - Q2-Q3 2023
  14: 0.40,  // Fund 14 - Q4 2023
};

// Get estimated ADA price for a specific fund number
export function getEstimatedPriceForFund(fundNumber: number): number {
  return fundPrices[fundNumber] || 0.50;
}

// Fallback price estimation based on historical data
export function getEstimatedPrice(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (year <= 2019) return priceHistory["2019"];
  if (year >= 2025) return priceHistory[`${year}`] || 0.55;

  const quarter = Math.floor(month / 3) + 1;
  const halfYear = month < 6 ? "H1" : "H2";

  // Try quarter first, then half year, then full year
  const quarterKey = `${year}-Q${quarter}`;
  const halfYearKey = `${year}-${halfYear}`;

  return priceHistory[quarterKey] || priceHistory[halfYearKey] || priceHistory[`${year}`] || 0.5;
}

export function adaToUsd(adaAmount: number, usdPrice: number): number {
  return adaAmount * usdPrice;
}

export function usdToAda(usdAmount: number, usdPrice: number): number {
  if (usdPrice === 0) return 0;
  return usdAmount / usdPrice;
}

export function formatUsd(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(2)}`;
}

export function formatAda(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M ₳`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K ₳`;
  }
  return `${amount.toLocaleString()} ₳`;
}

export async function updateTransactionUsdValues(projectId?: string): Promise<number> {
  const where = projectId ? { projectId, usdValueAtTime: null } : { usdValueAtTime: null };
  
  const transactions = await prisma.fundingTransaction.findMany({
    where,
    select: { id: true, amount: true, txDate: true },
  });

  let updated = 0;

  for (const tx of transactions) {
    const price = await getHistoricalAdaPrice(tx.txDate);
    const usdValue = Number(tx.amount) * price;

    await prisma.fundingTransaction.update({
      where: { id: tx.id },
      data: {
        usdValueAtTime: usdValue,
        adaPrice: price,
      },
    });

    updated++;

    // Rate limit to avoid API throttling
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return updated;
}

export async function getProjectFundingInUsd(projectId: string): Promise<{
  totalAda: number;
  totalUsd: number;
  currentUsdValue: number;
  transactions: Array<{
    txHash: string;
    amount: number;
    usdAtTime: number;
    currentUsd: number;
    date: Date;
  }>;
}> {
  const transactions = await prisma.fundingTransaction.findMany({
    where: { projectId },
    orderBy: { txDate: "desc" },
  });

  const currentPrice = await getCurrentAdaPrice();
  
  let totalAda = 0;
  let totalUsd = 0;

  const txDetails = transactions.map((tx) => {
    const amount = Number(tx.amount);
    const usdAtTime = Number(tx.usdValueAtTime || 0);
    const currentUsd = amount * currentPrice;

    totalAda += amount;
    totalUsd += usdAtTime;

    return {
      txHash: tx.txHash,
      amount,
      usdAtTime,
      currentUsd,
      date: tx.txDate,
    };
  });

  return {
    totalAda,
    totalUsd,
    currentUsdValue: totalAda * currentPrice,
    transactions: txDetails,
  };
}

export async function getFundTotalFunding(fundId: string): Promise<{
  totalAda: number;
  totalUsdAtTime: number;
  currentUsdValue: number;
  projectCount: number;
}> {
  const projects = await prisma.project.findMany({
    where: { fundId },
    select: { id: true },
  });

  const projectIds = projects.map((p) => p.id);

  const aggregation = await prisma.fundingTransaction.aggregate({
    where: { projectId: { in: projectIds } },
    _sum: { amount: true, usdValueAtTime: true },
  });

  const totalAda = Number(aggregation._sum.amount || 0);
  const totalUsdAtTime = Number(aggregation._sum.usdValueAtTime || 0);
  const currentPrice = await getCurrentAdaPrice();

  return {
    totalAda,
    totalUsdAtTime,
    currentUsdValue: totalAda * currentPrice,
    projectCount: projectIds.length,
  };
}

export async function getPriceStats(): Promise<{
  currentPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
}> {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/cardano?localization=false&tickers=false&community_data=false&developer_data=false`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      currentPrice: data.market_data?.current_price?.usd || 0.5,
      change24h: data.market_data?.price_change_percentage_24h || 0,
      high24h: data.market_data?.high_24h?.usd || 0,
      low24h: data.market_data?.low_24h?.usd || 0,
    };
  } catch (error) {
    console.error("Failed to fetch price stats:", error);
    return {
      currentPrice: currentPriceCache?.price || 0.5,
      change24h: 0,
      high24h: 0,
      low24h: 0,
    };
  }
}
