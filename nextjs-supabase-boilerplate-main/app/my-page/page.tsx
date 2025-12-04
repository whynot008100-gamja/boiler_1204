"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, ShoppingBag, Package, ArrowRight } from "lucide-react";

interface Order {
  id: string;
  clerk_id: string;
  total_amount: number;
  status: string;
  shipping_address: any;
  order_note: string | null;
  created_at: string;
  updated_at: string;
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: "결제 대기",
    confirmed: "주문 확인",
    shipped: "배송 중",
    delivered: "배송 완료",
    cancelled: "취소됨",
  };
  return labels[status] || status;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "text-yellow-600 bg-yellow-50",
    confirmed: "text-blue-600 bg-blue-50",
    shipped: "text-purple-600 bg-purple-50",
    delivered: "text-green-600 bg-green-50",
    cancelled: "text-red-600 bg-red-50",
  };
  return colors[status] || "text-gray-600 bg-gray-50";
};

export default function MyPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("orders")
        .select("*")
        .eq("clerk_id", user.id)
        .order("created_at", { ascending: false });

      if (selectedStatus !== "all") {
        query = query.eq("status", selectedStatus);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      setOrders(data || []);
    } catch (err) {
      // Supabase 에러인 경우 message 속성에서 에러 메시지 추출
      const supabaseError = err as { message?: string; code?: string };
      const errorMessage = supabaseError.message || 
        (err instanceof Error ? err.message : "주문 내역을 가져오는 중 오류가 발생했습니다.");
      setError(errorMessage);
      console.error("Error fetching orders:", JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  }, [user, supabase, selectedStatus]);

  useEffect(() => {
    if (isLoaded) {
      fetchOrders();
    }
  }, [isLoaded, fetchOrders]);

  if (!isLoaded) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-lg text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-lg text-gray-600">주문 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-8">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchOrders}>다시 시도</Button>
        </div>
      </div>
    );
  }

  const statusOptions = [
    { value: "all", label: "전체" },
    { value: "pending", label: "결제 대기" },
    { value: "confirmed", label: "주문 확인" },
    { value: "shipped", label: "배송 중" },
    { value: "delivered", label: "배송 완료" },
    { value: "cancelled", label: "취소됨" },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] max-w-7xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">마이페이지</h1>
        <p className="text-gray-600">주문 내역을 확인하고 관리하세요</p>
      </div>

      {/* 사용자 정보 */}
      <div className="border rounded-lg p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.fullName || "사용자"}</h2>
            <p className="text-gray-600">{user.emailAddresses[0]?.emailAddress}</p>
          </div>
        </div>
      </div>

      {/* 주문 내역 필터 */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">주문 내역</h2>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 주문 목록 */}
      {orders.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold mb-2">주문 내역이 없습니다</h3>
          <p className="text-gray-600 mb-6">아직 주문한 상품이 없습니다.</p>
          <Link href="/products">
            <Button size="lg">
              <ShoppingBag className="w-5 h-5 mr-2" />
              쇼핑하러 가기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm text-gray-500">주문 번호: {order.id.slice(0, 8)}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    주문일시: {new Date(order.created_at).toLocaleString("ko-KR")}
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {order.total_amount.toLocaleString()}원
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

