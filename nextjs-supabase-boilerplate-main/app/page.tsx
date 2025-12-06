import Link from "next/link";
import {
  ShoppingBag,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Tag,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Product, CATEGORY_LABELS, ProductCategory } from "@/types/product";
import HeroSection from "@/components/hero/HeroSection";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function getPopularProducts() {
  try {
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
      console.error("Error fetching popular products:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching popular products:", error);
    return [];
  }
}

// 카테고리 아이콘 매핑
const categoryColors: Record<string, string> = {
  electronics: "from-blue-500 to-cyan-500",
  clothing: "from-pink-500 to-rose-500",
  books: "from-amber-500 to-orange-500",
  food: "from-green-500 to-emerald-500",
  sports: "from-red-500 to-pink-500",
  beauty: "from-purple-500 to-fuchsia-500",
  home: "from-teal-500 to-cyan-500",
};

export default async function Home() {
  const popularProducts = await getPopularProducts();

  return (
    <main className="min-h-screen">
      {/* 히어로 섹션 */}
      <HeroSection />

      {/* 카테고리 섹션 */}
      <section className="w-full py-20 lg:py-28">
        <div className="max-w-[75%] mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                카테고리별 쇼핑
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              원하는 카테고리를 선택하세요
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              전자제품부터 패션, 뷰티까지 다양한 카테고리에서 원하는 상품을
              찾아보세요
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(CATEGORY_LABELS)
              .filter(([key]) => key !== "all")
              .map(([key, label]) => (
                <Link key={key} href={`/products?category=${key}`}>
                  <div className="group relative p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
                    {/* Background Gradient */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${
                        categoryColors[key] || "from-gray-400 to-gray-500"
                      } opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                    />

                    <div className="relative z-10">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                          categoryColors[key] || "from-gray-400 to-gray-500"
                        } flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <ShoppingBag className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {label}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* 인기 상품 섹션 */}
      <section className="w-full py-20 lg:py-28 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  인기 상품
                </h2>
              </div>
              <p className="text-muted-foreground">
                가장 많은 고객님들이 선택한 인기 상품
              </p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="group">
                전체 상품 보기
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Products Grid */}
          {popularProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                아직 등록된 상품이 없습니다
              </h3>
              <p className="text-muted-foreground">
                곧 새로운 상품을 만나보실 수 있습니다
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularProducts.map((product: Product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group"
                >
                  <div className="product-card relative bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/30 hover:shadow-xl">
                    {/* Product Image Area */}
                    <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                      <div className="product-image absolute inset-0 flex items-center justify-center">
                        <div
                          className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${
                            categoryColors[product.category || ""] ||
                            "from-gray-400 to-gray-500"
                          } opacity-20 blur-xl`}
                        />
                        <ShoppingBag className="absolute w-16 h-16 text-muted-foreground/40" />
                      </div>

                      {/* Category Badge */}
                      <div className="absolute top-4 left-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r ${
                            categoryColors[product.category || ""] ||
                            "from-gray-400 to-gray-500"
                          } text-white shadow-lg`}
                        >
                          <Tag className="w-3 h-3" />
                          {product.category
                            ? CATEGORY_LABELS[
                                product.category as ProductCategory
                              ] || product.category
                            : "기타"}
                        </span>
                      </div>

                      {/* Stock Badge */}
                      {product.stock_quantity === 0 && (
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-destructive text-white">
                            품절
                          </span>
                        </div>
                      )}
                      {product.stock_quantity > 0 &&
                        product.stock_quantity <= 5 && (
                          <div className="absolute top-4 right-4">
                            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500 text-white">
                              {product.stock_quantity}개 남음
                            </span>
                          </div>
                        )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Product Info */}
                    <div className="p-5">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-4 bg-clip-text text-transparent">
                          {product.price.toLocaleString()}
                          <span className="text-sm ml-1 text-foreground">
                            원
                          </span>
                        </span>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="w-full py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-chart-4 to-primary p-8 sm:p-12 lg:p-16">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                  backgroundSize: "40px 40px",
                }}
              />
            </div>

            {/* Floating Elements */}
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-8 -bottom-8 w-48 h-48 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                지금 시작하세요
              </h2>
              <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                회원가입하고 첫 구매 시 10% 할인 쿠폰을 받아보세요
              </p>
              <Link href="/products">
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg font-semibold bg-white text-foreground hover:bg-white/90 shadow-xl"
                >
                  쇼핑하러 가기
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
