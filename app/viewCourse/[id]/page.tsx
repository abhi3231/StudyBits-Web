"use client";

import { useEffect, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { Channel, Course, Unit } from "@/utils/interfaces";
import {
  addCourseToUserLearning,
  fetchCourseInteractionData,
  getSubscribedCourses,
  toggleStudyingUnit,
  updateUseUnitsPreference,
} from "@/services/viewCourseHelpers";
import {
  checkIfSubscribed,
  subscribeToCourse,
  unsubscribeFromCourse,
} from "@/services/answerHelpers";
import { Switch } from "@/components/ui/switch";
import { ViewCourseCard } from "@/components/viewCourse/view-course-card";
import { ChannelDisplay } from "@/components/channel-display";
import { useAuth } from "@/hooks/authContext";
import SubscriberList from "@/components/viewCourse/subscriber-list";
import { fetchUnitsAndCourseCreator } from "@/services/courseUnitData";
import { getChannelData } from "@/services/channelHelpers";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { IconCircle, IconCircleCheckFilled } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { deleteLearning } from "@/services/deleteCourseUnitData";
import { CourseDialog } from "@/components/course-unit-selector";
import { cacheSubscribedCourses } from "@/services/cacheServices";
import { SiteHeader } from "@/components/site-header";
import { ViewQuestions } from "@/components/view-questions";

export default function ViewCoursesPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [units, setUnits] = useState<Unit[]>([]);
  const [courseCreatorId, setCourseCreatorId] = useState<string | null>(null);
  const [studiedCourse, setStudiedCourse] = useState(false);
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [studyingUnits, setStudyingUnits] = useState<string[]>([]);
  const [subscribedCourses, setSubscribedCourses] = useState<string[]>([]);
  const [subscribedTo, setSubscribedTo] = useState(false);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [notFoundError, setNotFoundError] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (typeof id !== "string" || !user?.uid) return;

      try {
        const courseData = await fetchUnitsAndCourseCreator(id);
        if (courseData) {
          setCourseCreatorId(courseData.creatorId);
          setUnits(courseData.sortedUnits);
          const channel = await getChannelData(courseData.creatorId);
          if (channel) setChannel(channel);
        } else {
          setNotFoundError(true);
        }

        const { isStudied, useUnits, studyingUnits } =
          await fetchCourseInteractionData(user.uid, id);

        setStudiedCourse(isStudied);
        setIsSwitchOn(useUnits);
        setStudyingUnits(studyingUnits);
        const subscribed = await checkIfSubscribed(id);
        setSubscribedTo(subscribed);
      } catch (err) {
        console.error("Error loading course:", err);
      }
    };

    fetchCourseData();
  }, [id, user?.uid]);

  useEffect(() => {
    const refreshCache = async () => {
      if (!user?.uid) return;
      await cacheSubscribedCourses(user.uid);
      const subCourses = await getSubscribedCourses(id as string);
      setSubscribedCourses(subCourses);
      setSubscribedTo(subCourses.includes(id as string));
    };

    refreshCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddCourse = async () => {
    if (!user?.uid || typeof id !== "string") return;
    await addCourseToUserLearning(user.uid, id);
    setStudiedCourse(true);
    setStudyingUnits([]);
  };

  const handleDeleteCourse = async () => {
    if (!user?.uid || typeof id !== "string") return;
    deleteLearning(user?.uid, id);
    setIsSwitchOn(false);
    setStudyingUnits([]);
    router.push("/");
  };

  const handleUnitToggle = async (unitId: string) => {
    if (!user?.uid || typeof id !== "string") return;

    const updated = await toggleStudyingUnit(
      user.uid,
      id,
      studyingUnits,
      unitId,
    );
    setStudyingUnits(updated);
  };

  const toggleSwitch = async () => {
    if (!user?.uid || typeof id !== "string") return;
    const newValue = !isSwitchOn;
    setIsSwitchOn(newValue);
    await updateUseUnitsPreference(user.uid, id, newValue);
  };

  const toggleSubscribe = async () => {
    if (!user?.uid || typeof id !== "string") return;

    if (subscribedTo) {
      if (studiedCourse) {
        await unsubscribeFromCourse(id, id, user.uid);
        setSubscribedTo(false);
      } else {
        const mapStr = localStorage.getItem(`subscriptions`);
        if (mapStr) {
          const map = JSON.parse(mapStr) as Record<string, string>;
          console.log(map[id]);
          await unsubscribeFromCourse(id, map[id], user?.uid);
          setSubscribedTo(false);
        }
      }
    } else {
      if (studiedCourse) {
        await subscribeToCourse(id, id, user.uid);
        setSubscribedTo(true);
      } else {
        setCourseOpen(true);
      }
    }
  };

  const handleUnitPress = (unitId: string) => {
    if (typeof id !== "string") return;
    setSelectedUnitId((prev) => (prev === unitId ? null : unitId));
  };

  if (notFoundError) {
    notFound();
  }

  const handleCourseSelect = async (course: Course) => {
    await subscribeToCourse(id as string, course.key, user?.uid as string);
    setSubscribedTo(true);
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
      <SidebarInset className="p-6 min-h-screen overflow-x-hidden">
        <SiteHeader />

        <div className="w-full space-y-6">
          <Card className="bg-[var(--card)] border border-zinc-800 mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-white">
                  Course Details
                </h1>
                {!studiedCourse ? (
                  <button
                    onClick={handleAddCourse}
                    className="px-4 py-2 rounded-lg bg-teal-600 text-white font-medium
                 hover:bg-teal-500 transition shadow-sm"
                  >
                    + Add Course
                  </button>
                ) : (
                  <button
                    onClick={handleDeleteCourse}
                    className="px-4 py-2 rounded-lg border border-teal-600 bg-zinc-800 text-white font-medium
                 transition shadow-sm"
                  >
                    Remove Course
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {courseCreatorId && channel && (
            <div onClick={() => router.push(`/viewChannel/${courseCreatorId}`)}>
              <ChannelDisplay channel={channel} />
            </div>
          )}

          <ViewCourseCard
            courseId={id as string}
            showSubscribeButton
            isSubscribed={subscribedTo}
            onPressSubscribe={toggleSubscribe}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Units</h2>
              {studiedCourse && (
                <Switch
                  checked={isSwitchOn}
                  onCheckedChange={toggleSwitch}
                  className="data-[state=checked]:bg-teal-500"
                />
              )}
            </div>

            {units.length > 0 ? (
              <div className="space-y-3 rounded-lg bg-[var(--card)] p-4 w-full">
                {units.map((unit) => (
                  <div
                    className={`flex items-center gap-4 bg-[var(--card)] rounded-xl p-4 shadow-sm border cursor-pointer transition ${
                      selectedUnitId === unit.key
                        ? "border-teal-500"
                        : "border-zinc-600 hover:border-teal-500"
                    }`}
                    key={unit.key}
                    onClick={() => handleUnitPress(unit.key)}
                  >
                    {studiedCourse && isSwitchOn && (
                      <button onClick={() => handleUnitToggle(unit.key)}>
                        {studyingUnits.includes(unit.key) ? (
                          <IconCircleCheckFilled className="text-teal-400" />
                        ) : (
                          <IconCircle size={22} className="text-zinc-500" />
                        )}
                      </button>
                    )}

                    <div className="flex-1">
                      <div className="flex justify-between gap-2">
                        <h2 className="text-white text-base break-words min-w-0">
                          {unit.name}
                        </h2>
                      </div>

                      {unit.description && (
                        <p className="text-sm text-zinc-400 whitespace-pre-line">
                          {unit.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No units available.</p>
            )}

            <h2 className="text-xl font-semibold text-white">Questions</h2>
            {!selectedUnitId && (
              <p className="text-sm text-zinc-400">
                Click on a unit to view questions
              </p>
            )}

            {typeof id === "string" && selectedUnitId && (
              <ViewQuestions courseId={id} unitId={selectedUnitId} />
            )}
          </div>

          {studiedCourse && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-white">
                Subscriptions
              </h2>
              <SubscriberList ids={subscribedCourses} link="/viewCourse" />
            </div>
          )}
          {courseCreatorId && (
            <CourseDialog
              open={courseOpen}
              onOpenChange={setCourseOpen}
              onUnitSelect={handleCourseSelect}
              courseOnly={true}
              type={"learning"}
              noCourseMessage="Add a course format to subscribe to this course. Click the plus icon at the top to learn this format or create your own format with your channel."
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
