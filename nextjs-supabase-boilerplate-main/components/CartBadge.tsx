"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";

export function CartBadge() {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [itemCount, setItemCount] = useState(0);

  const fetchCartCount = useCallback(async () => {
    if (!user || !supabase) {
      setItemCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("clerk_id", user.id);

      if (error) throw error;
      setItemCount(count || 0);
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) {
      setItemCount(0);
      return;
    }

    // 초기 로드
    fetchCartCount();

    // 실시간 업데이트를 위한 구독
    const channel = supabase
      .channel(`cart-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cart_items",
          filter: `clerk_id=eq.${user.id}`,
        },
        () => {
          fetchCartCount();
        }
      )
      .subscribe();

    // 페이지 포커스 시 업데이트
    const handleFocus = () => {
      fetchCartCount();
    };
    window.addEventListener("focus", handleFocus);

    // Custom Event 리스너 (장바구니 추가 시 강제 업데이트)
    const handleCartUpdate = () => {
      fetchCartCount();
    };
    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, [user, supabase, fetchCartCount]);

  if (itemCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
      {itemCount > 99 ? "99+" : itemCount}
    </span>
  );
}

