// src/app/profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { User, Calendar, LogOut, List, PlusCircle, BarChart3, Lock, Brain } from 'lucide-react'; // Added Brain for footer
import { useAuth } from '@/src/context/AuthContext';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { cn } from '@/src/lib/utils';

// Mock data for join date, replace with actual data if available
const mockProfileStats = {
  joinDate: 'Tháng 1, 2024', // Matches image
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const currentYear = new Date().getFullYear();

  return (
    <ProtectedRoute>
      {user && (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <AppHeader currentPage="profile" />

          {/* Main Content */}
          <main className="flex-1 flex flex-col items-center py-12"> {/* Changed to flex-col for tab content alignment */}
            <div className="w-full max-w-3xl px-4">

              {/* Profile Information Card */}
              <Card className="bg-card text-card-foreground border-border shadow-xl">
                <CardContent className="p-6 md:p-8 flex flex-col items-center">
                  {/* Avatar */}
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary mb-6">
                    <User className="h-16 w-16 md:h-20 md:w-20 text-primary" />
                  </div>

                  {/* User Details */}
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">{user.username}</h1>
                  {user.email && <p className="text-muted-foreground mt-1">{user.email}</p>}
                  <p className="text-sm text-muted-foreground mt-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Đã tham gia {mockProfileStats.joinDate}
                  </p>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 w-full">
                    <Link href="/my-quizzes" passHref>
                      <Button variant="outline" className="w-full justify-start text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                        <List className="mr-2 h-5 w-5" /> Quiz của tôi
                      </Button>
                    </Link>
                    <Link href="/quiz/create" passHref>
                      <Button variant="outline" className="w-full justify-start text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                        <PlusCircle className="mr-2 h-5 w-5" /> Tạo Quiz
                      </Button>
                    </Link>
                    <Link href="/reports" passHref> {/* Placeholder link */}
                      <Button variant="outline" className="w-full justify-start text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                        <BarChart3 className="mr-2 h-5 w-5" /> Báo cáo Quiz
                      </Button>
                    </Link>
                    <Link href="/profile/change-password" passHref> {/* Placeholder link */}
                      <Button variant="outline" className="w-full justify-start text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                        <Lock className="mr-2 h-5 w-5" /> Đổi mật khẩu
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Tabs */}
              <div className="mt-10"> {/* Added margin-top to separate card from tabs */}
                <div className="flex border-b border-border">
                  <button
                    className={cn(
                      "px-4 py-3 font-medium transition-colors", // Removed text-lg
                      activeTab === "overview"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setActiveTab("overview")}
                  >
                    Tổng quan
                  </button>
                  {/* Other tabs can be added here */}
                </div>

                {/* Tab Content Area Styling */}
                <div className="py-6 text-foreground"> {/* Use text-foreground for default text color */}
                  {activeTab === 'overview' && (
                    <div>
                      {/* Styled placeholder text */}
                      <p className="text-base">Nội dung tổng quan cho {user.username}.</p>
                      {/* Additional stats/content can be added here later */}
                    </div>
                  )}
                  {/* Placeholder for other tab content if any */}
                  {/* {activeTab === 'statistics' && ( <div>Statistics Content</div> )} */}
                </div>
              </div>
            </div>
          </main>

          {/* Updated Footer */}
          <footer className="bg-background border-t border-border py-8 mt-auto"> {/* Use bg-background and border-border for consistency */}
            <div className="container mx-auto px-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Brain className="h-7 w-7 text-primary" /> {/* Slightly larger icon */}
                <span className="text-xl font-bold text-foreground">VUI QUIZ</span>
              </div>
              <p className="text-sm text-muted-foreground">
                &copy; {currentYear}. Toàn bộ bản quyền thuộc VuiQuiz.com
              </p>
            </div>
          </footer>
        </div>
      )}
    </ProtectedRoute>
  );
}