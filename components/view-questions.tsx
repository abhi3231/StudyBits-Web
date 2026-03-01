"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconEye,
  IconPencil,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react";

import { Question } from "@/utils/interfaces";
import { getQuestionsForCourseUnit } from "@/services/questionData";
import LoadingScreen from "./loading";

type ViewQuestionsProps = {
  courseId: string;
  unitId: string;
};

export function ViewQuestions({ courseId, unitId }: ViewQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      try {
        const data = await getQuestionsForCourseUnit(courseId, unitId, false);
        setQuestions(data);
      } catch {
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }

    if (!courseId || !unitId) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    loadQuestions();
  }, [courseId, unitId]);

  const viewRedirect = (questionId: string) => {
    router.push(`/answer/${questionId}`);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6">

      {questions.length === 0 ? (
        <p className="text-zinc-400">No questions for this unit</p>
      ) : (
        questions.map((question) => (
          <div
            key={question.id as string}
            className="bg-[var(--card)] rounded-xl p-4 shadow-sm flex items-center justify-between space-x-4"
          >
            <div className="flex-1 overflow-hidden max-w-full">
              <p className="text-white text-sm break-words whitespace-pre-wrap overflow-hidden line-clamp-3">
                {question.question}
              </p>

              <div className="flex items-center gap-4 mt-2 text-zinc-400 text-xs">
                {question.likes !== undefined && (
                  <div className="flex items-center gap-1">
                    <IconThumbUp className="w-4 h-4" />
                    <span>{question.likes}</span>
                  </div>
                )}
                {question.dislikes !== undefined && (
                  <div className="flex items-center gap-1">
                    <IconThumbDown className="w-4 h-4" />
                    <span>{question.dislikes}</span>
                  </div>
                )}
                {question.views !== undefined && (
                  <div className="flex items-center gap-1">
                    <IconPencil className="w-4 h-4" />
                    <span>{question.views}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => viewRedirect(question.id as string)}
              className="p-2 rounded-lg bg-zinc-600 hover:bg-zinc-500"
              title="View Question"
            >
              <IconEye className="w-5 h-5 text-white" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
