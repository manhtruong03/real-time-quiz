// src/app/profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Brain, User, BarChart3, Trophy, Calendar, ArrowUpRight, LogOut } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import type { User as AuthUser } from '@/src/lib/types/auth';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute'; // Import ProtectedRoute
import { Loader2 } from 'lucide-react'; // Import Loader

// Mock data (keep if needed for placeholders)
const mockProfileStats = {
  joinDate: 'Jan 2024',
  totalScore: 0,
  quizzesTaken: 0,
  // ... other stats
};


export default function ProfilePage() {
  const router = useRouter();
  // Removed direct redirect logic from here, ProtectedRoute handles it
  const { user, logout } = useAuth(); // Removed isAuthenticated, isLoading checks here
  const [activeTab, setActiveTab] = useState('overview');


  const handleLogout = () => {
    logout();
    router.push('/login'); // Redirect after logout
  };

  // --- Wrap the main content with ProtectedRoute ---
  return (
    <ProtectedRoute>
      {/* Loading/Guard moved to ProtectedRoute, user is guaranteed here */}
      {/* Render the actual profile content only if authenticated */}
      {user && (
        <div className="min-h-screen flex flex-col">
          {/* Header (will be refactored) */}
          <header className="border-b">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              {/* ... (header content - temporary, will be replaced) ... */}
              <div className="flex items-center gap-2">
                <Link href="/">
                  <div className="flex items-center gap-2">
                    <Brain className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold">VUI QUIZ</h1>
                  </div>
                </Link>
              </div>
              <nav className="hidden md:flex gap-6">
                <Link href="/" className="font-medium hover:text-primary">Home</Link>
                <Link href="/categories" className="font-medium hover:text-primary">Categories</Link>
                <Link href="/leaderboard" className="font-medium hover:text-primary">Leaderboard</Link>
                <Link href="/profile" className="font-medium text-primary">Profile</Link>
              </nav>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                {/* Profile Header */}
                <div className="bg-card rounded-xl p-6 shadow-sm mb-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
                  {/* ... (profile header content using 'user') ... */}
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-bold">{user.username}</h1>
                    <p className="text-muted-foreground">{user.email}</p>
                    {/* Use mockProfileStats for placeholders */}
                    <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                      <Badge variant="outline" className="gap-1"><Calendar className="h-3 w-3" /> Joined {mockProfileStats.joinDate}</Badge>
                      {/* Add other stats */}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/creator/quiz"><Button>My Quizzes</Button></Link>
                    <Link href="/quiz/create"><Button>Create Quiz</Button></Link>
                  </div>
                </div>

                {/* Profile Tabs */}
                <div className="flex border-b mb-8">
                  <button
                    className={`px-4 py-2 font-medium ${activeTab === "overview" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                    onClick={() => setActiveTab("overview")}
                  >Overview</button>
                  {/* Other tabs */}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div>
                    <p>Overview content for {user.username}.</p>
                    <p className='mt-4 italic'>More profile details and stats will be added later.</p>
                  </div>
                )}
                {/* Other tab content */}
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-muted/30 border-t py-8">
            <div className="container mx-auto px-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">VUI QUIZ</span>
              </div>
              <p className="text-muted-foreground text-sm">
                &copy; {new Date().getFullYear()} VUI QUIZ. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      )}
    </ProtectedRoute>
  );
}