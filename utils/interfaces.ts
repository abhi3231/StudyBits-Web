export interface Answer {
  key: string;
  content: string;
  answer: boolean;
}

export interface Hint {
  key: string;
  title: string;
  content: string;
  image: File | null | string;
}

export interface AnswerHint {
  key: string;
  title: string;
  content: string;
  image: string;
}

export interface Course {
  key: string;
  creator: string;
  picUrl: string;
  name: string;
  description: string;
  lastModified: number;
  numQuestions: number;
  numSubscribers?: number;
  views?: number;
}

export const defaultCourse: Course = {
  key: "",
  creator: "",
  picUrl: "",
  name: "",
  description: "",
  lastModified: new Date().getTime(),
  numQuestions: 0
};

export interface Unit {
  key: string;
  name: string;
  description: string;
  order: number;
}

export interface Channel {
  courses: string[];
  bannerURL: string;
  profilePicURL: string;
  displayName: string;
}

export interface Question {
  id?: string;
  question: string;
  hints: Hint[];
  answers: Answer[];
  course: string;
  unit: string;
  likes?: number;
  dislikes?: number;
  views?: number;
}

export interface EditingQuestion {
  id: string;
  question: string;
  hints: Hint[];
  oldHints: Hint[];
  answers: Answer[];
  course: string;
  unit: string;
  oldCourse: string;
  oldUnit: string;
}

export interface DraftQuestion {
  id: string;
  question: string | "";
  hints: Hint[] | [];
  answers: Answer[] | [];
  course: string;
  unit: string;
}

export interface QuestionInfo {
  question: string;
  hints: AnswerHint[];
  answers: QuestionAnswer[];
  course: string;
  unit: string;
}

export interface QuestionAnswer {
  key: string;
  content: string;
  answer: boolean;
  isSelected: boolean;
}

export interface RawQuestionMetadata {
  course_id: string;
  course_name: string;
  unit_name: string;
  questions: string[];
}

export interface QuestionMetadata {
  courseName: string;
  unitName: string;
  questionId: string;
  courseId: string;
}