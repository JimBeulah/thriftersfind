"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "./app-shell";
import { User } from "@/lib/types";
import { useRouter, usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchUser() {
      try {
        // Ensure we don't get a cached response
        const response = await fetch("/api/auth/me", { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          console.log("[AppLayout] Auth check data:", data); // Debug log
          setUser(data.user);
          setIsImpersonating(data.isImpersonating);
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
  }, [pathname, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <AppShell user={user} isImpersonating={isImpersonating}>{children}</AppShell>;
}
