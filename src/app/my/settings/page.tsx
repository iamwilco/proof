"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Textarea } from "@/components/ui";
import { useSession } from "@/components/auth";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, refresh } = useSession();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setBio("");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, avatarUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your public profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-blue-500">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Avatar" width={64} height={64} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                      {displayName?.[0] || user?.walletAddress?.[0] || "U"}
                    </div>
                  )}
                </div>
                <Input
                  label="Avatar URL"
                  placeholder="https://..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="flex-1"
                />
              </div>

              <Input
                label="Display Name"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />

              <Textarea
                label="Bio"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />

              {message && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    message.type === "error"
                      ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                      : "border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button type="submit" isLoading={saving}>
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>Manage your linked authentication methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <span className="text-lg">🔗</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Cardano Wallet</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {user?.walletAddress
                      ? `${user.walletAddress.slice(0, 12)}...${user.walletAddress.slice(-8)}`
                      : "Not connected"}
                  </p>
                </div>
              </div>
              {user?.walletAddress ? (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                  Connected
                </span>
              ) : (
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Google</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {user?.email || "Not connected"}
                  </p>
                </div>
              </div>
              {user?.email ? (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                  Connected
                </span>
              ) : (
                <a href="/api/auth/google">
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Role</span>
              <span className="font-medium text-slate-900 dark:text-white">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">User ID</span>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{user?.id}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
