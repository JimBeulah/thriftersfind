"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "./app-shell";
import { User } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // If 401, redirect? Or let AppShell show guest?
          // For security, redirecting is better if this layout is protected.
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching user", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <AppShell user={user}>{children}</AppShell>;
}
