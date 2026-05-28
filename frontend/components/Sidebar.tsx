'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, FileText, X, Menu } from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth();

  return (
    <div className="h-full flex flex-col bg-white border-l">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Menu</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>

      <div className="flex-1 p-4 space-y-4">
        <Link href="/" className="block">
          <Button className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" />
            Create New Assignment
          </Button>
        </Link>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Recent Assignments</h3>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-gray-50 border hover:bg-gray-100 transition-colors">
              <p className="text-sm font-medium text-gray-900 truncate">Loading...</p>
              <p className="text-xs text-gray-500">Fetching assignments...</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t">
        <p className="text-sm text-gray-500">Logged in as</p>
        <p className="font-medium text-gray-900">{user?.name}</p>
      </div>
    </div>
  );
}