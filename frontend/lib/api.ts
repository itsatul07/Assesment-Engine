import { getToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

interface CreateAssignmentData {
  title: string;
  description: string;
  dueDate: string;
  questionTypes: string[];
  numQuestions: number;
  marksPerQuestion: number;
  additionalInstructions: string;
  fileUrl?: string;
}

export const createAssignment = async (data: CreateAssignmentData | FormData) => {
  const isFormData = data instanceof FormData;
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/assignments`, {
    method: 'POST',
    headers: isFormData
      ? { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      : getHeaders(),
    body: isFormData ? data : JSON.stringify(data),
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error response:', errorText);
    throw new Error('Failed to create assignment');
  }

  return response.json();
};

export const getAssignment = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch assignment');
  }

  return response.json();
};

export const getAssignmentResult = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/assignments/${id}/result`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch assignment result');
  }

  return response.json();
};

export const deleteAssignment = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to delete assignment');
  }

  return response.json();
};
