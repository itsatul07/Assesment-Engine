'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { initSocket, disconnectSocket } from '@/lib/socket';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { getAssignment } from '@/lib/api';

export default function GenerateContent() {
  const searchParams = useSearchParams();
  const { assignment, status, progress, error, setAssignment, setStatus, setProgress, setError } = useStore();
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    const assignmentId = searchParams.get('id');
    if (!assignmentId) return;

    // Fetch assignment if not in store
    if (!assignment || assignment._id !== assignmentId) {
      getAssignment(assignmentId)
        .then((data) => {
          if (data.success && data.data) {
            setAssignment(data.data);
            if (data.data.status === 'completed') {
              setStatus('completed');
            } else if (data.data.status === 'failed') {
              setError('Generation failed');
              setStatus('error');
            }
          }
        })
        .catch(console.error);
    }

    const socket = initSocket();
    socket.emit('join', assignmentId);

    socket.on('job:progress', (data: { status: string; progress: number }) => {
      setProgress(data.progress);
      if (data.status === 'processing') {
        setStatusText('Generating questions using AI...');
      } else if (data.status === 'completed') {
        setStatusText('Generation complete!');
        setStatus('completed');
      }
    });

    socket.on('job:error', (data: { error: string }) => {
      setError(data.error);
      setStatus('error');
    });

    return () => {
      disconnectSocket();
    };
  }, [searchParams]);

  const getStatusIcon = () => {
    switch (status) {
      case 'generating':
        return <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />;
      case 'completed':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />;
    }
  };

  const getStatusMessage = () => {
    if (error) return `Error: ${error}`;
    if (status === 'completed') return 'Your question paper is ready!';
    if (status === 'generating') return statusText || 'Processing...';
    return 'Preparing...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-0 bg-white/90 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-indigo-600">Generating Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="flex flex-col items-center gap-4 py-4">
            {getStatusIcon()}
            <p className="text-center text-gray-600 font-medium">{getStatusMessage()}</p>
          </div>

          {status === 'generating' && (
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-500">{progress}% complete</p>
            </div>
          )}

          {assignment && (
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <h3 className="font-semibold text-indigo-900">{assignment.title}</h3>
              <p className="text-sm text-indigo-600 mt-1">
                {assignment.numQuestions} questions
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {status === 'completed' && assignment && (
              <Link href={`/result?id=${assignment._id}`} className="flex-1">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">View Question Paper</Button>
              </Link>
            )}
            {status === 'error' && (
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">Try Again</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}