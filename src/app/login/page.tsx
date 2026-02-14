"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from "@/components/ui";
import { WalletConnect } from "@/components/auth";

type EmailState = "idle" | "loading" | "sent" | "error";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<EmailState>("idle");
  const [emailMessage, setEmailMessage] = useState("");

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailState("loading");
    setEmailMessage("");

    try {
      const response = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send magic link");
      }

      setEmailState("sent");
      setEmailMessage("Magic link sent! Check your email to sign in.");
    } catch (err) {
      setEmailState("error");
      setEmailMessage(err instanceof Error ? err.message : "Unable to send magic link.");
    }
  };

  const handleWalletSuccess = () => {
    router.push("/");
    router.refresh();
  };

  const getErrorMessage = (code: string | null): string | null => {
    switch (code) {
      case "google_denied": return "Google sign-in was cancelled";
      case "google_not_configured": return "Google sign-in is not configured. Please use wallet or email.";
      case "invalid_request": return "Invalid authentication request";
      case "invalid_state": return "Security check failed, please try again";
      case "token_exchange": return "Failed to complete Google sign-in";
      case "auth_failed": return "Authentication failed, please try again";
      case "missing_token": return "Invalid email link";
      case "invalid_token": return "Email link expired or already used";
      case "verification_failed": return "Email verification failed";
      case "wallet_error": return "Wallet connection failed. Please try again.";
      default: return null;
    }
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 dark:bg-slate-900">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">PROOF</span>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              Transparency
            </span>
          </Link>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Choose your preferred sign-in method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wallet (Primary) */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                Cardano Wallet <span className="text-blue-600">(Recommended)</span>
              </h3>
              <WalletConnect onSuccess={handleWalletSuccess} />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google */}
            <a
              href="/api/auth/google"
              className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </a>

            {/* Email */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                isLoading={emailState === "loading"}
              >
                Send Magic Link
              </Button>
            </form>

            {emailMessage && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  emailState === "error"
                    ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                    : "border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
                }`}
              >
                {emailMessage}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 px-6 py-12 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
