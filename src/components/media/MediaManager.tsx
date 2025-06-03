// src/components/media/MediaManager.tsx
"use client";

import React, { useState, memo, useRef, useCallback, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { useFormContext } from 'react-hook-form';
import type { FieldValues, Path } from 'react-hook-form';
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { AspectRatio } from "@/src/components/ui/aspect-ratio";
import { ImagePlus, Sparkles, Trash2, Replace, AlertCircle, FileText, UploadCloud, Link as LinkIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    // DialogTrigger, // Not directly used as trigger is manual via setIsDialogOpen
    DialogClose
} from "@/src/components/ui/dialog";
import { cn } from '@/src/lib/utils';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";

const generateUniqueImageKey = (prefix: string = "img_key"): string => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    return `${prefix}_${timestamp}_${randomSuffix}`;
};

interface MediaManagerProps<TFieldValues extends FieldValues> {
    name: Path<TFieldValues>;
    fileFieldName: Path<TFieldValues>;
    imageUploadKeyFieldName: Path<TFieldValues>;
    label?: string;
    aspectRatio?: number;
    placeholderText?: string;
    className?: string;
}

// MediaPlaceholder and MediaDisplayControls components remain as you provided
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
    imageUploadKeyFieldName,
    label,
    aspectRatio = 16 / 9,
    placeholderText = 'Add media',
    className,
}: MediaManagerProps<TFieldValues>) => {
    const { setValue, watch } = useFormContext<TFieldValues>();

    const watchedImageFile: any = watch(fileFieldName);
    const watchedImageUrl = watch(imageUrlFieldName); // Watch the RHF URL field

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // Initialize isLoading based on whether there's an initial URL to load
    const [isLoading, setIsLoading] = useState(!!watchedImageUrl);
    const [hasError, setHasError] = useState(false);
    const [tempUrlInput, setTempUrlInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const managedBlobUrlRef = useRef<string | null>(null);

    // Effect 1: Manage Blob URL creation and revocation based on the selected file
    useEffect(() => {
        const currentFile = watchedImageFile as File | null;

        // Cleanup previous blob URL if it exists
        if (managedBlobUrlRef.current) {
            URL.revokeObjectURL(managedBlobUrlRef.current);
            managedBlobUrlRef.current = null;
        }

        if (currentFile instanceof File) {
            const newObjectUrl = URL.createObjectURL(currentFile);
            managedBlobUrlRef.current = newObjectUrl;
            setValue(imageUrlFieldName, newObjectUrl as any, { shouldValidate: true, shouldDirty: true });
            setIsLoading(true); // Start loading for the new blob
            setHasError(false);
        }
        // Note: If currentFile is null (e.g., file cleared),
        // and if imageUrlFieldName was pointing to the managedBlobUrl,
        // it should be cleared by the handler (handleDelete, handleUrlConfirm).
        // This effect focuses on creating/revoking its *own* blob.

        // Cleanup on unmount or when watchedImageFile changes causing re-run
        return () => {
            if (managedBlobUrlRef.current) {
                URL.revokeObjectURL(managedBlobUrlRef.current);
                managedBlobUrlRef.current = null;
            }
        };
    }, [watchedImageFile, setValue, imageUrlFieldName]); // Only depends on the file and RHF setters

    // Effect 2: Manage loading/error state for external URLs or when image URL is cleared
    useEffect(() => {
        const currentDisplayUrl = typeof watchedImageUrl === 'string' ? watchedImageUrl : null;

        if (currentDisplayUrl) {
            // External HTTP/S URL
            setIsLoading(true); // Expecting it to load
            setHasError(false);
        } else {
            // No URL
            setIsLoading(false);
            setHasError(false);
        }
    }, [watchedImageUrl]); // Reacts to changes in the RHF URL field

    const handleFileSelectAndSet = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input

        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.'); return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('File is too large. Maximum 5MB allowed.'); return;
            }
            const uniqueKey = generateUniqueImageKey();
            // Order matters: Set file and key first. Effect 1 will create blob and set URL.
            setValue(imageUploadKeyFieldName, uniqueKey as any, { shouldDirty: true, shouldValidate: true });
            setValue(fileFieldName, file as any, { shouldDirty: true, shouldValidate: true });
            // `imageUrlFieldName` will be updated by Effect 1 reacting to `watchedImageFile` change.

            setIsDialogOpen(false);
            setTempUrlInput('');
        }
    };

    const handleUrlConfirm = () => {
        const trimmedUrl = tempUrlInput.trim();
        if (trimmedUrl && (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://'))) {
            // Order: Clear file-related fields first, then set the new URL.
            setValue(fileFieldName, null as any, { shouldDirty: true, shouldValidate: true });
            setValue(imageUploadKeyFieldName, null as any, { shouldDirty: true, shouldValidate: true });
            setValue(imageUrlFieldName, trimmedUrl as any, { shouldDirty: true, shouldValidate: true });
            // Effect 2 will set isLoading(true) for the new URL.

            setIsDialogOpen(false);
        } else {
            alert("Please enter a valid HTTP/HTTPS URL.");
        }
    };

    const handleDelete = () => {
        setValue(imageUrlFieldName, null as any, { shouldDirty: true, shouldValidate: true });
        setValue(fileFieldName, null as any, { shouldDirty: true, shouldValidate: true });
        setValue(imageUploadKeyFieldName, null as any, { shouldDirty: true, shouldValidate: true });
        // Effect 1 will revoke blob if one was managed. Effect 2 will set isLoading/hasError false.
        setTempUrlInput('');
    };

    useEffect(() => { // For pre-filling URL input in dialog
        if (isDialogOpen) {
            if (typeof watchedImageUrl === 'string' && !watchedImageUrl.startsWith('blob:')) {
                setTempUrlInput(watchedImageUrl);
            } else {
                setTempUrlInput('');
            }
        }
    }, [isDialogOpen, watchedImageUrl]);

    const displayUrl = typeof watchedImageUrl === 'string' ? watchedImageUrl : null;
    const showPlaceholder = (!displayUrl && !isLoading) || hasError;
    const currentPlaceholderText = hasError ? "Error loading image." : placeholderText;

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Card className={cn('overflow-hidden h-full', className)}>
                <AspectRatio ratio={aspectRatio} className="bg-muted h-full">
                    {showPlaceholder ? (
                        <MediaPlaceholder
                            text={currentPlaceholderText}
                            isError={hasError}
                            onTriggerDialog={() => setIsDialogOpen(true)}
                        />
                    ) : (
                        <div className="relative w-full h-full group">
                            {/* Show Skeleton only when loading AND there's a URL we are trying to display */}
                            {isLoading && displayUrl && <Skeleton className="absolute inset-0 w-full h-full" />}
                            {displayUrl && (
                                <Image
                                    key={displayUrl} // Re-render if URL changes
                                    src={displayUrl}
                                    alt={label || 'Media preview'}
                                    fill
                                    className={cn(
                                        'object-contain transition-opacity duration-300',
                                        isLoading ? 'opacity-0' : 'opacity-100' // Image is transparent while loading
                                    )}
                                    priority={false} // Typically false unless critical above-the-fold image
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    onLoad={() => {
                                        setIsLoading(false);
                                        setHasError(false);
                                    }}
                                    onError={() => {
                                        // Don't revoke blob here, source might be external
                                        setIsLoading(false);
                                        setHasError(true);
                                    }}
                                />
                            )}
                            {/* Show controls if not loading, no error, and there's a URL */}
                            {!isLoading && !hasError && displayUrl && (
                                <MediaDisplayControls onDelete={handleDelete} onTriggerDialog={() => setIsDialogOpen(true)} />
                            )}
                        </div>
                    )}
                </AspectRatio>
            </Card>
            {/* DialogContent remains the same as your provided code */}
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{displayUrl && !hasError && !isLoading ? "Replace" : "Add"} Media</DialogTitle>
                    <DialogDescription>
                        Upload an image from your device or provide an image URL. Max 5MB.
                    </DialogDescription>
                </DialogHeader>
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileSelectAndSet}
                    className="hidden"
                    id={`file-input-${String(imageUrlFieldName).replace(/\./g, '-')}`}
                />
                <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload"><UploadCloud className="mr-1 h-4 w-4" /> Upload File</TabsTrigger>
                        <TabsTrigger value="url"><LinkIcon className="mr-1 h-4 w-4" /> By URL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="mt-4 space-y-4">
                        <Label
                            htmlFor={`file-input-${String(imageUrlFieldName).replace(/\./g, '-')}`}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer",
                                "bg-muted/50 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
                            )}
                        >
                            <UploadCloud className="h-10 w-10 mb-2" />
                            <span className="text-sm font-medium">Click to browse or drag & drop</span>
                            <span className="text-xs mt-1">PNG, JPG, GIF, WEBP up to 5MB</span>
                        </Label>
                        {watchedImageFile instanceof File && (
                            <div className="text-sm text-muted-foreground flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                                <FileText className="h-4 w-4" />
                                <span>Selected: {watchedImageFile.name} ({(watchedImageFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="url" className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor={`${String(imageUrlFieldName).replace(/\./g, '-')}-url-input-dialog`}>Image URL</Label>
                            <Input
                                id={`${String(imageUrlFieldName).replace(/\./g, '-')}-url-input-dialog`}
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
                    <Button type="button" variant="outline" className="mt-4 w-full sm:w-auto">
                        Cancel
                    </Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
};

export const MediaManager = memo(MediaManagerComponent) as typeof MediaManagerComponent;