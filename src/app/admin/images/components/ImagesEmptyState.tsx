// src/app/admin/images/components/ImagesEmptyState.tsx
"use client";

import React from 'react';
import { ImageOff } from 'lucide-react'; // Or use ImageIcon if preferred

const ImagesEmptyState: React.FC = () => {
    return (
        <div className="text-center py-10 text-text-secondary flex flex-col items-center">
            <ImageOff className="h-16 w-16 mx-auto mb-4 text-gray-500" />
            <p className="text-xl font-semibold">Không tìm thấy hình ảnh nào.</p>
            <p className="text-sm">
                Hiện tại chưa có hình ảnh nào trong hệ thống hoặc phù hợp với bộ lọc của bạn.
            </p>
            {/* Optionally, add a button to trigger "Add Image" dialog later */}
            {/* <Button variant="default" className="mt-4 bg-accent-color hover:bg-accent-hover text-white">
                <Plus className="mr-2 h-5 w-5" />
                Thêm ảnh mới
            </Button> */}
        </div>
    );
};

export default ImagesEmptyState;