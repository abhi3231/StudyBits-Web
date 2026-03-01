"use client";

import { useEffect, useRef, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  IconPlus,
  IconCheck,
  IconTrash,
  IconPencil,
} from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import {
  Answer,
  Course,
  EditingQuestion,
  Hint,
  Unit,
} from "@/utils/interfaces";
import { AdditionalInfoDialog } from "@/components/questionPortal/additional-info-dialog";
import { useAuth } from "@/hooks/authContext";
import {
  addTagsToQuestion,
  convertHintsForUpload,
  draftToPublish,
  editDraft,
  getQuestionDataWithId,
  handleHintImages,
  publishToDraft,
  submitDraft,
  submitEditedQuestion,
  submitNewQuestion,
} from "@/services/questionPortalHelpers";
import { CourseDialog } from "@/components/course-unit-selector";
import { FinalDialog } from "@/components/questionPortal/final-dialog";
import { notFound, useParams, useRouter } from "next/navigation";
import { getCourseData, getUnitForCourse } from "@/services/courseUnitData";
import { classifyQuestion } from "@/utils/classify";
import LoadingScreen from "@/components/loading";
import { SiteHeader } from "@/components/site-header";

export default function QuestionPortal() {
  const [id, setId] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [hints, setHints] = useState<Hint[]>([]);
  const [originalHints, setOriginalHints] = useState<Hint[]>([]);
  const [editingHint, setEditingHint] = useState<Hint | null>(null);
  const [originalCourse, setOriginalCourse] = useState<string>("");
  const [originalUnit, setOriginalUnit] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [courseOpen, setCourseOpen] = useState(false);
  const [showAdditionalInfoDialog, setShowAdditionalInfoDialog] =
    useState(false);
  const [questionType, setQuestionType] = useState<"draft" | "publish" | null>(
    null
  );
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [final, setFinal] = useState(false);
  const { user } = useAuth();
  const params = useParams();
  const idParam = params?.id;
  const router = useRouter();
  const questionRef = useRef<HTMLTextAreaElement | null>(null);
  const answerRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (questionRef.current) {
      questionRef.current.style.height = "auto";
      questionRef.current.style.height = `${questionRef.current.scrollHeight}px`;
    }
  }, [question]);

  useEffect(() => {
    answers.forEach((ans) => {
      const ref = answerRefs.current[ans.key];
      if (ref) {
        ref.style.height = "auto";
        ref.style.height = `${ref.scrollHeight}px`;
      }
    });
  }, [answers]);

  useEffect(() => {
    if (Array.isArray(idParam) && idParam.length === 2) {
      const [type, questionId] = idParam;
      if (
        (type === "draft" || type === "publish") &&
        typeof questionId === "string"
      ) {
        setQuestionType(type);
        setId(questionId);
      }
    } else if (typeof idParam === "string") {
      setId(idParam);
    }
  }, [idParam]);

  useEffect(() => {
    const handleEditing = async () => {
      if (!id || typeof id !== "string") return;

      try {
        const isDraft = questionType === "draft";
        const questionData = await getQuestionDataWithId(id, isDraft);
        if (!questionData) throw new Error("No question data");

        const questionCourse = questionData.course;
        const questionUnit = questionData.unit;

        let course: Course | null = null;
        try {
          course = await getCourseData(questionCourse);
        } catch (err) {
          console.error("Error loading course:", err);
          router.push("/questionPortal");
          return;
        }

        if (!course || course.creator !== user?.uid) {
          console.error("Error with creator:");
          router.push("/questionPortal");
          return;
        }

        const unit = await getUnitForCourse(questionCourse, questionUnit);
        if (!unit) throw new Error("No unit found");

        setAnswers(questionData.answers || []);
        setHints(questionData.hints || []);
        setOriginalHints(questionData.hints || []);
        setQuestion(questionData.question || "");
        setOriginalCourse(questionCourse || "");
        setOriginalUnit(questionUnit || "");
        setSelectedCourse(course || null);
        setSelectedUnit(unit);
      } catch (error) {
        console.error("handleEditing failed:", error);
        setError(true);
      }
    };
    handleEditing();
  }, [id, questionType, router, user]);

  const handleHintSubmit = (hint: Hint) => {
    setHints((prev) => {
      const index = prev.findIndex((h) => h.key === hint.key);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = hint;
        return updated;
      }
      return [...prev, hint];
    });
    setEditingHint(null);
  };

  const addAnswer = () => {
    setAnswers((prev) => [
      ...prev,
      {
        key: uuidv4(),
        content: "",
        answer: false,
      },
    ]);
  };

  const updateContent = (key: string, newContent: string) => {
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.key === key ? { ...ans, content: newContent } : ans
      )
    );
  };

  const toggleCorrect = (key: string) => {
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.key === key ? { ...ans, answer: !ans.answer } : ans
      )
    );
  };

  const deleteAnswer = (key: string) => {
    setAnswers((prev) => prev.filter((ans) => ans.key !== key));
  };

  const deleteHint = (key: string) => {
    setHints((prev) => prev.filter((hint) => hint.key !== key));
  };

  const handleUnitSelect = (course: Course, unit: Unit | null) => {
    if (!unit) return;
    setSelectedCourse(course);
    setSelectedUnit(unit);
  };

  const handleSubmit = async () => {
    const hasCorrectAnswer = answers.some((answer) => answer.answer);
    if (!question.trim() || answers.length < 2 || !hasCorrectAnswer) {
      alert(
        "Please ensure you have a question, at least two answer choices, and one correct answer."
      );
      return;
    }
    setLoading(true);
    let status: "error" | { status: "success"; id: string } = "error";
    if (selectedCourse && selectedUnit) {
      if (id === "") {
        const fullHints = await convertHintsForUpload(hints);
        status = await submitNewQuestion({
          question: question.trim(),
          hints: fullHints,
          answers,
          course: selectedCourse.key,
          unit: selectedUnit.key,
        });
      } else {
        const editingQuestion: EditingQuestion = {
          id: id,
          question: question.trim(),
          hints: hints,
          oldHints: originalHints,
          answers,
          course: selectedCourse.key,
          unit: selectedUnit.key,
          oldCourse: originalCourse,
          oldUnit: originalUnit,
        };
        status = await submitEditedQuestion(editingQuestion);
      }

      if (status === "error") {
        alert(
          "There was an error! Most likely, you are editing an invalid question."
        );
        setLoading(false);
      } else {
        const tags = await classifyQuestion(status.id);
        if ("tags" in tags && tags.tags.length > 0) {
          addTagsToQuestion(status.id, tags.tags);
          setLoading(false);
          router.push(`/questionPortal/publish/${status.id}`);
        } else {
          alert(
            "Your question was saved, but there was an error! Save it again."
          );
        }
        setLoading(false);
      }
    }
  };

  const handleNewDraft = async () => {
    setLoading(true);
    const fullHints = await convertHintsForUpload(hints);
    if (selectedCourse && selectedUnit) {
      setQuestionType("draft");
      const status = await submitDraft({
        question: question.trim(),
        hints: fullHints,
        answers,
        course: selectedCourse.key,
        unit: selectedUnit.key,
        id: "",
      });
      if (status === "error") {
        alert(
          "There was an error! Most likely, you did not select a course and unit."
        );
        setLoading(false);
      }
      if (status === "success") {
        setLoading(false);
        router.push(`/questionPortal/draft/${id}`);
      }
    } else {
      alert("Please select a course and unit before saving as draft.");
      setLoading(false);
    }
  };

  const handleEditingDraft = async () => {
    setLoading(true);
    const fullHints = await handleHintImages(hints, originalHints);
    if (selectedCourse && selectedUnit) {
      setQuestionType("draft");
      const status = await editDraft({
        id,
        question: question.trim(),
        hints: fullHints,
        answers,
        course: selectedCourse.key,
        unit: selectedUnit.key,
        oldCourse: originalCourse,
        oldUnit: originalUnit,
      });
      if (status === "error") {
        setLoading(false);
        alert(
          "There was an error! Most likely, you did not select a course and unit."
        );
      }
      if (status === "success") {
        setLoading(false);
        setFinal(true);
      }
    } else {
      setLoading(false);
      alert("Please select a course and unit before saving as draft.");
    }
  };

  const fromDraftToPublish = async () => {
    if (selectedCourse && selectedUnit) {
      setLoading(true);
      alert("Save all changes as a draft before proceeding.");
      const confirmed = window.confirm("Do you want to proceed?");
      if (!confirmed) return;
      await draftToPublish(id, selectedCourse.key, selectedUnit.key);
      const tags = await classifyQuestion(id);
      if ("tags" in tags && tags.tags.length > 0) {
        addTagsToQuestion(id, tags.tags);
        setLoading(false);
        router.push(`/questionPortal/publish/${id}`);
      } else {
        setLoading(false);
        alert(
          "Your question was saved, but there was an error! Save it again."
        );
      }
    }
  };

  const fromPublishToDraft = async () => {
    if (selectedCourse && selectedUnit) {
      setLoading(true);
      alert("Publish all changes before proceeding.");
      const confirmed = window.confirm("Do you want to proceed?");
      if (!confirmed) return;
      publishToDraft(id, selectedCourse.key, selectedUnit.key);
      setLoading(false);
      router.push(`/questionPortal/draft/${id}`);
    }
  };

  if (error) {
    notFound();
  }

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
      <SidebarInset className="p-6 space-y-4 min-h-screen">
        <SiteHeader />

        <div
          className={
            "inline-block px-3 py-1 rounded-md text-sm font-medium bg-[var(--card)] text-white"
          }
        >
          {questionType === "publish"
            ? "Published"
            : questionType === "draft"
            ? "Draft"
            : "Unsaved"}
        </div>

        <div className="bg-[var(--card)] rounded-2xl shadow-md p-4">
          <h1 className="text-xl font-semibold text-white mb-2">Question</h1>
          <textarea
            ref={questionRef}
            className="bg-zinc-800 text-white placeholder-zinc-400 border border-zinc-700 rounded-md p-2 w-full resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-zinc-500"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
            placeholder="Type your question here..."
            rows={1}
          />
        </div>

        <div className="bg-[var(--card)] rounded-2xl shadow-md p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Course & Unit</h1>
          <IconPencil
            className="w-10 h-10 text-white cursor-pointer"
            onClick={() => setCourseOpen(true)}
          />
          <CourseDialog
            open={courseOpen}
            onOpenChange={setCourseOpen}
            onUnitSelect={handleUnitSelect}
            type={"channel"}
            noCourseMessage="Create a course with units to make questions."
          />
        </div>

        {selectedCourse && selectedUnit && (
          <div className="flex items-center gap-4 bg-[var(--card)] rounded-2xl border border-zinc-700 p-4">
            <div>
              <p className="text-lg font-semibold text-white">
                {selectedCourse.name}
              </p>
              <p className="text-sm text-zinc-400">{selectedUnit.name}</p>
            </div>
          </div>
        )}

        <div className="bg-[var(--card)] rounded-2xl shadow-md p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Additional Info</h1>
          <IconPlus
            className="w-10 h-10 text-white cursor-pointer"
            onClick={() => setShowAdditionalInfoDialog(true)}
          />
        </div>

        {hints.map((hint) => (
          <div
            key={hint.key}
            className="bg-[var(--card)] text-white rounded-xl shadow-md p-4 relative pr-20 space-y-3"
          >
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => {
                  setShowAdditionalInfoDialog(true);
                  setEditingHint(hint);
                }}
                className="p-1 text-blue-400 hover:text-blue-200"
                title="Edit Hint"
              >
                <IconPencil />
              </button>

              <button
                onClick={() => deleteHint(hint.key)}
                className="p-1 text-red-400 hover:text-red-200"
                title="Delete Hint"
              >
                <IconTrash />
              </button>
            </div>

            {hint.title && (
              <h2 className="text-lg font-semibold whitespace-pre-wrap break-words">
                {hint.title}
              </h2>
            )}

            {hint.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  typeof hint.image === "string"
                    ? hint.image
                    : URL.createObjectURL(hint.image)
                }
                alt={hint.title || "Hint Image"}
                className="w-full max-h-64 object-contain rounded-md border border-zinc-700"
              />
            )}

            {hint.content && (
              <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">
                {hint.content}
              </p>
            )}
          </div>
        ))}

        <AdditionalInfoDialog
          open={showAdditionalInfoDialog}
          onOpenChange={(val) => {
            setShowAdditionalInfoDialog(val);
            if (!val) setEditingHint(null);
          }}
          onSubmit={handleHintSubmit}
          initialData={editingHint}
        />

        <div className="bg-[var(--card)] rounded-2xl shadow-md p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Answer Choices</h1>
          <IconPlus
            className="w-10 h-10 text-white cursor-pointer"
            onClick={addAnswer}
          />
        </div>

        {answers.map((ans, index) => (
          <div
            key={ans.key}
            className="bg-[var(--card)] rounded-xl p-4 shadow-sm flex items-center justify-between space-x-4"
          >
            <textarea
              ref={(el) => {
                answerRefs.current[ans.key] = el;
              }}
              className="bg-[var(--card)] text-white placeholder-zinc-400 border border-zinc-600 rounded-md p-2 w-full resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-zinc-500"
              placeholder={`Answer Choice ${index + 1}`}
              value={ans.content}
              onChange={(e) => {
                updateContent(ans.key, e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
              rows={1}
            />
            <div className="flex space-x-2">
              <button
                onClick={() => toggleCorrect(ans.key)}
                className={`p-2 rounded-lg ${
                  ans.answer
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-zinc-600 hover:bg-zinc-500"
                }`}
                title={ans.answer ? "Correct Answer" : "Mark as Correct"}
              >
                <IconCheck className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => deleteAnswer(ans.key)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                title="Delete Answer"
              >
                <IconTrash />
              </button>
            </div>
          </div>
        ))}
        <FinalDialog open={final} onOpenChange={setFinal} />

        {questionType === null &&
          (loading ? (
            <LoadingScreen />
          ) : (
            <div className="mt-10 flex justify-center gap-4">
              <button
                className="bg-zinc-100 text-black px-6 py-2 rounded-md shadow border border-gray-300 hover:bg-zinc-200 transition"
                onClick={handleNewDraft}
              >
                Save as Draft
              </button>

              <button
                onClick={handleSubmit}
                className="bg-black text-white px-6 py-2 rounded-md shadow hover:bg-gray-800 transition"
              >
                Publish
              </button>
            </div>
          ))}

        {questionType === "draft" &&
          (loading ? (
            <LoadingScreen />
          ) : (
            <div className="mt-10 flex justify-center gap-4">
              <button
                className="bg-zinc-100 text-black px-6 py-2 rounded-md shadow border border-gray-300 hover:bg-zinc-200 transition"
                onClick={handleEditingDraft}
              >
                Save changes as Draft
              </button>

              <button
                onClick={fromDraftToPublish}
                className="bg-black text-white px-6 py-2 rounded-md shadow hover:bg-gray-800 transition"
              >
                Publish
              </button>
            </div>
          ))}

        {questionType === "publish" &&
          (loading ? (
            <LoadingScreen />
          ) : (
            <div className="mt-10 flex justify-center gap-4">
              <button
                className="bg-zinc-100 text-black px-6 py-2 rounded-md shadow border border-gray-300 hover:bg-zinc-200 transition"
                onClick={fromPublishToDraft}
              >
                Convert to Draft
              </button>

              <button
                onClick={handleSubmit}
                className="bg-black text-white px-6 py-2 rounded-md shadow hover:bg-gray-800 transition"
              >
                Publish Changes
              </button>
            </div>
          ))}
      </SidebarInset>
    </SidebarProvider>
  );
}
