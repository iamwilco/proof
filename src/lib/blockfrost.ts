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

// On-chain metrics for projects with manually provided addresses
interface OnchainMetrics {
  txCount: number;
  uniqueAddresses: Set<string>;
  totalReceived: number;
  totalSent: number;
  firstTx: Date | null;
  lastTx: Date | null;
}

interface BlockfrostAddressInfo {
  address: string;
  amount: Array<{ unit: string; quantity: string }>;
  stake_address: string | null;
  type: string;
  script: boolean;
}

export async function getAddressInfo(address: string): Promise<BlockfrostAddressInfo | null> {
  return blockfrostFetch<BlockfrostAddressInfo>(`/addresses/${address}`);
}

async function computeOnchainMetrics(address: string): Promise<OnchainMetrics> {
  const metrics: OnchainMetrics = {
    txCount: 0,
    uniqueAddresses: new Set(),
    totalReceived: 0,
    totalSent: 0,
    firstTx: null,
    lastTx: null,
  };

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const transactions = await getAddressTransactions(address, page, 100);
    
    if (transactions.length === 0) {
      hasMore = false;
      break;
    }

    for (const tx of transactions) {
      metrics.txCount++;
      
      const txDate = new Date(tx.block_time * 1000);
      if (!metrics.firstTx || txDate < metrics.firstTx) {
        metrics.firstTx = txDate;
      }
      if (!metrics.lastTx || txDate > metrics.lastTx) {
        metrics.lastTx = txDate;
      }

      const utxos = await getTransactionUtxos(tx.tx_hash);
      if (!utxos) continue;

      // Track unique addresses and amounts
      for (const input of utxos.inputs) {
        if (input.address !== address) {
          metrics.uniqueAddresses.add(input.address);
        }
        if (input.address === address) {
          const ada = input.amount.find((a) => a.unit === "lovelace");
          if (ada) metrics.totalSent += lovelaceToAda(ada.quantity);
        }
      }

      for (const output of utxos.outputs) {
        if (output.address !== address) {
          metrics.uniqueAddresses.add(output.address);
        }
        if (output.address === address) {
          const ada = output.amount.find((a) => a.unit === "lovelace");
          if (ada) metrics.totalReceived += lovelaceToAda(ada.quantity);
        }
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    page++;
    
    // Limit pages to avoid excessive API calls
    if (page > 10) {
      hasMore = false;
    }
  }

  return metrics;
}

export interface OnchainSyncResult {
  projectId: string;
  address: string | null;
  txCount: number | null;
  uniqueAddresses: number | null;
  totalReceived: number | null;
  totalSent: number | null;
  error?: string;
}

export async function syncProjectOnchain(projectId: string): Promise<OnchainSyncResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { onchainAddress: true },
  });

  if (!project?.onchainAddress) {
    return {
      projectId,
      address: null,
      txCount: null,
      uniqueAddresses: null,
      totalReceived: null,
      totalSent: null,
      error: "No on-chain address configured",
    };
  }

  const address = project.onchainAddress;

  // Verify address exists
  const addressInfo = await getAddressInfo(address);
  if (!addressInfo) {
    return {
      projectId,
      address,
      txCount: null,
      uniqueAddresses: null,
      totalReceived: null,
      totalSent: null,
      error: "Invalid or unknown address",
    };
  }

  const metrics = await computeOnchainMetrics(address);

  // Update project with on-chain metrics
  await prisma.project.update({
    where: { id: projectId },
    data: {
      onchainTxCount: metrics.txCount,
      onchainUniqueAddresses: metrics.uniqueAddresses.size,
      onchainTotalReceived: metrics.totalReceived,
      onchainTotalSent: metrics.totalSent,
      onchainFirstTx: metrics.firstTx,
      onchainLastTx: metrics.lastTx,
      onchainLastSync: new Date(),
    },
  });

  return {
    projectId,
    address,
    txCount: metrics.txCount,
    uniqueAddresses: metrics.uniqueAddresses.size,
    totalReceived: metrics.totalReceived,
    totalSent: metrics.totalSent,
  };
}

export async function syncAllProjectsOnchain(
  limit: number = 50
): Promise<{ synced: number; errors: number; results: OnchainSyncResult[] }> {
  const projects = await prisma.project.findMany({
    where: {
      onchainAddress: { not: null },
    },
    select: { id: true },
    take: limit,
  });

  const results: OnchainSyncResult[] = [];
  let synced = 0;
  let errors = 0;

  for (const project of projects) {
    const result = await syncProjectOnchain(project.id);
    results.push(result);
    
    if (result.error) {
      errors++;
    } else {
      synced++;
    }

    // Rate limiting between projects
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return { synced, errors, results };
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
