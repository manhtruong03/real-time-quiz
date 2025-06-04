// src/app/admin/reports/components/AdminReportsTable.tsx
import React from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/src/components/ui/table';
import { Button } from '@/src/components/ui/button';
import { Trash2 } from 'lucide-react';
import { SessionSummaryDto } from '@/src/lib/types/reports';
import { formatSessionDateTime } from '@/src/lib/utils'; // Assuming this utility is suitable

interface AdminReportsTableProps {
    reports: SessionSummaryDto[];
    onDeleteReport: (report: SessionSummaryDto) => void; // Placeholder for Phase 2
}

export const AdminReportsTable: React.FC<AdminReportsTableProps> = ({
    reports,
    onDeleteReport,
}) => {
    const thClasses =
        'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground bg-muted/20';
    const tdClasses = 'px-4 py-3 whitespace-nowrap text-sm'; // text-primary-foreground might be too light, default should be fine
    const rowClasses = 'border-b hover:bg-muted/50'; // Uses theme's border and hover

    if (!reports || reports.length === 0) {
        return null; // Or a message like "No reports to display", handled by parent
    }

    return (
        <div className="overflow-x-auto rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                        {' '}
                        {/* Ensure header row doesn't change color on hover if not desired */}
                        <TableHead className={thClasses}>Tiêu đề Quiz</TableHead>
                        <TableHead className={thClasses}>Người tổ chức</TableHead>
                        <TableHead className={`${thClasses} text-right`}>
                            Số người chơi
                        </TableHead>
                        <TableHead className={thClasses}>Thời gian kết thúc</TableHead>
                        <TableHead className={`${thClasses} text-center`}>
                            Hành động
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.map((report) => (
                        <TableRow key={`${report.quizInfo.quizId}-${report.time}`} className={rowClasses}>
                            <TableCell className={`${tdClasses} font-medium`}>
                                {report.quizInfo?.title || 'Không có tiêu đề'}
                            </TableCell>
                            <TableCell className={tdClasses}>{report.username}</TableCell>
                            <TableCell className={`${tdClasses} text-right`}>
                                {report.controllersCount}
                            </TableCell>
                            <TableCell className={tdClasses}>
                                {report.endTime
                                    ? formatSessionDateTime(report.endTime)
                                    : 'Chưa kết thúc'}
                            </TableCell>
                            <TableCell className={`${tdClasses} text-center`}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDeleteReport(report)}
                                    className="text-destructive hover:text-destructive-hover hover:bg-destructive/10"
                                    title="Xóa Báo cáo"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
