"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function RequireRole({
  role,
  children,
}: {
  role: "admin" | "super_admin";
  children: React.ReactNode;
}) {
  const { loading, isLoggedIn, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();

  const allowed = role === "super_admin" ? isSuperAdmin : isAdmin || isSuperAdmin;

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      router.replace("/login");
    } else if (!allowed) {
      router.replace(isAdmin ? "/admin" : "/login");
    }
  }, [loading, isLoggedIn, allowed, isAdmin, router]);

  if (loading || !isLoggedIn || !allowed) return null;
  return <>{children}</>;
}
