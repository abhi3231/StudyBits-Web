"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { CourseDisplay } from "@/components/course-display";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useParams, useRouter } from "next/navigation";
import { Unit } from "@/utils/interfaces";
import { getUnitsForCourse, saveUnit } from "@/services/courseUnitData";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteQuestionsForUnit,
  deleteUnit,
  handleChannelCourseDelete,
} from "@/services/deleteCourseUnitData";
import { useAuth } from "@/hooks/authContext";
import { getChannelData } from "@/services/channelHelpers";
import { classifyUnit } from "@/utils/classify";
import LoadingScreen from "@/components/loading";
import { SiteHeader } from "@/components/site-header";

type EditableUnit = Unit & {
  isNew?: boolean;
  isModified?: boolean;
};
export default function ManageCoursePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [units, setUnits] = useState<EditableUnit[]>([]);
  const [unitSaveLoading, setUnitSaveLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function verifyId() {
      const channelData = await getChannelData(user?.uid as string);
      const courseArray = channelData?.courses;
      if (Array.isArray(courseArray) && !courseArray.includes(id as string)) {
        router.push("/channel");
      }
    }

    async function fetchUnits() {
      if (!id || typeof id !== "string") return;
      const data = await getUnitsForCourse(id);
      setUnits(data);
    }

    verifyId();
    fetchUnits();
  }, [id, router, user?.uid]);

  const handleCourseDelete = async () => {
    await handleChannelCourseDelete(id as string, user?.uid as string);
    router.push("/");
  };

  const handleAddUnit = () => {
    const newUnit: EditableUnit = {
      key: uuidv4(),
      name: "",
      description: "",
      order: units.length,
      isNew: true,
      isModified: true,
    };
    setUnits((prev) => [...prev, newUnit]);
  };

  const updateUnitField = (key: string, field: keyof Unit, value: string) => {
    setUnits((prev) =>
      prev.map((unit) =>
        unit.key === key ? { ...unit, [field]: value, isModified: true } : unit
      )
    );
  };

  const handleDelete = async (unitKey: string) => {
    if (!id || typeof id !== "string") return;

    const target = units.find((u) => u.key === unitKey);
    if (!target) return;

    const confirmed = window.confirm(
      "Do you really want to delete this unit and all its questions?"
    );
    if (!confirmed) return;

    if (target.isNew) {
      setUnits((prev) => prev.filter((unit) => unit.key !== unitKey));
      return;
    }
    await deleteUnit(id, unitKey);
    await deleteQuestionsForUnit(id, unitKey);
    setUnits((prev) => prev.filter((unit) => unit.key !== unitKey));
  };

  const handleSaveAll = async () => {
    if (!id || typeof id !== "string") return;
    setUnitSaveLoading(true);
    const changedUnits = units.filter((u) => u.isNew || u.isModified);

    for (const unit of changedUnits) {
      const cleanUnit: Unit = {
        key: unit.key,
        name: unit.name,
        description: unit.description,
        order: unit.order,
      };
      const tags = await classifyUnit(unit.name);
      if ("tags" in tags && tags.tags.length > 0) {
        await saveUnit(id, cleanUnit, tags.tags);
      }
      else {
        await saveUnit(id, cleanUnit, []);
      }
    }

    setUnits((prev) =>
      prev.map((unit) => ({
        ...unit,
        isNew: false,
        isModified: false,
      }))
    );
    setUnitSaveLoading(false);
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

        <div className="max-w-6xl w-full mx-auto my-6 space-y-6">
          <Card className="bg-[var(--card)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-white">
                  Course Details
                </h1>

                <IconTrash
                  className="w-6 h-6 text-red-500 cursor-pointer"
                  onClick={handleCourseDelete}
                />
              </div>
            </CardContent>
          </Card>

          <CourseDisplay courseId={id as string} link={"/createCourse"}/>

          <div className="bg-[var(--card)] rounded-2xl shadow-md p-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white w-1/3">Units</h1>

            <div className="flex justify-center w-1/3">
              {units.some((u) => u.isNew || u.isModified) &&
                (unitSaveLoading ? (
                  <LoadingScreen />
                ) : (
                  <button
                    onClick={handleSaveAll}
                    className="px-4 py-2 border hover:bg-zinc-700 rounded-xl"
                  >
                    Save All
                  </button>
                ))}
            </div>

            <div className="flex justify-end w-1/3">
              <IconPlus
                className="w-10 h-10 text-white cursor-pointer"
                onClick={handleAddUnit}
              />
            </div>
          </div>

          {units.map((unit) => (
            <div
              key={unit.key}
              className="bg-[var(--card)] rounded-xl p-4 shadow-sm flex flex-col space-y-4"
            >
              <div className="flex items-center space-x-2">
                <Input
                  className="bg-[var(--card)] text-white placeholder-zinc-400 border-zinc-600 flex-1"
                  value={unit.name}
                  placeholder="Unit name"
                  onChange={(e) =>
                    updateUnitField(unit.key, "name", e.target.value)
                  }
                />
                <button
                  onClick={() => handleDelete(unit.key)}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                  title="Delete Unit"
                >
                  <IconTrash />
                </button>
              </div>

              <textarea
                className="bg-[var(--card)] border border-zinc-600 text-white rounded-md w-full p-2 resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-zinc-500"
                value={unit.description}
                onChange={(e) =>
                  updateUnitField(unit.key, "description", e.target.value)
                }
                placeholder="Unit description"
              />
            </div>
          ))}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
