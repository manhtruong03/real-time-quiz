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
        console.log('Nút Tải lên đã được nhấp (Chưa được triển khai)'); // Việt hóa
        alert('Chức năng tải tệp chưa được triển khai.'); // Việt hóa
    };

    const isUrlValid = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');

    return (
        // Removed DialogContent wrapper
        <div className={cn("pt-4", className)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url"><LinkIcon className="mr-1 h-4 w-4" /> Nhập URL</TabsTrigger>
                    <TabsTrigger value="upload"><UploadCloud className="mr-1 h-4 w-4" /> Tải lên</TabsTrigger>
                </TabsList>

                {/* URL Input Tab */}
                <TabsContent value="url" className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">URL hình ảnh</Label>
                        <Input
                            id="imageUrl"
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                        />
                        {!isUrlValid && imageUrl.length > 0 && (
                            <p className="text-xs text-destructive">Vui lòng nhập một URL hợp lệ (bắt đầu bằng http:// hoặc https://)</p>
                        )}
                    </div>
                    {/* No DialogFooter here, submit is handled via props */}
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            onClick={handleUrlConfirm}
                            disabled={!imageUrl.trim() || !isUrlValid}
                        >
                            Xác nhận URL
                        </Button>
                    </div>
                </TabsContent>

                {/* Upload Tab (Placeholder) */}
                <TabsContent value="upload" className="mt-4 space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/50 rounded-lg flex flex-col items-center justify-center gap-2 p-8 h-40 text-muted-foreground">
                        <UploadCloud className="h-10 w-10" strokeWidth={1} />
                        <span className="text-sm font-medium text-center">
                            Kéo & thả tệp vào đây hoặc nhấp để tải lên
                        </span>
                    </div>
                    {/* No DialogFooter here */}
                    <div className="flex justify-end">
                        <Button type="button" onClick={handleUploadClick} disabled>
                            Tải lên hình ảnh (Đã vô hiệu hóa)
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};