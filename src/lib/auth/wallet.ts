/**
 * Cardano Wallet Authentication (CIP-30)
 * 
 * Implements wallet connection and signature verification for authentication.
 * Supports: Nami, Eternl, Lace, Flint, Typhon, Yoroi
 */

export interface WalletInfo {
  name: string;
  icon: string;
  apiVersion: string;
}

export interface ConnectedWallet {
  name: string;
  address: string;
  stakeAddress: string;
}

declare global {
  interface Window {
    cardano?: {
      [key: string]: {
        name: string;
        icon: string;
        apiVersion: string;
        enable: () => Promise<WalletAPI>;
        isEnabled: () => Promise<boolean>;
      };
    };
  }
}

interface WalletAPI {
  getNetworkId: () => Promise<number>;
  getUsedAddresses: () => Promise<string[]>;
  getUnusedAddresses: () => Promise<string[]>;
  getRewardAddresses: () => Promise<string[]>;
  signData: (address: string, payload: string) => Promise<{ signature: string; key: string }>;
}

const SUPPORTED_WALLETS = ["nami", "eternl", "lace", "flint", "typhon", "yoroi"];

/**
 * Detect available Cardano wallets in the browser
 */
export function detectWallets(): WalletInfo[] {
  if (typeof window === "undefined" || !window.cardano) {
    return [];
  }

  const wallets: WalletInfo[] = [];
  
  for (const key of SUPPORTED_WALLETS) {
    const wallet = window.cardano[key];
    if (wallet) {
      wallets.push({
        name: wallet.name,
        icon: wallet.icon,
        apiVersion: wallet.apiVersion,
      });
    }
  }

  return wallets;
}

/**
 * Connect to a specific wallet
 */
export async function connectWallet(walletName: string): Promise<WalletAPI | null> {
  if (typeof window === "undefined" || !window.cardano) {
    throw new Error("Cardano wallets not available");
  }

  const wallet = window.cardano[walletName.toLowerCase()];
  if (!wallet) {
    throw new Error(`Wallet ${walletName} not found`);
  }

  try {
    const api = await wallet.enable();
    return api;
  } catch (error) {
    console.error(`Failed to connect to ${walletName}:`, error);
    throw new Error(`Failed to connect to ${walletName}`);
  }
}

/**
 * Get the stake address from a connected wallet
 */
export async function getStakeAddress(api: WalletAPI): Promise<string> {
  const rewardAddresses = await api.getRewardAddresses();
  if (rewardAddresses.length === 0) {
    throw new Error("No reward addresses found");
  }
  return rewardAddresses[0];
}

/**
 * Get the primary payment address from a connected wallet
 */
export async function getPaymentAddress(api: WalletAPI): Promise<string> {
  const usedAddresses = await api.getUsedAddresses();
  if (usedAddresses.length > 0) {
    return usedAddresses[0];
  }
  
  const unusedAddresses = await api.getUnusedAddresses();
  if (unusedAddresses.length > 0) {
    return unusedAddresses[0];
  }
  
  throw new Error("No addresses found in wallet");
}

/**
 * Generate a random nonce for signature verification
 */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Create a message for the user to sign
 */
export function createSignatureMessage(nonce: string, timestamp: number): string {
  return `Sign this message to authenticate with PROOF Transparency Platform.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
}

/**
 * Request a signature from the wallet
 */
export async function requestSignature(
  api: WalletAPI,
  address: string,
  message: string
): Promise<{ signature: string; key: string }> {
  const payload = Buffer.from(message, "utf8").toString("hex");
  return api.signData(address, payload);
}

/**
 * Full wallet connection and authentication flow
 */
export async function authenticateWithWallet(walletName: string): Promise<{
  address: string;
  stakeAddress: string;
  signature: string;
  key: string;
  nonce: string;
  timestamp: number;
}> {
  const api = await connectWallet(walletName);
  if (!api) {
    throw new Error("Failed to connect wallet");
  }

  const address = await getPaymentAddress(api);
  const stakeAddress = await getStakeAddress(api);
  const nonce = generateNonce();
  const timestamp = Date.now();
  const message = createSignatureMessage(nonce, timestamp);
  
  const { signature, key } = await requestSignature(api, address, message);

  return {
    address,
    stakeAddress,
    signature,
    key,
    nonce,
    timestamp,
  };
}
