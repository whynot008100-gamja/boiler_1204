"use client";

import { useState, useEffect, useCallback } from "react";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Product, ProductCategory, CATEGORY_LABELS } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ShoppingBag, Search, Filter } from "lucide-react";

export default function ProductsPage() {
  const supabase = useClerkSupabaseClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "newest">("newest");

  // 상품 가져오기
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (err) {
      // Supabase 에러인 경우 message 속성에서 에러 메시지 추출
      const supabaseError = err as { message?: string; code?: string };
      const errorMessage = supabaseError.message || 
        (err instanceof Error ? err.message : "상품을 가져오는 중 오류가 발생했습니다.");
      setError(errorMessage);
      console.error("Error fetching products:", JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 필터링 및 정렬
  useEffect(() => {
    let filtered = [...products];

    // 카테고리 필터
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery, sortBy]);

  const categories: ProductCategory[] = [
    "all",
    "electronics",
    "clothing",
    "books",
    "food",
    "sports",
    "beauty",
    "home",
  ];

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

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-8">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchProducts}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] max-w-7xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">상품 목록</h1>

        {/* 검색 및 필터 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="상품명 또는 설명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="newest">최신순</option>
              <option value="price_asc">가격 낮은순</option>
              <option value="price_desc">가격 높은순</option>
            </select>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {CATEGORY_LABELS[category]}
            </Button>
          ))}
        </div>
      </div>

      {/* 상품 그리드 */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">상품이 없습니다</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            총 {filteredProducts.length}개의 상품
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group"
              >
                <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {/* 상품 이미지 (추후 구현) */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <ShoppingBag className="w-16 h-16 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {product.category ? CATEGORY_LABELS[product.category as ProductCategory] || product.category : "기타"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
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
        </>
      )}
    </div>
  );
}

