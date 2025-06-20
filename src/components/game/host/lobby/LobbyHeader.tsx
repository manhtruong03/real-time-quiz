// src/components/game/host/lobby/LobbyHeader.tsx
import React from 'react';
import { Volume2, VolumeX, Maximize, Minimize, XOctagon, LogOut, Play, Settings2, Timer, Check } from 'lucide-react';
import { Button, buttonVariants } from '@/src/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/src/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/src/components/ui/alert-dialog';
import { Switch } from "@/src/components/ui/switch"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { cn } from '@/src/lib/utils';

interface LobbyHeaderProps {
    quizTitle: string;
    participantCount: number;
    onSettingsClick: () => void;
    isMuted: boolean;
    onToggleMute: () => void;
    isFullScreen?: boolean;
    onToggleFullScreen?: () => void;
    onEndGame: () => void;
    onStartGame: () => void;
    // Receive Auto-Start State & Handlers
    isAutoStartEnabled: boolean;
    onAutoStartToggle: (enabled: boolean) => void;
    autoStartTimeSeconds: number | null;
    onAutoStartTimeChange: (seconds: number | null) => void;
    autoStartCountdown: number | null; // Receive countdown value
    className?: string;
}

const AUTO_START_OPTIONS = [10, 20, 30, 60];

export const LobbyHeader: React.FC<LobbyHeaderProps> = ({
    quizTitle,
    participantCount,
    onSettingsClick,
    isMuted,
    onToggleMute,
    isFullScreen = false,
    onToggleFullScreen,
    onEndGame,
    onStartGame,
    // Destructure auto-start props
    isAutoStartEnabled,
    onAutoStartToggle,
    autoStartTimeSeconds,
    onAutoStartTimeChange,
    autoStartCountdown, // Destructure countdown value
    className,
}) => {

    const canStartGameManually = participantCount > 0 && !isAutoStartEnabled; // Can only start manually if players exist AND auto-start is OFF
    const isCountingDown = typeof autoStartCountdown === 'number' && autoStartCountdown > 0;

    return (
        <header className={cn(
            "flex items-center justify-between p-3 md:p-4 border-b bg-background/80 backdrop-blur-sm gap-4",
            className
        )}>
            {/* Left Side */}
            <div className="flex-shrink-0">
                <h1 className="text-lg md:text-xl font-bold truncate">{quizTitle || "Sảnh câu đố"}</h1>
            </div>

            {/* Center: Start Controls */}
            <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-center">
                {/* Auto Start Switch & Timer Select */}
                <div className="flex items-center space-x-2">
                    <Switch
                        id="auto-start-switch"
                        checked={isAutoStartEnabled}
                        onCheckedChange={onAutoStartToggle}
                        disabled={participantCount === 0} // Disable switch if no players
                        aria-label="Tự động bắt đầu"
                        title={participantCount === 0 ? "Đang chờ người chơi bật tự động bắt đầu" : (isAutoStartEnabled ? "Tắt tự động bắt đầu" : "Bật tự động bắt đầu")}
                    />
                    <Label htmlFor="auto-start-switch" className={cn("text-sm font-medium cursor-pointer hidden sm:inline", participantCount === 0 && "cursor-not-allowed opacity-50")}>
                        Tự động bắt đầu
                    </Label>
                    {/* Timer Selection (only if enabled) */}
                    {isAutoStartEnabled && (
                        <Select
                            value={autoStartTimeSeconds !== null ? String(autoStartTimeSeconds) : ""}
                            onValueChange={(value) => onAutoStartTimeChange(value ? parseInt(value, 10) : null)}
                            disabled={participantCount === 0} // Also disable select if no players
                        >
                            <SelectTrigger className="h-8 w-[120px] text-xs ml-2">
                                <SelectValue placeholder="Chọn thời gian..." />
                            </SelectTrigger>
                            <SelectContent>
                                {AUTO_START_OPTIONS.map((seconds) => (
                                    <SelectItem key={seconds} value={String(seconds)} className="text-xs">
                                        {seconds} giây{seconds !== 1 ? 's' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Start Game Button - Shows countdown if active */}
                <Button
                    size="lg"
                    onClick={onStartGame}
                    disabled={!canStartGameManually && !isCountingDown} // Disabled if no players OR if auto-start is on (unless counting down)
                    className="min-w-[150px] transition-all" // Wider to accommodate countdown text
                    title={!canStartGameManually && !isCountingDown ? (participantCount > 0 ? "Tự động bắt đầu đã bật" : "Đang chờ người chơi") : "Bắt đầu câu đố!"}
                >
                    {isCountingDown ? (
                        <>
                            <Timer className="mr-2 h-5 w-5 animate-spin duration-[2000ms]" />
                            Bắt đầu sau {autoStartCountdown}...
                        </>
                    ) : (
                        <>
                            <Play className="mr-2 h-5 w-5" />
                            Bắt đầu
                        </>
                    )}
                </Button>
            </div>

            {/* Right Side: Icon Control Buttons */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                {/* ... (TooltipProvider and icon buttons remain the same) ... */}
                <TooltipProvider delayDuration={100}>
                    {/* Mute/Unmute Button (RE-ADDED) */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={onToggleMute} aria-label={isMuted ? "Bỏ tắt tiếng" : "Tắt tiếng"} className="h-8 w-8 md:h-9 md:w-9">
                                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{isMuted ? "Bỏ tắt tiếng" : "Tắt tiếng"}</p></TooltipContent>
                    </Tooltip>

                    {/* Settings Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => { console.log("[LobbyHeader] Settings button clicked!"); onSettingsClick(); }} aria-label="Cài đặt trò chơi" className="h-8 w-8 md:h-9 md:w-9">
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Cài đặt trò chơi</p></TooltipContent>
                    </Tooltip>

                    {/* Fullscreen Toggle */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={onToggleFullScreen} aria-label={isFullScreen ? "Thoát toàn màn hình" : "Mở toàn màn hình"} className="h-8 w-8 md:h-9 md:w-9">
                                {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{isFullScreen ? "Thoát toàn màn hình" : "Mở toàn màn hình"}</p></TooltipContent>
                    </Tooltip>

                    {/* End Game Button */}
                    <AlertDialog>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-destructive hover:text-destructive hover:bg-destructive/10" aria-label="End Game">
                                        <XOctagon className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent><p>Kết thúc trò chơi</p></TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Kết thúc trò chơi?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bạn có chắc muốn kết thúc phiên đố này không? Tất cả người chơi sẽ bị ngắt kết nối.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction onClick={onEndGame} className={cn(buttonVariants({ variant: "destructive" }))}>
                                    End Game
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TooltipProvider>
            </div>
        </header>
    );
};