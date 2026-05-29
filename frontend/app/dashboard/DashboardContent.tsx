'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, Clock, Loader2, Trash2, Eye } from 'lucide-react';
import { getToken, getUser } from '@/lib/auth';
import { deleteAssignment as deleteAssignmentAPI } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export default function DashboardContent() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = getToken();
      console.log('Fetching assignments with token:', token ? 'present' : 'missing');

      const response = await fetch(`${API_BASE_URL}/assignments/myassignments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
        return;
      }

      const data = await response.json();
      console.log('API Response:', JSON.stringify(data).substring(0, 500));

      if (data.success && data.data) {
        setAssignments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteAssignmentAPI(id);
      setAssignments(prev => prev.filter(a => a._id !== id));
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      alert('Failed to delete assignment. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'processing':
        return 'bg-blue-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const user = getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Floating Toggle Button - Left Side */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-6 left-6 z-50 p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center gap-1.5">
          <span className={`block w-5 h-0.5 bg-white transition-all ${sidebarOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-5 h-0.5 bg-white transition-all ${sidebarOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-5 h-0.5 bg-white transition-all ${sidebarOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </div>
      </button>

      {/* Overlay - Left Side */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar - Left Side */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white/95 backdrop-blur-sm shadow-2xl z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-indigo-600">Veda AI</h2>
            <p className="text-sm text-gray-500 mt-1">Assignment Generator</p>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <Link href="/" onClick={() => setSidebarOpen(false)}>
              <Button className="w-full justify-start gap-3 bg-indigo-600 hover:bg-indigo-700 text-white py-6">
                <Plus className="h-5 w-5" />
                Create New Assignment
              </Button>
            </Link>

            <div className="pt-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                Recent Assignments
              </h3>
              <div className="space-y-2">
                {assignments.slice(0, 5).map((assignment) => (
                  <Link
                    key={assignment._id}
                    href={`/result?id=${assignment._id}`}
                    onClick={() => setSidebarOpen(false)}
                    className="block p-3 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {assignment.title || 'Untitled'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge className={`text-xs ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatDate(assignment.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))}
                {assignments.length === 0 && !loading && (
                  <p className="text-sm text-gray-400 text-center py-4">No assignments yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="font-medium text-gray-700 truncate">{user?.name || 'User'}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 pl-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here are your recent assignments.</p>
          </div>
          <Link href="/">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-6">
              <Plus className="h-5 w-5" />
              New Assignment
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          </div>
        ) : assignments.length === 0 ? (
          <Card className="text-center py-16 shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardContent>
              <div className="w-20 h-20 mx-auto mb-6 bg-indigo-100 rounded-full flex items-center justify-center">
                <FileText className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No assignments yet</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Create your first assignment and let AI generate questions for you
              </p>
              <Link href="/">
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6">
                  <Plus className="h-5 w-5" />
                  Create Your First Assignment
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignments.map((assignment) => (
              <Card key={assignment._id} className="hover:shadow-xl transition-all duration-300 h-full border-0 bg-white/80 backdrop-blur-sm hover:bg-white hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1 line-clamp-1 text-gray-900">
                        {assignment.title || 'Untitled Assignment'}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-gray-500">
                        {assignment.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(assignment.status)} shrink-0`}>
                      {assignment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {formatDate(assignment.dueDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>Created {formatDate(assignment.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/result?id=${assignment._id}`} className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(assignment._id)}
                      disabled={deletingId === assignment._id}
                      className="border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}