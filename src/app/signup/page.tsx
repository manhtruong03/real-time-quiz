// src/app/signup/page.tsx
"use client";

import type React from 'react';
import { useState } from 'react'; // Keep for isLoading/error
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form'; // Import useForm
import { zodResolver } from '@hookform/resolvers/zod'; // Import resolver
import { Button } from '@/src/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/src/components/ui/card';
import {
    Form,
} from '@/src/components/ui/form'; // Import RHF Form component
import { RHFTextField } from '@/src/components/rhf/RHFTextField'; // Assuming you have this wrapper
import { Brain } from 'lucide-react';
import { registerUser } from '@/src/lib/api/auth';
import { SignupSchema, SignupSchemaType } from '@/src/lib/schemas/auth.schema'; // Import Zod schema
import { useToast } from '@/src/hooks/use-toast'; // Import useToast
import { AppHeader } from '@/src/components/layout/AppHeader';

export default function SignupPage() {
    const router = useRouter();
    const { toast } = useToast(); // Initialize toast

    // Remove useState for form fields
    // const [username, setUsername] = useState('');
    // const [email, setEmail] = useState('');
    // const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(''); // Keep for general API errors

    // --- Initialize React Hook Form ---
    const formMethods = useForm<SignupSchemaType>({
        resolver: zodResolver(SignupSchema),
        defaultValues: {
            username: '',
            email: '', // Default optional email to empty string
            password: '',
            // confirmPassword: "", // Add if using confirmPassword
        },
    });
    // --- End RHF Init ---

    // --- Update Submit Handler ---
    const handleSignup = async (data: SignupSchemaType) => {
        // Data is validated by RHF/Zod
        setIsLoading(true);
        setError('');
        console.log('Signup attempt with (validated):', data);

        // Prepare data for API (remove confirmPassword if it was added for UI only)
        const apiData: { username: string; password: string; email?: string } = {
            username: data.username,
            password: data.password,
        };
        if (data.email) {
            apiData.email = data.email;
        }

        try {
            const response = await registerUser(apiData); // Pass validated data
            console.log('Registration successful:', response.message);

            // Show success toast
            toast({
                title: 'Đăng ký thành công',
                description: response.message || 'Bây giờ bạn có thể đăng nhập.',
            });

            router.push('/login'); // Redirect to login page after successful signup
        } catch (err: any) {
            console.error('Signup failed:', err);
            const errorMessage = err.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            setError(errorMessage); // Set general error for display
            // Show error toast
            toast({
                variant: 'destructive',
                title: 'Đăng ký thất bại',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };
    // --- End Submit Handler Update ---

    return (
        // Layout structure remains similar
        <div className="min-h-screen flex flex-col">
            {/* Header remains the same */}
            <AppHeader />

            <main className="flex-1 flex items-center justify-center py-12">
                <div className="w-full max-w-md px-4">
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-2xl font-bold text-center">Tạo tài khoản</CardTitle>
                            <CardDescription className="text-center">Nhập thông tin của bạn để đăng ký.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* --- Wrap form with RHF Form Provider --- */}
                            <Form {...formMethods}>
                                <form
                                    onSubmit={formMethods.handleSubmit(handleSignup)} // Use RHF's handleSubmit
                                    className="space-y-4"
                                >
                                    {error && ( // Keep general error display if needed
                                        <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {/* --- Use RHFTextField --- */}
                                    <RHFTextField<SignupSchemaType>
                                        name="username"
                                        label="Tên tài khoản"
                                        type="text"
                                        placeholder="Nhập tên tài khoản"
                                        required
                                    />

                                    <RHFTextField<SignupSchemaType>
                                        name="email"
                                        label="Email (Tùy chọn)"
                                        type="email"
                                        placeholder="your.email@example.com"
                                    // Not required based on schema
                                    />

                                    <RHFTextField<SignupSchemaType>
                                        name="password"
                                        label="Mật khẩu"
                                        type="password"
                                        placeholder="Nhập mật khẩu"
                                        required
                                    />
                                    {/* Add RHFTextField for confirmPassword if needed */}
                                    {/*
                   <RHFTextField<SignupSchemaType>
                        name="confirmPassword"
                        label="Confirm Password"
                        type="password"
                        placeholder="Confirm your password"
                        required
                    />
                   */}
                                    {/* --- End RHFTextField --- */}

                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                                    </Button>
                                </form>
                            </Form>
                            {/* --- End RHF Form Provider --- */}
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <div className="text-center text-sm">
                                Đã có tài khoản?{' '}
                                <Link href="/login" className="text-primary hover:underline">
                                    Đăng nhập
                                </Link>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </main>
            {/* Footer remains the same */}
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