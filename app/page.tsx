"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { CourseCard } from "@/components/course-card";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/authContext";
import {
  getAllLearningCourseIds,
  getCoursesWithMostViews,
} from "@/services/courseUnitData";
import { Course } from "@/utils/interfaces";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomepPage() {
  const { user } = useAuth();
  const [learningCourses, setLearningCourses] = useState<string[] | null>(null);
  const [trendingCourses, setTrendingCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchLearning() {
      if (!user?.uid) return;
      try {
        const data = await getAllLearningCourseIds(user.uid);
        setLearningCourses(data);
        const trending = await getCoursesWithMostViews(10);
        setTrendingCourses(trending);
      } catch (error) {
        console.error("Failed to fetch channel data", error);
      }
    }
    fetchLearning();
  }, [router, user?.uid]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    router.push(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
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
        {user?.isAnonymous && user?.uid && (
          <Card className="border border-teal-700/50 bg-teal-950/40">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-teal-100">
                  You are browsing as a guest. Sign in to save your progress.
                </div>
                <Link
                  href={`/signin?anonUid=${encodeURIComponent(user.uid)}`}
                  className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
        <SiteHeader />
        <Card className="bg-[var(--card)] border border-zinc-800">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold text-white">
                What I&apos;m learining
              </h1>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex w-full md:w-auto items-center gap-2"
              >
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-72 bg-[var(--card)] border border-zinc-700 text-white placeholder-zinc-400"
                />
                <button
                  type="submit"
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
                >
                  Search
                </button>
              </form>
            </div>
          </CardContent>
        </Card>
        {learningCourses && learningCourses.length > 0 && (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {learningCourses.map((courseId) => (
              <div key={courseId} className="h-full">
                <CourseCard
                  courseId={courseId}
                  link={`/viewCourse`}
                  channel={true}
                />
              </div>
            ))}
          </div>
        )}
        {learningCourses?.length === 0 && (
          <div className="w-full rounded-xl border border-zinc-800 bg-[var(--card)] p-6 text-center text-zinc-400">
            <p className="text-sm">
              You aren&apos;t learning any courses. Pick some to get started!
            </p>
          </div>
        )}
        <h1 className="text-2xl font-semibold text-white">Popular Courses</h1>
        {trendingCourses && trendingCourses.length > 0 && (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {trendingCourses.map((course) => (
              <div key={course.key} className="h-full">
                <CourseCard
                  course={course}
                  link={`/viewCourse`}
                  channel={true}
                />
              </div>
            ))}
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
