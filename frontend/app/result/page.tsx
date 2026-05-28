'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore, QuestionPaperResult } from '@/store/useStore';
import { getAssignmentResult } from '@/lib/api';
import QuestionPaper from '@/components/QuestionPaper';
import { jsPDF } from 'jspdf';
import { Download, RefreshCw, ArrowLeft, FileText, Key } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { assignment } = useStore();
  const { isAuthenticated, isLoading } = useAuth();
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    rollNo: '',
    section: '',
  });
  const [result, setResult] = useState<QuestionPaperResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const assignmentId = searchParams.get('id');
    if (!assignmentId) return;

    const fetchResult = async () => {
      try {
        const response = await getAssignmentResult(assignmentId);
        if (response.success && response.data) {
          setResult(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch result:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [searchParams]);

  const downloadQuestionsPDF = async () => {
    if (!result) return;
    setDownloading(true);

    try {
      const doc = new jsPDF();
      let yPos = 20;
      const questions = result.result_questions;

      doc.setFontSize(20);
      doc.text('Question Paper', 105, yPos, { align: 'center' });
      yPos += 15;

      doc.setFontSize(12);
      doc.text(`Total Marks: ${questions.totalMarks}`, 105, yPos, { align: 'center' });
      yPos += 10;
      doc.text(`Generated: ${new Date(questions.generatedAt).toLocaleDateString()}`, 105, yPos, { align: 'center' });
      yPos += 15;

      if (studentInfo.name || studentInfo.rollNo || studentInfo.section) {
        doc.setFontSize(10);
        doc.text('Student Info:', 10, yPos);
        yPos += 7;
        if (studentInfo.name) doc.text(`Name: ${studentInfo.name}`, 15, yPos);
        yPos += 5;
        if (studentInfo.rollNo) doc.text(`Roll No: ${studentInfo.rollNo}`, 15, yPos);
        yPos += 5;
        if (studentInfo.section) doc.text(`Section: ${studentInfo.section}`, 15, yPos);
        yPos += 10;
      }

      doc.setLineWidth(0.5);
      doc.line(10, yPos, 200, yPos);
      yPos += 10;

      questions.sections.forEach((section) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(section.title, 10, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(section.instruction, 15, yPos);
        yPos += 8;

        section.questions.forEach((question, index) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(`${index + 1}. ${question.text}`, 15, yPos);
          yPos += 6;

          if (question.type === 'MCQ' && question.options) {
            question.options.forEach((option, optIndex) => {
              doc.setFontSize(10);
              doc.text(`    ${String.fromCharCode(65 + optIndex)}. ${option}`, 20, yPos);
              yPos += 5;
            });
          }

          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(`[${question.marks} marks] [${question.difficulty}]`, 15, yPos);
          yPos += 8;
        });

        yPos += 5;
      });

      doc.save('question-paper.pdf');
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const downloadAnswersPDF = async () => {
    if (!result) return;
    setDownloading(true);

    try {
      const doc = new jsPDF();
      let yPos = 20;
      const answers = result.result_answers || [];

      doc.setFontSize(20);
      doc.text('Answer Key', 105, yPos, { align: 'center' });
      yPos += 10;
      doc.setFontSize(12);
      doc.text('Confidential - For Teacher Reference Only', 105, yPos, { align: 'center' });
      yPos += 15;

      const groupedAnswers: Record<string, { questionNumber: number; answer: string }[]> = {};
      answers.forEach((item) => {
        if (!groupedAnswers[item.section]) {
          groupedAnswers[item.section] = [];
        }
        groupedAnswers[item.section].push({
          questionNumber: item.questionNumber,
          answer: item.answer,
        });
      });

      Object.entries(groupedAnswers).forEach(([section, items]) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(0, 100, 0);
        doc.text(section, 10, yPos);
        yPos += 8;

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        items.forEach((item) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`Q${item.questionNumber}: ${item.answer}`, 15, yPos);
          yPos += 7;
        });

        yPos += 5;
      });

      doc.save('answer-key.pdf');
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleRegenerate = () => {
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">No result found</p>
            <Link href="/">
              <Button>Create New Assignment</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = result.result_questions;
  const answers = result.result_answers || [];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Question Paper Preview</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Enter student details (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter name"
                  value={studentInfo.name}
                  onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNo">Roll Number</Label>
                <Input
                  id="rollNo"
                  placeholder="Enter roll number"
                  value={studentInfo.rollNo}
                  onChange={(e) => setStudentInfo({ ...studentInfo, rollNo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  placeholder="Enter section"
                  value={studentInfo.section}
                  onChange={(e) => setStudentInfo({ ...studentInfo, section: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
              activeTab === 'questions'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="h-4 w-4" />
            Questions
          </button>
          <button
            onClick={() => setActiveTab('answers')}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
              activeTab === 'answers'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Key className="h-4 w-4" />
            Answers
          </button>
        </div>

        {activeTab === 'questions' ? (
          <QuestionPaper result={result} />
        ) : (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Answer Key</CardTitle>
              <CardDescription className="text-green-600">
                Confidential - For Teacher Reference Only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.sections.map((section) => {
                  const sectionAnswers = answers.filter((a) =>
                    a.section === section.title ||
                    a.section.includes(section.title.split(' - ')[0]) ||
                    section.title.includes(a.section.split(' - ')[0])
                  );
                  if (sectionAnswers.length === 0) {
                    return (
                      <div key={section.title} className="space-y-2">
                        <h4 className="font-semibold text-green-800">{section.title}</h4>
                        <p className="text-gray-500 text-sm">No answers found for this section</p>
                      </div>
                    );
                  }
                  return (
                    <div key={section.title} className="space-y-2">
                      <h4 className="font-semibold text-green-800">{section.title}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {sectionAnswers.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <span className="font-medium text-green-700">Q{item.questionNumber}:</span>
                            <span className="text-green-900">{item.answer}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={handleRegenerate}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Create New
          </Button>
          <Button
            onClick={downloadQuestionsPDF}
            disabled={downloading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Downloading...' : 'Download Questions'}
          </Button>
          <Button
            onClick={downloadAnswersPDF}
            disabled={downloading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            Download Answers
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}

export default function ResultPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>}>
      <ResultContent />
    </Suspense>
  );
}