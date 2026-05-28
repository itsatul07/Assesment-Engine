'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/store/useStore';
import { createAssignment } from '@/lib/api';
import { initSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Header from '@/components/Header';

const QUESTION_TYPES = [
  { id: 'MCQ', label: 'Multiple Choice (MCQ)' },
  { id: 'ShortAnswer', label: 'Short Answer' },
  { id: 'LongAnswer', label: 'Long Answer' },
  { id: 'TrueFalse', label: 'True/False' },
];

interface QuestionTypeConfig {
  count: number;
  marks: number;
}

export default function AssignmentForm() {
  const router = useRouter();
  const store = useStore();
  const { isAuthenticated } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['MCQ']);
  const [questionTypeConfig, setQuestionTypeConfig] = useState<Record<string, QuestionTypeConfig>>({
    MCQ: { count: 5, marks: 5 },
  });
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useLegacyMode, setUseLegacyMode] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [marksPerQuestion, setMarksPerQuestion] = useState(5);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleQuestionTypeToggle = (type: string) => {
    setQuestionTypes(prev => {
      if (prev.includes(type)) {
        const newTypes = prev.filter(t => t !== type);
        const newConfig: Record<string, QuestionTypeConfig> = {};
        newTypes.forEach(t => {
          if (questionTypeConfig[t]) {
            newConfig[t] = questionTypeConfig[t];
          }
        });
        setQuestionTypeConfig(newConfig);
        return newTypes;
      } else {
        const newTypes = [...prev, type];
        setQuestionTypeConfig(prev => ({
          ...prev,
          [type]: { count: 5, marks: 5 },
        }));
        return newTypes;
      }
    });
  };

  const handleConfigChange = (type: string, field: 'count' | 'marks', value: number) => {
    setQuestionTypeConfig(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Please fill in this field and try again';
    }

    if (!dueDate) {
      newErrors.dueDate = 'Please fill in this field and try again';
    }

    if (questionTypes.length === 0) {
      newErrors.questionTypes = 'Please select at least one question type';
    }

    if (!useLegacyMode) {
      questionTypes.forEach(type => {
        const config = questionTypeConfig[type];
        if (!config || config.count <= 0) {
          newErrors[`${type}-count`] = `Please enter a valid count for ${type}`;
        }
        if (!config || config.marks <= 0) {
          newErrors[`${type}-marks`] = `Please enter valid marks for ${type}`;
        }
      });
    } else {
      if (numQuestions <= 0) {
        newErrors.numQuestions = 'Please enter a valid number of questions';
      }
      if (marksPerQuestion <= 0) {
        newErrors.marksPerQuestion = 'Please enter valid marks per question';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log('Form submitted!');
    console.log('Title:', title);
    console.log('DueDate:', dueDate);
    console.log('QuestionTypes:', questionTypes);
    console.log('QuestionTypeConfig:', questionTypeConfig);
    console.log('UseLegacyMode:', useLegacyMode);

    setIsSubmitting(true);
    store.setError(null);

    try {
      const socket = initSocket();

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('dueDate', dueDate);
      formData.append('questionTypes', JSON.stringify(questionTypes));
      formData.append('additionalInstructions', additionalInstructions);

      if (!useLegacyMode) {
        formData.append('questionTypeConfig', JSON.stringify(questionTypeConfig));
      } else {
        formData.append('numQuestions', String(numQuestions));
        formData.append('marksPerQuestion', String(marksPerQuestion));
      }

      if (sourceFile) {
        formData.append('sourceFile', sourceFile);
      }

      console.log('Sending API request...');
      const result = await createAssignment(formData);
      console.log('API response:', result);

      store.setAssignment(result.data);
      store.setStatus('generating');
      store.setProgress(10);

      socket.emit('join', result.data._id);

      socket.on('job:progress', (data: { status: string; progress: number; result?: unknown }) => {
        store.setProgress(data.progress);
        if (data.status === 'completed') {
          store.setStatus('completed');
          const currentAssignment = store.assignment;
          if (currentAssignment) {
            store.setAssignment({ ...currentAssignment, status: 'completed', result: data.result as any });
          }
          router.push(`/result?id=${result.data._id}`);
        }
      });

      socket.on('job:error', (data: { error: string }) => {
        store.setStatus('error');
        store.setError(data.error);
        setIsSubmitting(false);
      });

      router.push(`/generate?id=${result.data._id}`);
    } catch (err) {
      console.error('Submit error:', err);
      store.setError((err as Error).message);
      store.setStatus('error');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Assignment</h1>
            <p className="text-gray-600 mt-2">Design your assignment and let AI generate the questions</p>
          </div>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>Fill in the details for your AI-powered assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                  }}
                  placeholder="e.g., Mid-term Examination"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the assignment..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: '' }));
                  }}
                  className={errors.dueDate ? 'border-red-500' : ''}
                />
                {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate}</p>}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Question Types *</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="legacyMode"
                      checked={useLegacyMode}
                      onCheckedChange={(checked) => setUseLegacyMode(!!checked)}
                    />
                    <Label htmlFor="legacyMode" className="font-normal text-sm cursor-pointer">
                      Use simple mode
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {QUESTION_TYPES.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.id}
                        checked={questionTypes.includes(type.id)}
                        onCheckedChange={() => {
                          handleQuestionTypeToggle(type.id);
                          if (errors.questionTypes) setErrors(prev => ({ ...prev, questionTypes: '' }));
                        }}
                      />
                      <Label htmlFor={type.id} className="font-normal cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.questionTypes && <p className="text-sm text-red-500">{errors.questionTypes}</p>}
              </div>

              {!useLegacyMode && (
                <div className="space-y-4">
                  <Label>Questions Configuration</Label>
                  {questionTypes.map((type) => (
                    <div key={type} className="grid grid-cols-3 gap-4 items-end ml-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">{QUESTION_TYPES.find(q => q.id === type)?.label}</Label>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`${type}-count`} className="text-xs text-gray-500">Count</Label>
                        <Input
                          id={`${type}-count`}
                          type="number"
                          min={1}
                          value={questionTypeConfig[type]?.count || 0}
                          onChange={(e) => {
                            handleConfigChange(type, 'count', parseInt(e.target.value) || 0);
                            if (errors[`${type}-count`]) setErrors(prev => ({ ...prev, [`${type}-count`]: '' }));
                          }}
                          className={errors[`${type}-count`] ? 'border-red-500' : ''}
                        />
                        {errors[`${type}-count`] && <p className="text-xs text-red-500">{errors[`${type}-count`]}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`${type}-marks`} className="text-xs text-gray-500">Marks each</Label>
                        <Input
                          id={`${type}-marks`}
                          type="number"
                          min={1}
                          value={questionTypeConfig[type]?.marks || 0}
                          onChange={(e) => {
                            handleConfigChange(type, 'marks', parseInt(e.target.value) || 0);
                            if (errors[`${type}-marks`]) setErrors(prev => ({ ...prev, [`${type}-marks`]: '' }));
                          }}
                          className={errors[`${type}-marks`] ? 'border-red-500' : ''}
                        />
                        {errors[`${type}-marks`] && <p className="text-xs text-red-500">{errors[`${type}-marks`]}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {useLegacyMode && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numQuestions">Number of Questions *</Label>
                    <Input
                      id="numQuestions"
                      type="number"
                      min={1}
                      value={numQuestions}
                      onChange={(e) => {
                        setNumQuestions(parseInt(e.target.value) || 0);
                        if (errors.numQuestions) setErrors(prev => ({ ...prev, numQuestions: '' }));
                      }}
                      className={errors.numQuestions ? 'border-red-500' : ''}
                    />
                    {errors.numQuestions && <p className="text-sm text-red-500">{errors.numQuestions}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marksPerQuestion">Marks per Question *</Label>
                    <Input
                      id="marksPerQuestion"
                      type="number"
                      min={1}
                      value={marksPerQuestion}
                      onChange={(e) => {
                        setMarksPerQuestion(parseInt(e.target.value) || 0);
                        if (errors.marksPerQuestion) setErrors(prev => ({ ...prev, marksPerQuestion: '' }));
                      }}
                      className={errors.marksPerQuestion ? 'border-red-500' : ''}
                    />
                    {errors.marksPerQuestion && <p className="text-sm text-red-500">{errors.marksPerQuestion}</p>}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="additionalInstructions">Additional Instructions</Label>
                <Textarea
                  id="additionalInstructions"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="Any specific instructions or requirements..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceFile">Source File (PDF or TXT) - Optional</Label>
                <Input
                  id="sourceFile"
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => setSourceFile(e.target.files?.[0] || null)}
                />
                <p className="text-sm text-gray-500">Upload a PDF or TXT file to extract content for question generation</p>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Assignment...' : 'Generate Questions'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
