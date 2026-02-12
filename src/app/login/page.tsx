"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "../../lib/supabase/client";

type FormState = "idle" | "loading" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

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
