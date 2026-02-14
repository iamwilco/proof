export {
  detectWallets,
  connectWallet,
  getStakeAddress,
  getPaymentAddress,
  generateNonce,
  createSignatureMessage,
  requestSignature,
  authenticateWithWallet,
} from "./wallet";
export type { WalletInfo, ConnectedWallet } from "./wallet";
