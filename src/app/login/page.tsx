"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "../../lib/supabase/client";

type FormState = "idle" | "loading" | "sent" | "error";
type WalletState = "idle" | "connecting" | "success" | "error";

type Cip30Wallet = {
  enable: () => Promise<{ getUsedAddresses: () => Promise<string[]>; signData: (address: string, payload: string) => Promise<{ signature: string; key: string }> }>;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [walletState, setWalletState] = useState<WalletState>("idle");
  const [walletMessage, setWalletMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("loading");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setState("sent");
      setMessage("Magic link sent! Check your email to sign in.");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to send magic link."
      );
    }
  };

  const handleWalletLogout = async () => {
    setWalletState("connecting");
    setWalletMessage("");

    try {
      const response = await fetch("/api/wallet/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Unable to disconnect wallet session.");
      }
      setWalletState("idle");
      setWalletMessage("Wallet session cleared.");
    } catch (error) {
      setWalletState("error");
      setWalletMessage(error instanceof Error ? error.message : "Wallet logout failed.");
    }
  };

  const handleWalletLogin = async () => {
    setWalletState("connecting");
    setWalletMessage("");

    try {
      const cardano = (window as Window & { cardano?: Record<string, Cip30Wallet> }).cardano;
      if (!cardano) {
        throw new Error("No Cardano wallet found. Install a CIP-30 wallet like Nami or Eternl.");
      }

      const walletKey = Object.keys(cardano)[0];
      const wallet = cardano[walletKey];
      const api = await wallet.enable();
      const addresses = await api.getUsedAddresses();
      const address = addresses[0];

      if (!address) {
        throw new Error("Wallet returned no used addresses.");
      }

      const nonceResponse = await fetch("/api/wallet/nonce");
      if (!nonceResponse.ok) {
        throw new Error("Unable to request login nonce.");
      }

      const { nonce } = (await nonceResponse.json()) as { nonce: string };
      const signed = await api.signData(address, nonce);

      const loginResponse = await fetch("/api/wallet/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature: signed.signature, key: signed.key, nonce }),
      });

      if (!loginResponse.ok) {
        const payload = await loginResponse.json().catch(() => ({ message: "Wallet login failed." }));
        throw new Error(payload.message || "Wallet login failed.");
      }

      setWalletState("success");
      setWalletMessage("Wallet connected. Session created.");
    } catch (error) {
      setWalletState("error");
      setWalletMessage(error instanceof Error ? error.message : "Wallet login failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Receive a magic link to access protected features.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={state === "loading"}
            className="h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {state === "loading" ? "Sending…" : "Send magic link"}
          </button>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" required className="accent-blue-600" />
            I&apos;m not a robot (captcha placeholder)
          </label>
        </form>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-sm font-semibold text-slate-800">Sign in with Cardano wallet</h2>
          <p className="mt-2 text-xs text-slate-500">
            Connect a CIP-30 wallet to sign a login nonce and create a session.
          </p>
          <button
            type="button"
            onClick={handleWalletLogin}
            disabled={walletState === "connecting"}
            className="mt-4 h-11 w-full rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            {walletState === "connecting" ? "Connecting…" : "Connect wallet"}
          </button>
          {walletState === "success" && (
            <button
              type="button"
              onClick={handleWalletLogout}
              className="mt-3 h-11 w-full rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Disconnect wallet
            </button>
          )}
          {walletMessage && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                walletState === "error"
                  ? "bg-rose-50 text-rose-600"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {walletMessage}
            </div>
          )}
        </div>

        {message && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              state === "error"
                ? "bg-rose-50 text-rose-600"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
