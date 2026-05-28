import { create } from 'zustand';

export interface Answer {
  section: string;
  questionNumber: number;
  answer: string;
}

export interface Question {
  text: string;
  type: 'MCQ' | 'ShortAnswer' | 'LongAnswer' | 'TrueFalse';
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
  options?: string[];
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface QuestionsResult {
  sections: Section[];
  totalMarks: number;
  generatedAt: string;
}

export interface QuestionPaperResult {
  result_questions: QuestionsResult;
  result_answers: Answer[];
}

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  questionTypes: string[];
  numQuestions: number;
  marksPerQuestion: number;
  additionalInstructions: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: QuestionPaperResult;
  error?: string;
}

interface AssignmentState {
  assignment: Assignment | null;
  status: 'idle' | 'loading' | 'generating' | 'completed' | 'error';
  progress: number;
  error: string | null;

  setAssignment: (assignment: Assignment | null) => void;
  setStatus: (status: 'idle' | 'loading' | 'generating' | 'completed' | 'error') => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useStore = create<AssignmentState>((set) => ({
  assignment: null,
  status: 'idle',
  progress: 0,
  error: null,

  setAssignment: (assignment) => set({ assignment }),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  reset: () => set({
    assignment: null,
    status: 'idle',
    progress: 0,
    error: null,
  }),
}));