'use client';

import { Question } from '@/store/useStore';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface QuestionCardProps {
  question: Question;
  index: number;
  answer?: string;
}

const difficultyColors = {
  Easy: 'bg-green-100 text-green-800 border-green-300',
  Moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Hard: 'bg-red-100 text-red-800 border-red-300',
};

export default function QuestionCard({ question, index, answer }: QuestionCardProps) {
  const [showAns, setShowAns] = useState(false);

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700">Q{index + 1}.</span>
          <span className="text-gray-900">{question.text}</span>
        </div>
        <div className="flex items-center gap-2">
          {answer && (
            <button
              onClick={() => setShowAns(!showAns)}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              {showAns ? 'Hide Answer' : 'Show Answer'}
            </button>
          )}
          <Badge
            variant="outline"
            className={`${difficultyColors[question.difficulty]} border font-medium`}
          >
            {question.difficulty}
          </Badge>
        </div>
      </div>

      {question.type === 'MCQ' && question.options && (
        <div className="grid grid-cols-2 gap-2 ml-6">
          {question.options.map((option, i) => (
            <div key={i} className="flex items-center gap-2 text-gray-700">
              <span className="text-gray-500">{String.fromCharCode(65 + i)}.</span>
              <span>{option}</span>
            </div>
          ))}
        </div>
      )}

      {question.type === 'TrueFalse' && (
        <div className="flex gap-4 ml-6">
          <span className="text-gray-700">True</span>
          <span className="text-gray-700">False</span>
        </div>
      )}

      <div className="flex justify-end">
        <span className="text-sm font-medium text-gray-600">
          [{question.marks} {question.marks === 1 ? 'mark' : 'marks'}]
        </span>
      </div>

      {showAns && answer && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <span className="font-semibold text-green-800">Answer: </span>
          <span className="text-green-700">{answer}</span>
        </div>
      )}
    </div>
  );
}