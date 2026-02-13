"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Course } from "@/utils/interfaces";
import { getCourseData } from "@/services/courseUnitData";
import LoadingScreen from "../loading";

interface CourseCardProps {
  courseId: string;
  link?: string;
  showSubscribeButton?: boolean;
  isSubscribed?: boolean;
  onPressSubscribe?: () => void;
}

export function ViewCourseCard({
  courseId,
  link,
  showSubscribeButton = false,
  isSubscribed = false,
  onPressSubscribe,
}: CourseCardProps) {
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await getCourseData(courseId);
        setCourse(data);
      } catch (err) {
        console.error("Failed to fetch course:", err);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (!course) return <LoadingScreen />;

  const courseHref = link ? `${link}/${course.key}` : "#";

  return (
    <Link href={courseHref} className="block w-full">
      <Card className="w-full bg-[var(--card)] border border-zinc-800 hover:shadow-md transition overflow-hidden">
        <CardContent className="flex items-start gap-4 p-4 w-full">
          {course.picUrl && (
            <div className="w-14 h-14 relative rounded-full overflow-hidden shrink-0 border border-zinc-700">
              <Image
                src={course.picUrl}
                alt="Course Icon"
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="flex flex-col flex-grow min-w-0 overflow-hidden">
            <h1 className="text-lg font-semibold text-white leading-tight break-words">
              {course.name}
            </h1>

            {course.description && (
              <p className="text-sm text-zinc-400 mt-1 break-words">
                {course.description}
              </p>
            )}

            <div className="flex flex-col items-start gap-1 mt-2 text-zinc-400 text-sm">
              {course.numSubscribers !== undefined && (
                <div className="flex items-center gap-1">
                  {course.numSubscribers}
                  {" subscribers"}
                </div>
              )}
              {course.views !== undefined && (
                <div className="flex items-center gap-1">
                  {course.views}
                  {" views"}
                </div>
              )}
            </div>
          </div>

          {showSubscribeButton && (
            <div className="ml-2 shrink-0 self-start">
              <Button
                className={`text-xs px-3 py-1 rounded-lg border ${
                  isSubscribed
                    ? "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
                    : "bg-white text-black border-gray-300 hover:bg-gray-100"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPressSubscribe?.();
                }}
              >
                {isSubscribed ? "Unsubscribe" : "Subscribe"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
