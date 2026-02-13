"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button, Modal } from "@/components/ui";
import { detectWallets, authenticateWithWallet, type WalletInfo } from "@/lib/auth";

interface WalletConnectProps {
  onSuccess?: (data: { stakeAddress: string; userId: string }) => void;
  onError?: (error: string) => void;
}

export function WalletConnect({ onSuccess, onError }: WalletConnectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const detected = detectWallets();
      setWallets(detected);
    }
  }, [isOpen]);

  const handleConnect = async (walletName: string) => {
    setConnecting(walletName);
    setError(null);

    try {
      const authData = await authenticateWithWallet(walletName);
      
      const response = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Authentication failed");
      }

      const { userId, stakeAddress } = await response.json();
      
      setIsOpen(false);
      onSuccess?.({ stakeAddress, userId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setError(message);
      onError?.(message);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="primary">
        Connect Wallet
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Connect Wallet"
        description="Choose a wallet to sign in with your Cardano address"
        size="sm"
      >
        <div className="space-y-3">
          {wallets.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                No Cardano wallets detected
              </p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Install a wallet extension like Nami, Eternl, or Lace
              </p>
            </div>
          ) : (
            wallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleConnect(wallet.name)}
                disabled={connecting !== null}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
              >
                {wallet.icon && (
                  <Image
                    src={wallet.icon}
                    alt={wallet.name}
                    width={32}
                    height={32}
                    className="rounded"
                    unoptimized
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {wallet.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    API v{wallet.apiVersion}
                  </p>
                </div>
                {connecting === wallet.name && (
                  <svg
                    className="h-5 w-5 animate-spin text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
              </button>
            ))
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Or sign in with{" "}
              <a href="/api/auth/google" className="text-blue-600 hover:underline dark:text-blue-400">
                Google
              </a>{" "}
              or{" "}
              <a href="/login?method=email" className="text-blue-600 hover:underline dark:text-blue-400">
                Email
              </a>
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
