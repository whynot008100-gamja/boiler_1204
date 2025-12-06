"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Product, ProductCategory, CATEGORY_LABELS } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  Sparkles,
  Package,
} from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Pagination } from "@/components/products/Pagination";

const ITEMS_PER_PAGE = 12;

// 카테고리별 색상
const categoryColors: Record<string, string> = {
  all: "from-primary to-chart-4",
  electronics: "from-blue-500 to-cyan-500",
  clothing: "from-pink-500 to-rose-500",
  books: "from-amber-500 to-orange-500",
  food: "from-green-500 to-emerald-500",
  sports: "from-red-500 to-pink-500",
  beauty: "from-purple-500 to-fuchsia-500",
  home: "from-teal-500 to-cyan-500",
};

// 유효한 카테고리 목록
const validCategories: ProductCategory[] = [
  "all",
  "electronics",
  "clothing",
  "books",
  "food",
  "sports",
  "beauty",
  "home",
];

function ProductsPageContent() {
  const supabase = useClerkSupabaseClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // URL 쿼리 파라미터에서 카테고리 읽기
  const categoryFromUrl = searchParams.get("category");
  const initialCategory = categoryFromUrl && validCategories.includes(categoryFromUrl as ProductCategory)
    ? (categoryFromUrl as ProductCategory)
    : "all";
  
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "name_asc">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 총 페이지 수 계산
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // 상품 가져오기 (페이지네이션 적용)
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 기본 쿼리 빌더
      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("is_active", true);

      // 카테고리 필터
      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      // 검색 필터 (이름 또는 설명에서 검색)
      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
        );
      }

      // 정렬
      switch (sortBy) {
        case "name_asc":
          query = query.order("name", { ascending: true });
          break;
        case "newest":
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }

      // 페이지네이션
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setProducts(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      // Supabase 에러인 경우 message 속성에서 에러 메시지 추출
      const supabaseError = err as { message?: string; code?: string };
      const errorMessage =
        supabaseError.message ||
        (err instanceof Error
          ? err.message
          : "상품을 가져오는 중 오류가 발생했습니다.");
      setError(errorMessage);
      console.error("Error fetching products:", JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedCategory, searchQuery, sortBy, currentPage]);

  // URL 쿼리 파라미터 변경 시 카테고리 업데이트
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl && validCategories.includes(categoryFromUrl as ProductCategory)) {
      const newCategory = categoryFromUrl as ProductCategory;
      // 현재 상태와 다를 때만 업데이트 (무한 루프 방지)
      setSelectedCategory((prev) => {
        if (prev !== newCategory) {
          return newCategory;
        }
        return prev;
      });
    } else if (!categoryFromUrl) {
      setSelectedCategory((prev) => {
        if (prev !== "all") {
          return "all";
        }
        return prev;
      });
    }
  }, [searchParams]);

  // 카테고리 변경 시 URL 업데이트
  const handleCategoryChange = (category: ProductCategory) => {
    // 이미 선택된 카테고리면 무시
    if (selectedCategory === category) return;
    
    // 상태 즉시 업데이트 (UI 반응성 향상)
    setSelectedCategory(category);
    
    // URL 업데이트
    const params = new URLSearchParams();
    if (category !== "all") {
      params.set("category", category);
    }
    const newUrl = params.toString() ? `/products?${params.toString()}` : "/products";
    router.replace(newUrl, { scroll: false });
  };

  // 필터/검색/정렬 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy]);

  // 데이터 가져오기
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 변경 시 스크롤 상단으로 이동
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  // 에러 상태
  if (error && !loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-8">
        <div className="text-center max-w-md p-8 rounded-2xl bg-card border border-border">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold mb-2">오류가 발생했습니다</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={fetchProducts} className="shadow-lg shadow-primary/25">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 헤더 섹션 */}
      <div className="relative overflow-hidden border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-chart-4/5" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center shadow-lg shadow-primary/25">
                  <Grid3X3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  상품 목록
                </h1>
              </div>
              <p className="text-muted-foreground">
                다양한 카테고리에서 원하는 상품을 찾아보세요
              </p>
            </div>

            {/* 검색 바 */}
            <div className="w-full md:w-96">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="상품명 또는 설명으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-border/50 bg-background/80 focus:bg-background transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* 필터 & 정렬 바 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category)}
                className={`
                  rounded-full transition-all duration-300
                  ${
                    selectedCategory === category
                      ? `bg-gradient-to-r ${categoryColors[category]} text-white border-0 shadow-lg`
                      : "hover:border-primary/50"
                  }
                `}
              >
                {category === "all" ? (
                  <Sparkles className="w-4 h-4 mr-2" />
                ) : (
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                )}
                {CATEGORY_LABELS[category]}
              </Button>
            ))}
          </div>

          {/* 정렬 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">정렬:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 rounded-xl border border-border/50 bg-card text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all cursor-pointer"
            >
              <option value="newest">최신순</option>
              <option value="name_asc">이름순</option>
            </select>
          </div>
        </div>

        {/* 상품 그리드 */}
        <ProductGrid
          products={products}
          loading={loading}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          totalCount={totalCount}
        />

        {/* 페이지네이션 */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
