"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { notFound, useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Course, defaultCourse } from "@/utils/interfaces";
import { useAuth } from "@/hooks/authContext";
import { uploadImageToFirebase } from "@/services/handleImages";
import { v4 as uuidv4 } from "uuid";
import { getCourseData } from "@/services/courseUnitData";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { classifyCourse } from "@/utils/classify";
import LoadingScreen from "@/components/loading";
import { SiteHeader } from "@/components/site-header";
import {
  createNewCourse,
  submitEditedCourse,
} from "@/services/createCourseHelpers";
import { getChannelData } from "@/services/channelHelpers";

type CourseWithFile = Course & {
  picFile?: File;
};

export default function CreateCoursePage() {
  const [course, setCourse] = useState<CourseWithFile>({
    ...defaultCourse,
    key: uuidv4(),
  });
  const [originalCourse, setOriginalCourse] = useState<Course | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const { id } = useParams();
  const flatId = useMemo(() => (Array.isArray(id) ? id : []), [id]);
  const isInParamMode = flatId.length > 0;

  useEffect(() => {
    const initializeFromId = async () => {
      if (isInParamMode) {
        try {
          const channelData = await getChannelData(user?.uid as string);
          const courseArray = channelData?.courses;
          if (!courseArray || !courseArray.includes(flatId[0])) {
            router.push("/channel");
            return;
          }
          const courseData = await getCourseData(flatId[0]);
          if (courseData) {
            setCourse(courseData);
            setOriginalCourse(courseData);
          } else {
            setError(true);
          }
        } catch (error) {
          console.error("Error fetching course data:", error);
          setError(true);
        }
      }
    };
    initializeFromId();
  }, [isInParamMode, flatId, user?.uid, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setCourse({ ...course, picUrl: previewUrl, picFile: file });
    }
  };

  const handleSubmit = async () => {
    if (!validateCourse()) return;

    try {
      setLoading(true);
      const tags = await classifyCourse(course.name);
      if ("tags" in tags && tags.tags.length > 0) {
        if (isInParamMode && originalCourse) {
          await handleEditCourse(tags.tags);
        } else {
          await handleCreateCourse(tags.tags);
        }
        router.push(`/manageCourse/${course.key}`);
      }
      else {
        if (isInParamMode && originalCourse) {
          await handleEditCourse([]);
        } else {
          await handleCreateCourse([]);
        }
        router.push(`/manageCourse/${course.key}`);
      }
  
    } catch (error) {
      console.error("Error submitting course:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateCourse = () => {
    if (!course.name.trim()) {
      alert("Course name is required");
      return false;
    }

    if (course.name.length > 100) {
      alert("Course name must be less than 100 characters.");
      return false;
    }

    if (course.description && course.description.length > 1000) {
      alert("Course description must be less than 1000 characters.");
      return false;
    }

    return true;
  };

  const handleCreateCourse = async (tags: string[]) => {
    if (course.picFile) {
      const uploadedUrl = await uploadImageToFirebase(
        course.picFile,
        "coursePics"
      );
      course.picUrl = uploadedUrl;
    }

    const courseToSave = { ...course };
    delete courseToSave.picFile;

    await createNewCourse(user?.uid as string, courseToSave, course.key, tags);
  };

  const handleEditCourse = async (tags: string[]) => {
    await submitEditedCourse(
      user?.uid as string,
      course,
      originalCourse as Course,
      tags
    );
  };

  if (error) return notFound();

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
      <SidebarInset className="p-6 min-h-screen">
        <SiteHeader />

        <div className="py-6 space-y-6 min-h-screen">
          <h1 className="text-white text-2xl font-bold">Create a Course</h1>

          <div className="space-y-4 bg-[var(--card)] rounded-xl p-6">
            <div className="flex items-center space-x-4">
              {course.picUrl ? (
                <Image
                  src={course.picUrl}
                  alt="Course Image"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full border border-zinc-600 object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-white">
                  No Image
                </div>
              )}
              <label className="bg-zinc-800 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-zinc-800 transition">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden bg-zinc-800"
                />
              </label>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-white text-sm">Course Name</label>
              <input
                type="text"
                value={course.name}
                onChange={(e) => setCourse({ ...course, name: e.target.value })}
                placeholder="Enter course name"
                className="text-white bg-zinc-900 border border-zinc-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-white text-sm">Course Description</label>
              <textarea
                rows={4}
                value={course.description}
                onChange={(e) =>
                  setCourse({ ...course, description: e.target.value })
                }
                placeholder="Enter a brief description"
                className="bg-zinc-900 border border-zinc-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            {loading ? (
              <LoadingScreen />
            ) : (
              <Button
                onClick={handleSubmit}
                className="mt-4 bg-teal-600 hover:bg-teal-500"
              >
                {isInParamMode ? "Save Changes" : "Create Course"}
              </Button>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
