import { Skeleton } from '@/src/components/ui/skeleton'; //
import { Card, CardContent, CardHeader } from '@/src/components/ui/card'; //

const QuestionCardSkeleton = () => {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-grow min-w-0 space-y-2">
                        <Skeleton className="h-5 w-10" /> {/* Question Number */}
                        <Skeleton className="h-6 w-3/4" /> {/* Question Title */}
                    </div>
                    <div className="flex-shrink-0 ml-4 space-y-2 items-center flex flex-col">
                        <Skeleton className="h-12 w-12 rounded-full" /> {/* Donut Chart */}
                        <Skeleton className="h-4 w-16" /> {/* Accuracy text */}
                    </div>
                </div>
                <Skeleton className="h-5 w-20 mt-1" /> {/* Question Type */}
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                {/* Media Placeholder */}
                <Skeleton className="h-40 w-full rounded-md" />
                {/* Answer Options Skeletons */}
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="flex items-center space-x-3">
                        <Skeleton className="h-7 w-7 rounded-md" /> {/* Icon */}
                        <Skeleton className="h-5 flex-grow" /> {/* Answer Text */}
                        <Skeleton className="h-7 w-10" /> {/* Count */}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

const QuestionsLoadingSkeleton = ({ count = 3 }: { count?: number }) => {
    return (
        <div className="space-y-6">
            {[...Array(count)].map((_, index) => (
                <QuestionCardSkeleton key={index} />
            ))}
        </div>
    );
};

export default QuestionsLoadingSkeleton;