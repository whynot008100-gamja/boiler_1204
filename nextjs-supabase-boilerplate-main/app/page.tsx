import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, TrendingUp, Sparkles } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Product, CATEGORY_LABELS, ProductCategory } from "@/types/product";

export const dynamic = "force-dynamic";

async function getPopularProducts() {
  try {
    // 홈페이지는 공개 페이지이므로 인증 없이 상품 조회
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase 환경 변수가 설정되지 않았습니다.");
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      console.error("Error fetching popular products:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching popular products:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}

export default async function Home() {
  const popularProducts = await getPopularProducts();

  return (
    <main className="min-h-[calc(100vh-80px)]">
      {/* 히어로 섹션 */}
      <section className="w-full max-w-7xl mx-auto px-8 py-16 lg:py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
            스타일리시한 의류 쇼핑몰
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
            트렌디한 패션 아이템을 만나보세요
          </p>
          <Link href="/products">
            <Button size="lg" className="text-lg px-8 py-6">
              <ShoppingBag className="w-5 h-5 mr-2" />
              상품 둘러보기
            </Button>
          </Link>
        </div>
      </section>

      {/* 인기 상품 섹션 */}
      <section className="w-full max-w-7xl mx-auto px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold">인기 상품</h2>
          </div>
          <Link href="/products" className="text-primary hover:underline">
            전체 보기 →
          </Link>
        </div>
        {popularProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>상품이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularProducts.map((product: Product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group"
              >
                <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <ShoppingBag className="w-16 h-16 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {product.category
                          ? CATEGORY_LABELS[
                              product.category as ProductCategory
                            ] || product.category
                          : "기타"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">
                        {product.price.toLocaleString()}원
                      </span>
                      {product.stock_quantity === 0 && (
                        <span className="text-xs text-red-500">품절</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 카테고리별 추천 상품 (추후 구현) */}
      <section className="w-full max-w-7xl mx-auto px-8 py-16">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-bold">카테고리별 추천</h2>
        </div>
        <div className="text-center py-12 text-gray-500">
          <p>카테고리 필터링 구현 후 표시됩니다</p>
        </div>
      </section>
    </main>
  );
}
