// src/components/media/MediaManager.tsx
"use client";

import React, { useState, memo, useRef, useCallback, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { useFormContext, useWatch, Controller } from 'react-hook-form';
import { FieldValues, Path } from 'react-hook-form';
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { AspectRatio } from "@/src/components/ui/aspect-ratio";
import { ImagePlus, Sparkles, Trash2, Replace, AlertCircle, FileText, UploadCloud } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogClose
} from "@/src/components/ui/dialog";
import { cn } from '@/src/lib/utils';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Link as LinkIcon } from "lucide-react";

interface MediaManagerProps<TFieldValues extends FieldValues> {
    name: Path<TFieldValues>; // This refers to the 'image' or 'cover' URL field (string)
    fileFieldName: Path<TFieldValues>; // New prop for the File object field, e.g., 'imageFile' or 'coverImageFile'
    label?: string;
    aspectRatio?: number;
    placeholderText?: string;
    className?: string;
}

const MediaPlaceholder: React.FC<{
    text: string;
    isError?: boolean;
    onTriggerDialog: () => void;
    onAiClick?: () => void;
}> = ({ text, isError = false, onTriggerDialog, onAiClick }) => (
    <div className={cn(
        "border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-3 p-4 md:p-6 h-full transition-colors",
        isError
            ? "border-destructive text-destructive"
            : "border-muted-foreground/50 text-muted-foreground hover:border-primary/50"
    )}>
        {isError ? <AlertCircle className="h-10 w-10 mb-2" /> : <ImagePlus className="h-10 w-10 md:h-12 md:w-12 mb-1" strokeWidth={1} />}
        <span className={cn(
            "text-sm font-medium text-center max-w-xs",
            isError ? "text-destructive" : "text-muted-foreground"
        )}>
            {text}
        </span>
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs mt-2">
            <Button variant={isError ? "destructive" : "outline"} size="sm" className="w-full" type="button" onClick={onTriggerDialog}>
                {isError ? <Replace className="mr-2 h-4 w-4" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                {isError ? 'Try Again' : 'Add Media'}
            </Button>
            <Button variant="outline" size="sm" className="w-full" disabled onClick={onAiClick}>
                <Sparkles className="mr-2 h-4 w-4" /> Generate AI
            </Button>
        </div>
    </div>
);

const MediaDisplayControls: React.FC<{ onDelete?: () => void; onTriggerDialog: () => void; }> = ({ onDelete, onTriggerDialog }) => (
    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
        <Button variant="secondary" size="icon" title="Replace Image" type="button" onClick={onTriggerDialog}>
            <Replace className="h-4 w-4" />
        </Button>
        {onDelete && (
            <Button variant="destructive" size="icon" title="Remove Image" type="button" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
            </Button>
        )}
    </div>
);

const MediaManagerComponent = <TFieldValues extends FieldValues>({
    name: imageUrlFieldName,
    fileFieldName,
    label,
    aspectRatio = 16 / 9,
    placeholderText = 'Add media',
    className,
}: MediaManagerProps<TFieldValues>) => {
    const { control, setValue, watch, formState: { errors } } = useFormContext<TFieldValues>();

    // `watch` will give us the current values from RHF state
    const watchedImageUrlFieldValue = watch(imageUrlFieldName); // This should be string (URL or objectURL)
    const watchedImageFileFieldValue: any = watch(fileFieldName);   // This should be File | null

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Used for the Next/Image loading state
    const [hasError, setHasError] = useState(false);
    // This state will hold the blob URL generated for previewing a selected File.
    // It's separate from the RHF state to manage its lifecycle (create/revoke).
    const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
    const [tempUrlInput, setTempUrlInput] = useState('');


    const fileInputRef = useRef<HTMLInputElement>(null);

    // Effect 1: Create/Revoke object URL when the actual File object in RHF changes
    useEffect(() => {
        const file = watchedImageFileFieldValue as File | null; // Get the File object from RHF
        let newObjectUrl: string | null = null;

        if (file instanceof File) {
            newObjectUrl = URL.createObjectURL(file);
            setPreviewObjectUrl(newObjectUrl); // Store the blob URL in local state for this component
            setValue(imageUrlFieldName, newObjectUrl as any, { shouldValidate: true, shouldDirty: true }); // Update RHF 'image' field
            console.log(`Effect1: Created object URL ${newObjectUrl} for ${file.name} and set in RHF field '${String(imageUrlFieldName)}'`);
            setIsLoading(true); // Trigger loading state for the Image component
            setHasError(false);
        } else {
            // If there's no file (e.g., it was cleared or never set)
            if (previewObjectUrl) {
                console.log(`Effect1: Revoking old object URL ${previewObjectUrl} because file is no longer present.`);
                URL.revokeObjectURL(previewObjectUrl);
                setPreviewObjectUrl(null);
                // If the RHF imageUrlFieldName was showing our blob, clear it.
                if (watchedImageUrlFieldValue === previewObjectUrl) {
                    setValue(imageUrlFieldName, null as any, { shouldValidate: true, shouldDirty: true });
                }
            }
        }

        // Cleanup: Revoke the object URL when the component unmounts or before creating a new one
        return () => {
            if (newObjectUrl) {
                console.log(`Effect1 Cleanup: Revoking object URL ${newObjectUrl}`);
                URL.revokeObjectURL(newObjectUrl);
            }
        };
    }, [watchedImageFileFieldValue, setValue, imageUrlFieldName]); // Removed previewObjectUrl, watchedImageUrlFieldValue to avoid loops/staleness


    const handleFileSelectAndSet = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (fileInputRef.current) { // Always reset the file input so onChange fires for same file selection
            fileInputRef.current.value = "";
        }
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.');
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('File is too large. Maximum 2MB allowed.');
                return;
            }
            console.log(`handleFileSelectAndSet: User selected file ${file.name}. Setting RHF field '${String(fileFieldName)}'.`);
            // This will trigger the useEffect above to create and set the object URL
            setValue(fileFieldName, file as any, { shouldDirty: true, shouldValidate: true });
            // No need to call setIsLoading(true) here, Effect 1 will handle it.
            setIsDialogOpen(false);
        }
    };

    const handleUrlConfirm = () => {
        if (tempUrlInput.trim() && (tempUrlInput.startsWith('http://') || tempUrlInput.startsWith('https://'))) {
            console.log(`handleUrlConfirm: User confirmed URL ${tempUrlInput}. Setting RHF field '${String(imageUrlFieldName)}' and clearing '${String(fileFieldName)}'.`);
            setValue(imageUrlFieldName, tempUrlInput.trim() as any, { shouldDirty: true, shouldValidate: true });
            setValue(fileFieldName, null as any, { shouldDirty: true, shouldValidate: true }); // Clear any selected file

            // If a blob URL was active for a file, it will be revoked by Effect 1 when watchedImageFileFieldValue becomes null
            setIsLoading(true); // For the Next/Image component
            setHasError(false);
            setIsDialogOpen(false);
        } else {
            alert("Please enter a valid HTTP/HTTPS URL.");
        }
    };

    const handleDelete = () => {
        console.log(`handleDelete: Clearing RHF fields '${String(imageUrlFieldName)}' and '${String(fileFieldName)}'.`);
        setValue(imageUrlFieldName, null as any, { shouldDirty: true, shouldValidate: true });
        setValue(fileFieldName, null as any, { shouldDirty: true, shouldValidate: true });
        // The active object URL will be revoked by Effect 1 when watchedImageFileFieldValue becomes null
        setTempUrlInput('');
        setIsLoading(false); // No image to load
        setHasError(false); // No error
    };

    // Determine what URL to display: the RHF value (which could be a blob or http URL)
    const displayUrl = typeof watchedImageUrlFieldValue === 'string' ? watchedImageUrlFieldValue : null;
    const showPlaceholder = !displayUrl || hasError;
    const currentPlaceholderText = hasError ? "Error loading image." : placeholderText;

    // Initialize tempUrlInput for the dialog
    useEffect(() => {
        if (isDialogOpen) {
            // If currently displaying a blob URL (from a file), don't prefill URL input
            if (previewObjectUrl && watchedImageUrlFieldValue === previewObjectUrl) {
                setTempUrlInput('');
            }
            // Otherwise, prefill with the current image URL (if it's a string and not a blob)
            else if (typeof watchedImageUrlFieldValue === 'string' && !watchedImageUrlFieldValue.startsWith('blob:')) {
                setTempUrlInput(watchedImageUrlFieldValue);
            } else {
                setTempUrlInput('');
            }
        }
    }, [isDialogOpen, watchedImageUrlFieldValue, previewObjectUrl]);


    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Card className={cn('overflow-hidden h-full', className)}>
                <AspectRatio ratio={aspectRatio} className="bg-muted h-full">
                    {showPlaceholder ? (
                        <MediaPlaceholder
                            text={currentPlaceholderText}
                            isError={hasError}
                            onTriggerDialog={() => setIsDialogOpen(true)}
                            onAiClick={() => console.log("AI Generate (MediaManager) - Not implemented")}
                        />
                    ) : (
                        <div className="relative w-full h-full group">
                            {isLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
                            {displayUrl && ( /* This displayUrl should now correctly be the blob URL or actual URL from RHF */
                                <Image
                                    key={displayUrl}
                                    src={displayUrl}
                                    alt={label || 'Media preview'}
                                    fill
                                    className={cn(
                                        'object-contain transition-opacity duration-300',
                                        isLoading ? 'opacity-0' : 'opacity-100'
                                    )}
                                    priority={false}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    onLoad={() => {
                                        console.log("Image loaded:", displayUrl);
                                        setIsLoading(false);
                                        setHasError(false); // Clear error on successful load
                                    }}
                                    onError={() => {
                                        console.error(`Image failed to load: ${displayUrl}`);
                                        setIsLoading(false);
                                        setHasError(true);
                                        // If it was our blob URL that failed, we might want to clear it
                                        if (displayUrl === previewObjectUrl) {
                                            console.error("Blob URL failed to load. Revoking and clearing.");
                                            URL.revokeObjectURL(displayUrl);
                                            setPreviewObjectUrl(null);
                                            setValue(imageUrlFieldName, null as any, { shouldValidate: true });
                                            setValue(fileFieldName, null as any, { shouldValidate: true }); // Also clear the file
                                        }
                                    }}
                                />
                            )}
                            {!isLoading && !hasError && displayUrl && (
                                <MediaDisplayControls onDelete={handleDelete} onTriggerDialog={() => setIsDialogOpen(true)} />
                            )}
                        </div>
                    )}
                </AspectRatio>
            </Card>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{displayUrl && !hasError && !isLoading ? "Replace" : "Add"} Media</DialogTitle>
                    <DialogDescription>
                        Upload an image from your device or provide an image URL.
                    </DialogDescription>
                </DialogHeader>
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileSelectAndSet}
                    className="hidden"
                    id={`file-input-${imageUrlFieldName.toString().replace(/\./g, '-')}`} // Ensure ID is valid
                />
                <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload"><UploadCloud className="mr-1 h-4 w-4" /> Upload File</TabsTrigger>
                        <TabsTrigger value="url"><LinkIcon className="mr-1 h-4 w-4" /> By URL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="mt-4 space-y-4">
                        <Label
                            htmlFor={`file-input-${imageUrlFieldName.toString().replace(/\./g, '-')}`} // Ensure ID is valid
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer",
                                "bg-muted/50 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
                            )}
                        >
                            <UploadCloud className="h-10 w-10 mb-2" />
                            <span className="text-sm font-medium">Click to browse or drag & drop</span>
                            <span className="text-xs mt-1">PNG, JPG, GIF up to 2MB</span>
                        </Label>
                        {watchedImageFileFieldValue instanceof File && ( // Use watched value for display
                            <div className="text-sm text-muted-foreground flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                                <FileText className="h-4 w-4" />
                                <span>Selected: {watchedImageFileFieldValue.name} ({(watchedImageFileFieldValue.size / 1024).toFixed(1)} KB)</span>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="url" className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor={`${imageUrlFieldName.toString().replace(/\./g, '-')}-url-input-dialog`}>Image URL</Label>
                            <Input
                                id={`${imageUrlFieldName.toString().replace(/\./g, '-')}-url-input-dialog`}
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={tempUrlInput}
                                onChange={(e) => setTempUrlInput(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                onClick={handleUrlConfirm}
                                disabled={!tempUrlInput.trim() || !(tempUrlInput.startsWith('http://') || tempUrlInput.startsWith('https://'))}
                            >
                                Use this URL
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="mt-4 w-full sm:w-auto"> {/* Adjusted styling */}
                        Cancel
                    </Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
};

export const MediaManager = memo(MediaManagerComponent) as typeof MediaManagerComponent;