"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { CourseCard } from "@/components/course-card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { searchCourses } from "@/utils/searchAlgorithm";
import { SiteHeader } from "@/components/site-header";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryParam = searchParams.get("query") || "";
  const [query, setQuery] = useState(queryParam);
  const [searchResults, setSearchResults] = useState<string[]>([]);

  useEffect(() => {
    if (queryParam) {
      // eslint-disable-next-line react-hooks/immutability
      runSearch(queryParam);
    }
  }, [queryParam]);

  const runSearch = async (q: string) => {
    const res = await searchCourses(q);
    setSearchResults(res);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?query=${encodeURIComponent(query.trim())}`);
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="p-6 space-y-6 min-h-screen">
        <SiteHeader />
        
        <div className="w-full max-w-6xl mx-auto space-y-6 text-white">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full bg-[var(--card)] text-white placeholder-zinc-400 px-4 py-3 rounded-md border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </form>

          {searchResults.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {searchResults.map((id) => (
                <CourseCard
                  key={id}
                  courseId={id}
                  link="/viewCourse"
                  channel={true}
                />
              ))}
            </div>
          ) : (
            <p className="text-zinc-400">No results found.</p>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
