// src/app/admin/images/components/ImageUploadFormDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/src/components/ui/dialog'; //
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/src/components/ui/form'; //
import { Button } from '@/src/components/ui/button'; //
import { Input } from '@/src/components/ui/input'; //
import { useToast } from '@/src/hooks/use-toast'; //
import { Loader2, UploadCloud } from 'lucide-react';

import { imageUploadSchema, ImageUploadSchemaType } from '@/src/lib/schemas/admin/image-upload.schema';
import { uploadImageAdmin } from '@/src/lib/api/admin/images';
import type { ImageStorageAdminViewDTO } from '@/src/lib/types/api'; //

interface ImageUploadFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUploadSuccess: (uploadedImage: ImageStorageAdminViewDTO) => void;
}

const ImageUploadFormDialog: React.FC<ImageUploadFormDialogProps> = ({
    open,
    onOpenChange,
    onUploadSuccess,
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [fileNameDisplay, setFileNameDisplay] = useState<string | null>(null); // For displaying the name in the UI
    const { toast } = useToast();

    const form = useForm<ImageUploadSchemaType>({
        resolver: zodResolver(imageUploadSchema),
        defaultValues: {
            imageFile: undefined, // React Hook Form will handle FileList from input then Zod transforms
        },
    });

    // Effect to reset form and UI states when the dialog is closed
    useEffect(() => {
        if (!open) {
            form.reset({ imageFile: undefined }); // Explicitly reset field value
            setFileNameDisplay(null);
            setIsUploading(false);
        }
    }, [open, form]);

    // Watch the raw FileList value from the input to update the UI for selected file name
    // This circumvents relying on form.watch("imageFile") which might reflect the transformed (single File) value
    // after a slight delay or only after validation cycle.
    // For direct UI feedback on file selection, handling it in the input's onChange is more immediate.

    const onSubmit = async (data: ImageUploadSchemaType) => {
        setIsUploading(true);
        // The Zod schema's transform ensures data.imageFile is a single File object here
        const imageFile = data.imageFile as File;

        try {
            const uploadedImage = await uploadImageAdmin(imageFile); // creatorId is omitted as per plan
            toast({
                title: 'Tải lên thành công!',
                description: `Hình ảnh "${uploadedImage.originalFileName}" đã được tải lên.`,
            });
            onUploadSuccess(uploadedImage);
            onOpenChange(false); // This will trigger the useEffect above to reset the form
        } catch (err: any) {
            console.error('Image upload failed:', err);
            toast({
                title: 'Tải lên thất bại',
                description: err.data?.message || err.message || 'Đã xảy ra lỗi khi tải lên hình ảnh.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] bg-secondary-bg border-border-color text-text-primary">
                <DialogHeader>
                    <DialogTitle className="text-text-primary">Tải lên hình ảnh mới</DialogTitle>
                    <DialogDescription className="text-text-secondary">
                        Chọn một tệp hình ảnh từ máy tính của bạn. Kích thước tối đa: 5MB.
                        Định dạng cho phép: JPG, PNG, GIF, WEBP.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
                        <FormField
                            control={form.control}
                            name="imageFile"
                            render={({ field }) => ( // field.value here might be FileList or File depending on RHF internals
                                <FormItem>
                                    <FormLabel
                                        htmlFor="imageFile-input"
                                        className="block text-sm font-medium text-text-secondary mb-1"
                                    >
                                        Chọn tệp hình ảnh
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative flex items-center justify-center w-full">
                                            <label
                                                htmlFor="imageFile-input"
                                                className="flex flex-col items-center justify-center w-full h-40 border-2 border-border-color border-dashed rounded-lg cursor-pointer bg-input-bg hover:bg-content-bg transition-colors"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <UploadCloud className="w-10 h-10 mb-3 text-text-placeholder" />
                                                    {fileNameDisplay ? (
                                                        <p className="mb-2 text-sm text-text-primary font-semibold truncate max-w-[90%]">
                                                            {fileNameDisplay}
                                                        </p>
                                                    ) : (
                                                        <>
                                                            <p className="mb-2 text-sm text-text-secondary">
                                                                <span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả
                                                            </p>
                                                            <p className="text-xs text-text-placeholder">
                                                                JPG, PNG, GIF, WEBP (tối đa 5MB)
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                                <Input
                                                    id="imageFile-input"
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                                    // Use field.onChange to update RHF; use setFileNameDisplay for immediate UI feedback
                                                    onChange={(e) => {
                                                        field.onChange(e.target.files); // Pass FileList to RHF
                                                        if (e.target.files && e.target.files[0]) {
                                                            setFileNameDisplay(e.target.files[0].name);
                                                        } else {
                                                            setFileNameDisplay(null);
                                                        }
                                                    }}
                                                    ref={field.ref} // RHF needs this ref
                                                />
                                            </label>
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-destructive-foreground bg-destructive/80 p-1 rounded-sm text-xs" />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" className="border-border-color hover:bg-border-color">
                                    Hủy
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={isUploading || !form.formState.isValid && form.formState.isSubmitted} className="bg-accent-color hover:bg-accent-hover">
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Tải lên
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default ImageUploadFormDialog;