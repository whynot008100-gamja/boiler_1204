"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { useUser } from "@clerk/nextjs";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, ShoppingCart, Plus, Minus } from "lucide-react";
import { AddToCartDialog } from "@/components/cart/AddToCartDialog";

export default function ProductDetailPage() {
  const params = useParams();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .eq("is_active", true)
          .single();

        if (queryError) throw queryError;
        if (!data) throw new Error("상품을 찾을 수 없습니다.");

        setProduct(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "상품을 가져오는 중 오류가 발생했습니다.";
        setError(errorMessage);
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, supabase]);

  // 장바구니 아이템 개수 가져오기
  useEffect(() => {
    if (!user || !supabase) return;

    const fetchCartCount = async () => {
      try {
        const { count, error } = await supabase
          .from("cart_items")
          .select("*", { count: "exact", head: true })
          .eq("clerk_id", user.id);

        if (error) throw error;
        setCartItemCount(count || 0);
      } catch (error) {
        console.error("Error fetching cart count:", error);
      }
    };

    fetchCartCount();
  }, [user, supabase]);

  const handleAddToCart = async () => {
    if (!user || !product) return;

    try {
      setAddingToCart(true);

      // 기존 장바구니 아이템 확인
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("*")
        .eq("clerk_id", user.id)
        .eq("product_id", product.id)
        .single();

      if (existingItem) {
        // 기존 아이템이 있으면 수량 업데이트
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id);

        if (updateError) throw updateError;
      } else {
        // 새 아이템 추가
        const { error: insertError } = await supabase.from("cart_items").insert({
          clerk_id: user.id,
          product_id: product.id,
          quantity: quantity,
        });

        if (insertError) throw insertError;
      }

      // 장바구니 개수 업데이트
      const { count } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("clerk_id", user.id);
      setCartItemCount(count || 0);

      // Dialog 표시
      setShowDialog(true);
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("장바구니 추가 중 오류가 발생했습니다.");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-lg text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-8">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error || "상품을 찾을 수 없습니다."}</p>
          <Link href="/products">
            <Button>상품 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const maxQuantity = Math.min(product.stock_quantity, 99);

  return (
    <div className="min-h-[calc(100vh-80px)] max-w-7xl mx-auto px-8 py-8">
      <Link href="/products" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" />
        상품 목록으로 돌아가기
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* 상품 이미지 */}
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <ShoppingBag className="w-32 h-32 text-gray-400" />
        </div>

        {/* 상품 정보 */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded inline-block mb-2">
              {product.category || "기타"}
            </span>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            {product.description && (
              <p className="text-lg text-gray-600 mb-6">{product.description}</p>
            )}
          </div>

          <div className="border-t pt-6">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-primary">
                {product.price.toLocaleString()}원
              </span>
            </div>

            {product.stock_quantity === 0 ? (
              <div className="mb-6">
                <p className="text-red-500 font-semibold">품절</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">수량</label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={maxQuantity}
                      value={quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setQuantity(Math.max(1, Math.min(maxQuantity, value)));
                      }}
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      (재고: {product.stock_quantity}개)
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  {user ? (
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={handleAddToCart}
                      disabled={addingToCart || product.stock_quantity === 0}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {addingToCart ? "추가 중..." : "장바구니에 추가"}
                    </Button>
                  ) : (
                    <Button size="lg" className="flex-1" asChild>
                      <Link href="/sign-in">로그인 후 구매하기</Link>
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-2">상품 정보</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-600">재고</dt>
                <dd className="font-medium">{product.stock_quantity}개</dd>
              </div>
              <div>
                <dt className="text-gray-600">등록일</dt>
                <dd className="font-medium">
                  {new Date(product.created_at).toLocaleDateString("ko-KR")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* 장바구니 추가 Dialog */}
      {product && (
        <AddToCartDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          product={product}
          quantity={quantity}
          cartItemCount={cartItemCount}
        />
      )}
    </div>
  );
}

