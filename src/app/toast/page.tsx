// src/app/MyPage.tsx
"use client";

import { useToast } from "@/src/hooks/use-toast";
import { Button } from "@/src/components/ui/button";

export default function MyPage() {
    const { toast } = useToast();

    const showSuccessToast = () => {
        console.log("Đang gọi toast thành công...");
        toast({
            title: "Thành công!",
            description: "Dữ liệu của bạn đã được lưu thành công.",
            variant: "default",
        });
    };

    return (
        <div>
            <Button onClick={showSuccessToast}>Hiện Toast Thành công</Button>
        </div>
    );
}