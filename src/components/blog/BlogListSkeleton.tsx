import BlogArticleCardSkeleton from "./BlogArticleCardSkeleton";

export default function BlogListSkeleton() {
  return (
    <div className="max-w-[1152px] mx-auto animate-pulse">
      {/* Category filters placeholder */}
      <div className="flex flex-wrap justify-center gap-2 my-[30px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`category-${i}`}
            className="w-[100px] h-[44px] rounded-full bg-[#E6E8F5]"
            style={{ width: `${Math.floor(Math.random() * 60) + 80}px` }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-[30px]">
        {/* Featured articles skeleton */}
        <section>
          <div className="h-4 bg-[#E6E8F5] rounded w-[150px] mb-[20px]" />
          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(260px,1fr))] justify-center">
            {Array.from({ length: 4 }).map((_, i) => (
              <BlogArticleCardSkeleton key={`featured-${i}`} />
            ))}
          </div>
        </section>

        {/* Recent articles skeleton */}
        <section>
          <div className="h-4 bg-[#E6E8F5] rounded w-[150px] mb-[20px] mt-[10px]" />
          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(260px,1fr))] justify-center">
            {Array.from({ length: 4 }).map((_, i) => (
              <BlogArticleCardSkeleton key={`recent-${i}`} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
