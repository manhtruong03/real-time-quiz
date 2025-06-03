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
import { useToast } from '@/src/components/ui/use-toast';
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
        title: 'Login Successful',
        description: `Welcome back, ${response.username}!`,
      });

      router.push('/profile');
    } catch (err: any) {
      console.error('Login failed:', err);
      const errorMessage = err.message || 'Invalid username or password. Please try again.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
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
        Loading authentication...
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
              <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
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
                    label="Username"
                    type="text"
                    placeholder="Your username"
                    required
                    disabled={isLoading} // Disable during API call
                  />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {/* Label is inside RHFTextField */}
                    </div>
                    <RHFTextField<LoginSchemaType>
                      name="password"
                      label="Password"
                      type="password"
                      required
                      disabled={isLoading} // Disable during API call
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm">
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
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