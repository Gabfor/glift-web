import BlogListSkeleton from "@/components/blog/BlogListSkeleton";

export default function BlogLoading() {
  return (
    <main className="min-h-screen bg-[#FBFCFE] pt-[140px] px-4">
      <div className="max-w-[1152px] mx-auto text-center flex flex-col items-center">
        <h1 className="text-[30px] font-bold text-[#2E3271] mb-2 text-center prose-titles [&_p]:m-0">
          Blog
        </h1>
        <div className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center max-w-[700px] mx-auto leading-relaxed mb-8 [&_p]:m-0">
          <p>
            Découvrez nos conseils, programmes et astuces pour progresser
            <br className="hidden sm:block" />
            et atteindre vos objectifs, quel que soit votre niveau.
          </p>
        </div>
        <div className="w-full max-w-[1152px] mx-auto bg-[#F7F7FF] rounded-[10px] p-[25px] text-[#5D6494] text-[14px] font-semibold text-left [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F] [&_p]:mt-0 [&_p]:mb-4 last:[&_p]:mb-0">
          <p>
            Que votre objectif soit la <strong>prise de masse musculaire</strong>, la <strong>perte de gras (sèche)</strong> ou le <strong>développement de votre force</strong>, vous êtes au bon endroit. Découvrez nos conseils d'entraînement, ainsi que nos programmes de musculation complets et détaillés, adaptés aux débutants comme aux pratiquants confirmés. Ne laissez plus vos résultats au hasard, <strong>passez au niveau supérieur</strong>.
          </p>
        </div>
      </div>

      <BlogListSkeleton />
    </main>
  );
}
