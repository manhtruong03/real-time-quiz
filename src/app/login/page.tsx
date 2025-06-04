// src/app/login/page.tsx
"use client";

import type React from 'react';
import { useState, useEffect } from 'react'; // Import useEffect
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Form } from '@/src/components/ui/form';
import { RHFTextField } from '@/src/components/rhf/RHFTextField';
import { Brain } from 'lucide-react';
import { loginUser } from '@/src/lib/api/auth';
import { LoginSchema, LoginSchemaType } from '@/src/lib/schemas/auth.schema';
import { useToast } from '@/src/hooks/use-toast';
import { useAuth } from '@/src/context/AuthContext'; // Import useAuth
import { AppHeader } from '@/src/components/layout/AppHeader';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Get login function and auth state

  const [isLoading, setIsLoading] = useState(false); // Keep for API call loading state
  const [error, setError] = useState('');

  const formMethods = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: '', password: '' },
  });

  // Redirect if already authenticated (and not just loading the initial auth state)
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      console.log("[LoginPage] Already authenticated, redirecting...");
      router.push('/profile'); // Or your desired authenticated landing page
    }
  }, [isAuthenticated, isAuthLoading, router]);


  const handleLogin = async (data: LoginSchemaType) => {
    setIsLoading(true);
    setError('');
    console.log('Login attempt with (validated):', data);

    try {
      const response = await loginUser(data);
      console.log('Login successful:', response);

      // --- Call context login function ---
      login(response);
      // --- End context call ---

      toast({
        title: 'Đăng nhập thành công',
        description: `Chào mừng trở lại, ${response.username}!`,
      });

      router.push('/profile');
    } catch (err: any) {
      console.error('Login failed:', err);
      const errorMessage = err.message || 'Tên người dùng hoặc mật khẩu không hợp lệ. Vui lòng thử lại.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Đăng nhập thất bại',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Display loading or null if initial auth check is running and user might be logged in
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Đang tải xác thực...
      </div>
    ); // Or a spinner component
  }
  // Don't render the form if already authenticated (avoids flash)
  if (isAuthenticated) {
    return null;
  }


  return (
    // Layout structure remains similar
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <AppHeader />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Đăng nhập</CardTitle>
              <CardDescription className="text-center">
                Nhập thông tin đăng nhập để truy cập tài khoản của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...formMethods}>
                <form
                  onSubmit={formMethods.handleSubmit(handleLogin)}
                  className="space-y-4"
                >
                  {error && (
                    <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
                      {error}
                    </div>
                  )}
                  <RHFTextField<LoginSchemaType>
                    name="username"
                    label="Tên tài khoản"
                    type="text"
                    placeholder="Tên tài khoản của bạn"
                    required
                    disabled={isLoading} // Disable during API call
                  />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {/* Label is inside RHFTextField */}
                    </div>
                    <RHFTextField<LoginSchemaType>
                      name="password"
                      label="Mật khẩu"
                      type="password"
                      required
                      disabled={isLoading} // Disable during API call
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm">
                Chưa có tài khoản?{' '}
                <Link href="/signup" className="text-primary hover:underline">
                  Đăng ký
                </Link>
              </div>
            </CardFooter>
          </Card>
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
  );
}