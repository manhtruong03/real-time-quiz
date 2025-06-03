// src/components/media/MediaEditOptions.tsx
// Renamed from AddMediaDialog.tsx - Renders ONLY the dialog's content

"use client";

import React, { useState } from 'react';
import { Button } from "@/src/components/ui/button";
// Don't import Dialog components here anymore
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { UploadCloud, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface MediaEditOptionsProps {
    // No longer needs open/onOpenChange
    onUrlSubmit: (url: string) => void; // Callback when URL is submitted
    // Add onFileUpload later: onFileUpload: (file: File) => void;
    className?: string;
}

export const MediaEditOptions: React.FC<MediaEditOptionsProps> = ({
    onUrlSubmit,
    className,
}) => {
    const [imageUrl, setImageUrl] = useState('');
    const [activeTab, setActiveTab] = useState('url');

    const handleUrlConfirm = () => {
        if (imageUrl.trim()) {
            onUrlSubmit(imageUrl.trim());
            setImageUrl(''); // Clear input after submit
        }
    };

    const handleUploadClick = () => {
        console.log('Upload button clicked (Not Implemented)');
        alert('File upload is not implemented yet.');
    };

    const isUrlValid = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');

    return (
        // Removed DialogContent wrapper
        <div className={cn("pt-4", className)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url"><LinkIcon className="mr-1 h-4 w-4" /> Enter URL</TabsTrigger>
                    <TabsTrigger value="upload"><UploadCloud className="mr-1 h-4 w-4" /> Upload</TabsTrigger>
                </TabsList>

                {/* URL Input Tab */}
                <TabsContent value="url" className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input
                            id="imageUrl"
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                        />
                        {!isUrlValid && imageUrl.length > 0 && (
                            <p className="text-xs text-destructive">Please enter a valid URL (starting with http:// or https://)</p>
                        )}
                    </div>
                    {/* No DialogFooter here, submit is handled via props */}
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            onClick={handleUrlConfirm}
                            disabled={!imageUrl.trim() || !isUrlValid}
                        >
                            Confirm URL
                        </Button>
                    </div>
                </TabsContent>

                {/* Upload Tab (Placeholder) */}
                <TabsContent value="upload" className="mt-4 space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/50 rounded-lg flex flex-col items-center justify-center gap-2 p-8 h-40 text-muted-foreground">
                        <UploadCloud className="h-10 w-10" strokeWidth={1} />
                        <span className="text-sm font-medium text-center">
                            Drag & drop file here or click upload
                        </span>
                    </div>
                    {/* No DialogFooter here */}
                    <div className="flex justify-end">
                        <Button type="button" onClick={handleUploadClick} disabled>
                            Upload Image (Disabled)
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};