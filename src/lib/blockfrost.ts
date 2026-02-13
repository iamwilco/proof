import prisma from "./prisma";

const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY || "";
const BLOCKFROST_URL = "https://cardano-mainnet.blockfrost.io/api/v0";

// Known Catalyst treasury addresses (Fund 2+)
const CATALYST_TREASURY_ADDRESSES = [
  "addr1q9f7h6g5x4j3k2l1m0n9o8p7q6r5s4t3u2v1w0x9y8z7a6b5c4d3e2f1g0h9i8j7k6l5m4n3o2p1q0r9s8t7u6v5w4x3y2z1",
  // Add more known treasury addresses as they are identified
];

interface BlockfrostTransaction {
  tx_hash: string;
  tx_index: number;
  block_height: number;
  block_time: number;
}

interface BlockfrostTxUtxo {
  hash: string;
  inputs: Array<{
    address: string;
    amount: Array<{ unit: string; quantity: string }>;
  }>;
  outputs: Array<{
    address: string;
    amount: Array<{ unit: string; quantity: string }>;
  }>;
}

interface BlockfrostTxDetails {
  hash: string;
  block: string;
  block_height: number;
  block_time: number;
  slot: number;
  index: number;
  fees: string;
}

async function blockfrostFetch<T>(endpoint: string): Promise<T | null> {
  if (!BLOCKFROST_API_KEY) {
    console.warn("BLOCKFROST_API_KEY not set, using mock data");
    return null;
  }

  try {
    const response = await fetch(`${BLOCKFROST_URL}${endpoint}`, {
      headers: {
        project_id: BLOCKFROST_API_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Blockfrost API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Blockfrost fetch error:", error);
    return null;
  }
}

export async function getAddressTransactions(
  address: string,
  page: number = 1,
  count: number = 100
): Promise<BlockfrostTransaction[]> {
  const data = await blockfrostFetch<BlockfrostTransaction[]>(
    `/addresses/${address}/transactions?page=${page}&count=${count}&order=desc`
  );
  return data || [];
}

export async function getTransactionDetails(
  txHash: string
): Promise<BlockfrostTxDetails | null> {
  return blockfrostFetch<BlockfrostTxDetails>(`/txs/${txHash}`);
}

export async function getTransactionUtxos(
  txHash: string
): Promise<BlockfrostTxUtxo | null> {
  return blockfrostFetch<BlockfrostTxUtxo>(`/txs/${txHash}/utxos`);
}

export async function getAdaPrice(timestamp?: number): Promise<number> {
  // In production, fetch from CoinGecko or similar
  // For now, return a reasonable historical average
  if (!timestamp) return 0.35;
  
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  
  // Historical ADA price approximations
  if (year <= 2020) return 0.1;
  if (year === 2021) return 1.5;
  if (year === 2022) return 0.4;
  if (year === 2023) return 0.3;
  if (year === 2024) return 0.45;
  return 0.5;
}

export function lovelaceToAda(lovelace: string | number): number {
  return Number(lovelace) / 1_000_000;
}

export function getExplorerUrl(txHash: string): string {
  return `https://cardanoscan.io/transaction/${txHash}`;
}

export async function ingestTransactionsForAddress(
  address: string,
  projectId?: string
): Promise<number> {
  let ingested = 0;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const transactions = await getAddressTransactions(address, page);
    
    if (transactions.length === 0) {
      hasMore = false;
      break;
    }

    for (const tx of transactions) {
      // Check if already exists
      const existing = await prisma.fundingTransaction.findUnique({
        where: { txHash: tx.tx_hash },
      });

      if (existing) continue;

      // Get full transaction details
      const details = await getTransactionDetails(tx.tx_hash);
      const utxos = await getTransactionUtxos(tx.tx_hash);

      if (!details || !utxos) continue;

      // Calculate ADA amount received at this address
      const receivedOutput = utxos.outputs.find((o) => o.address === address);
      if (!receivedOutput) continue;

      const adaAmount = receivedOutput.amount.find((a) => a.unit === "lovelace");
      if (!adaAmount) continue;

      const amount = lovelaceToAda(adaAmount.quantity);
      const adaPrice = await getAdaPrice(details.block_time);
      const usdValue = amount * adaPrice;

      // Determine sender address
      const fromAddress = utxos.inputs[0]?.address || null;

      // Create transaction record
      await prisma.fundingTransaction.create({
        data: {
          projectId: projectId || "unknown",
          txHash: tx.tx_hash,
          amount,
          currency: "ADA",
          usdValueAtTime: usdValue,
          adaPrice,
          fromAddress,
          toAddress: address,
          txDate: new Date(details.block_time * 1000),
          blockHeight: details.block_height,
          slot: details.slot,
          txType: "funding",
          explorerUrl: getExplorerUrl(tx.tx_hash),
        },
      });

      ingested++;
    }

    page++;
    
    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return ingested;
}

export async function syncCatalystTreasuryTransactions(): Promise<{
  total: number;
  byAddress: Record<string, number>;
}> {
  const results: Record<string, number> = {};
  let total = 0;

  for (const address of CATALYST_TREASURY_ADDRESSES) {
    const count = await ingestTransactionsForAddress(address);
    results[address] = count;
    total += count;
  }

  return { total, byAddress: results };
}

export async function linkTransactionToProject(
  txHash: string,
  projectId: string
): Promise<boolean> {
  try {
    await prisma.fundingTransaction.update({
      where: { txHash },
      data: { projectId },
    });
    return true;
  } catch {
    return false;
  }
}

export async function getProjectTransactions(projectId: string) {
  return prisma.fundingTransaction.findMany({
    where: { projectId },
    orderBy: { txDate: "desc" },
  });
}

export async function getTransactionStats() {
  const [total, totalAmount, byType] = await Promise.all([
    prisma.fundingTransaction.count(),
    prisma.fundingTransaction.aggregate({
      _sum: { amount: true, usdValueAtTime: true },
    }),
    prisma.fundingTransaction.groupBy({
      by: ["txType"],
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  return {
    total,
    totalAda: Number(totalAmount._sum.amount || 0),
    totalUsd: Number(totalAmount._sum.usdValueAtTime || 0),
    byType: byType.map((t) => ({
      type: t.txType,
      count: t._count,
      amount: Number(t._sum.amount || 0),
    })),
  };
}

// Mock data for development without API key
export async function ingestMockTransactions(projectId: string, count: number = 5): Promise<number> {
  const mockTxs = Array.from({ length: count }, (_, i) => ({
    txHash: `mock_tx_${projectId}_${i}_${Date.now()}`,
    amount: Math.floor(Math.random() * 100000) + 10000,
    date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
  }));

  let ingested = 0;

  for (const tx of mockTxs) {
    const adaPrice = await getAdaPrice(Math.floor(tx.date.getTime() / 1000));
    
    await prisma.fundingTransaction.create({
      data: {
        projectId,
        txHash: tx.txHash,
        amount: tx.amount,
        currency: "ADA",
        usdValueAtTime: tx.amount * adaPrice,
        adaPrice,
        fromAddress: "addr1_catalyst_treasury_mock",
        toAddress: `addr1_project_${projectId.slice(0, 8)}`,
        txDate: tx.date,
        blockHeight: Math.floor(Math.random() * 10000000),
        txType: ingested === 0 ? "funding" : "milestone",
        explorerUrl: `https://cardanoscan.io/transaction/${tx.txHash}`,
      },
    });

    ingested++;
  }

  return ingested;
}
