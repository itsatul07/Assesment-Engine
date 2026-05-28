'use client';

import { Badge } from '@/components/ui/badge';
import { QuestionPaperResult, Answer } from '@/store/useStore';
import QuestionCard from './QuestionCard';

interface QuestionPaperProps {
  result: QuestionPaperResult;
}

export default function QuestionPaper({ result }: QuestionPaperProps) {
  const { result_questions, result_answers } = result;
  const answers = result_answers || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-8">
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Question Paper</h2>
        <p className="text-gray-600 mt-1">Total Marks: {result_questions.totalMarks}</p>
        <p className="text-sm text-gray-500 mt-1">
          Generated on: {new Date(result_questions.generatedAt).toLocaleDateString()}
        </p>
      </div>

      {result_questions.sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
              <Badge variant="secondary">
                {section.questions.length} Questions
              </Badge>
            </div>
            <p className="text-gray-600 italic">{section.instruction}</p>
          </div>

          <div className="space-y-3">
            {section.questions.map((question, questionIndex) => {
              const answerEntry = answers.find(
                (a: Answer) =>
                  (a.section === section.title ||
                    a.section.includes(section.title.split(' - ')[0]) ||
                    section.title.includes(a.section.split(' - ')[0])) &&
                  a.questionNumber === questionIndex + 1
              );
              return (
                <QuestionCard
                  key={questionIndex}
                  question={question}
                  index={questionIndex}
                  answer={answerEntry?.answer}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}