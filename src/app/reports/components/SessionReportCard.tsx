// src/app/reports/components/SessionReportCard.tsx
import React from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { FileText, User, Calendar, Users, Flag, Landmark } from 'lucide-react';
import type { UserSessionHistoryItemDto } from '@/src/lib/types/api';
import { useAuth } from '@/src/context/AuthContext';
import { Badge } from '@/src/components/ui/badge'; // For better role/type display

export interface SessionReportCardProps {
    report: UserSessionHistoryItemDto;
}

export const SessionReportCard: React.FC<SessionReportCardProps> = ({ report }) => {
    const { user } = useAuth();
    const playedAsHost = report.roleInSession == "HOST";
    const roleText = playedAsHost ? 'Chủ phòng' : 'Người chơi';
    const roleIcon = playedAsHost ? <Landmark className="mr-1.5 h-3.5 w-3.5" /> : <User className="mr-1.5 h-3.5 w-3.5" />;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <h3 className="text-lg font-semibold text-primary truncate mb-1 flex items-center" title={report.name}>
                {report.name}
            </h3>
            <div className="text-xs text-muted-foreground mb-3 space-y-1">
                <p className="flex items-center">
                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                    Bắt đầu: {formatDate(report.time)}
                </p>
                {report.endTime && (
                    <p className="flex items-center">
                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                        Kết thúc: {formatDate(report.endTime)}
                    </p>
                )}
            </div>

            <div className="text-sm space-y-1.5 mb-4 flex-grow">
                <div className="flex items-center">
                    <Flag className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <strong>Loại:</strong>
                    <Badge variant="outline" className="ml-2">{report.type || 'N/A'}</Badge>
                </div>
                <div className="flex items-center">
                    <Users className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <strong>Số người chơi:</strong>
                    <span className="ml-1 font-medium">{report.playerCount}</span>
                </div>
                <div className="flex items-center">
                    {roleIcon}
                    <strong>Vai trò:</strong>
                    <Badge variant={playedAsHost ? "default" : "secondary"} className="ml-2">{roleText}</Badge>
                </div>
                {!playedAsHost && (
                    <div className="flex items-center">
                        <Landmark className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        <strong>Chủ phòng:</strong>
                        <span className="ml-1 font-medium truncate" title={report.sessionHostUsername}>{report.sessionHostUsername}</span>
                    </div>
                )}
            </div>

            <Link href={`/reports/sessions/${report.sessionId}`} passHref>
                <Button variant="outline" size="sm" className="w-full mt-auto">
                    <FileText className="mr-2 h-4 w-4" /> Xem chi tiết
                </Button>
            </Link>
        </div>
    );
};