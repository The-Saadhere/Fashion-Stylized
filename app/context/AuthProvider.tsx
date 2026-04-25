"use client";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react"
import { useCartStore } from "../store/cartStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useCartStore.persist.rehydrate() // ✅ loads localStorage on client
  }, [])

  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );

}
