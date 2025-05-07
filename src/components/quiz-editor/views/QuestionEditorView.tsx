// src/components/quiz-editor/views/QuestionEditorView.tsx
"use client";

import React, { useEffect, useRef, useCallback } from "react";
import {
    FormProvider,
    useForm,
    SubmitHandler,
    SubmitErrorHandler,
    FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/src/lib/utils";
import type {
    QuizStructureHost,
    QuestionHost,
    ChoiceHost,
} from "@/src/lib/types/quiz-structure";
import {
    QuestionHostSchema,
    QuestionHostSchemaType,
    QuestionFormContextType,
    ChoiceHostSchemaType,
} from "@/src/lib/schemas/quiz-question.schema";
import {
    createDefaultQuestion,
    DEFAULT_TIME_LIMIT,
} from "@/src/lib/game-utils/quiz-creation";
import { transformQuestionDataForType } from "@/src/lib/game-utils/question-type-transformer";
import { useToast } from "@/src/components/ui/use-toast";

// Import Child Components
import SlideNavigationSidebar from "@/src/components/quiz-editor/sidebar/SlideNavigationSidebar";
import QuestionEditorPanel from "@/src/components/quiz-editor/editor/QuestionEditorPanel";
import QuestionConfigurationSidebar from "@/src/components/quiz-editor/sidebar/QuestionConfigurationSidebar";
import type { VideoSchemaType, MediaItemSchemaType } from '@/src/lib/schemas/quiz-question.schema';

// Utility function for simple deep comparison (replace with lodash.isEqual if available)
function simpleDeepCompare(obj1: any, obj2: any): boolean {
    // Basic check for null/undefined or non-objects
    if (
        obj1 === null ||
        obj2 === null ||
        typeof obj1 !== "object" ||
        typeof obj2 !== "object"
    ) {
        return obj1 === obj2;
    }
    // Use JSON stringify for a quick check (not foolproof for key order or undefined values)
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

interface QuestionEditorViewProps {
    quizData: QuizStructureHost | null;
    currentSlideIndex: number;
    onSlideSelect: (index: number) => void;
    onQuestionChange: (
        index: number,
        updatedQuestion: QuestionHost | null
    ) => void;
    triggerSaveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
    className?: string;
}

const getDefaultValuesForEditor = (
    quizData: QuizStructureHost | null,
    currentSlideIndex: number
): QuestionFormContextType => {
    console.log(`[EditorView getDefaultValuesForEditor] Calculating defaults for index: ${currentSlideIndex}`);
    const questionData = quizData?.questions?.[currentSlideIndex];

    const defaultVideoSchemaValue: VideoSchemaType | null = null; // Default for video as per schema
    const defaultMediaSchemaValue: MediaItemSchemaType[] = [];   // Default for media as per schema

    if (questionData) {
        console.log(`[EditorView getDefaultValuesForEditor] Found data for index ${currentSlideIndex}, type: ${questionData.type}`);
        let correctIdx = -1;
        if (questionData.type === "quiz" && questionData.choices) {
            correctIdx = questionData.choices.findIndex((c) => c.correct);
        }
        const defaultChoices = questionData.choices?.map((c: ChoiceHost) => ({
            answer: c.answer ?? "",
            image: c.image ?? undefined,
            correct: c.correct ?? false,
        })) ?? [];

        const videoValue = questionData.video ? {
            id: questionData.video.id || undefined,
            startTime: questionData.video.startTime ?? 0.0,
            endTime: questionData.video.endTime ?? 0.0,
            service: questionData.video.service ?? "youtube",
            fullUrl: questionData.video.fullUrl ?? "",
        } : defaultVideoSchemaValue; // Use schema default if questionData.video is null/undefined

        const mediaValue = questionData.media?.map(m => ({
            type: m.type,
            url: m.url,
            id: m.id,
            altText: m.altText,
            zIndex: m.zIndex,
            isColorOnly: m.isColorOnly,
            contentType: m.contentType,
            origin: m.origin,
            externalRef: m.externalRef,
            resources: m.resources,
            width: m.width,
            height: m.height,
        })) ?? defaultMediaSchemaValue; // Use schema default if questionData.media is null/undefined


        return {
            type: questionData.type,
            image: questionData.image ?? null,
            video: videoValue, // Assign the processed value
            media: mediaValue,   // Assign the processed value
            question: questionData.question ?? "",
            title: questionData.title ?? "",
            description: questionData.description ?? "",
            time: questionData.time ?? DEFAULT_TIME_LIMIT,
            pointsMultiplier:
                questionData.pointsMultiplier ??
                (questionData.type === "survey" || questionData.type === "content"
                    ? 0
                    : 1),
            choices: defaultChoices,
            correctChoiceIndex: correctIdx === -1 ? -1 : correctIdx,
        };
    } else {
        console.log(`[EditorView getDefaultValuesForEditor] No data found for index ${currentSlideIndex}. Using empty defaults from createDefaultQuestion.`);
        const defaultNewQuestion = createDefaultQuestion('quiz'); // createDefaultQuestion returns QuestionHost

        // Map QuestionHost to QuestionFormContextType, ensuring schema defaults are respected
        return {
            type: defaultNewQuestion.type,
            image: defaultNewQuestion.image ?? null,
            video: defaultNewQuestion.video ? { // Map from QuestionHost.video
                id: defaultNewQuestion.video.id,
                startTime: defaultNewQuestion.video.startTime ?? 0.0,
                endTime: defaultNewQuestion.video.endTime ?? 0.0,
                service: defaultNewQuestion.video.service ?? "youtube",
                fullUrl: defaultNewQuestion.video.fullUrl ?? ""
            } : defaultVideoSchemaValue,
            media: defaultNewQuestion.media?.map(m => ({ /* map fields */ })) ?? defaultMediaSchemaValue,
            question: defaultNewQuestion.question ?? "",
            title: defaultNewQuestion.title ?? "",
            description: defaultNewQuestion.description ?? "",
            time: defaultNewQuestion.time ?? DEFAULT_TIME_LIMIT,
            pointsMultiplier: defaultNewQuestion.pointsMultiplier ?? 1,
            choices: defaultNewQuestion.choices.map(c => ({
                answer: c.answer ?? "",
                image: c.image, // This is already ChoiceHostImage | undefined
                correct: c.correct ?? false
            })),
            correctChoiceIndex: defaultNewQuestion.choices.findIndex(c => c.correct) ?? -1,
        };
    }
};

export const QuestionEditorView: React.FC<QuestionEditorViewProps> = ({
    quizData,
    currentSlideIndex,
    onSlideSelect,
    onQuestionChange,
    triggerSaveRef,
    className,
}) => {
    const { toast } = useToast();
    const methods = useForm<QuestionFormContextType>({
        resolver: zodResolver(QuestionHostSchema),
        mode: "onBlur",
        defaultValues: getDefaultValuesForEditor(quizData, currentSlideIndex),
    });
    const {
        control,
        reset,
        getValues,
        setValue,
        handleSubmit,
        trigger,
        watch,
        formState: { errors, isDirty },
    } = methods;
    const watchedType = watch("type");

    const prevQuizDataRef = useRef(quizData);
    const prevSlideIndexRef = useRef(currentSlideIndex);
    const prevWatchedTypeRef = useRef(watchedType);
    const isHandlingTypeChange = useRef(false);

    // --- Effect to Reset Form on Index Change (No Change) ---
    useEffect(() => {
        // ... same logic ...
        let shouldReset = false;
        if (prevSlideIndexRef.current !== currentSlideIndex) {
            console.log(
                `[EditorView useEffect Index] Slide index CHANGED from ${prevSlideIndexRef.current} to ${currentSlideIndex}. Will reset.`
            );
            shouldReset = true;
        }

        if (shouldReset && currentSlideIndex >= 0) {
            const newDefaultValues = getDefaultValuesForEditor(
                quizData,
                currentSlideIndex
            );
            console.log(
                `[EditorView useEffect Index] Resetting form with defaults for index: ${currentSlideIndex}.`,
                newDefaultValues
            );
            reset(newDefaultValues);
            prevWatchedTypeRef.current = newDefaultValues.type;
        }

        prevQuizDataRef.current = quizData;
        prevSlideIndexRef.current = currentSlideIndex;
    }, [currentSlideIndex, quizData, reset]);

    // --- Submit Handlers (No Change) ---
    const onValidSubmit: SubmitHandler<QuestionFormContextType> = (
        validatedRHFData
    ) => {
        // ... same logic ...
        const currentIndex = currentSlideIndex;
        console.log(
            `[EditorView onValidSubmit] RHF validation PASSED (index ${currentIndex}). Data:`,
            validatedRHFData
        );
        let finalQuestionData: QuestionHost;
        if (validatedRHFData.type === "quiz") {
            const selectedIndex = validatedRHFData.correctChoiceIndex ?? -1;
            finalQuestionData = {
                ...validatedRHFData,
                choices: (validatedRHFData.choices || []).map((choice, idx) => ({
                    answer: choice.answer,
                    image: choice.image,
                    correct: idx === selectedIndex,
                })),
            } as QuestionHost;
        } else {
            finalQuestionData = {
                ...validatedRHFData,
                choices: (validatedRHFData.choices || []).map((choice) => ({
                    answer: choice.answer,
                    image: choice.image,
                    correct: choice.correct ?? true,
                })),
            } as QuestionHost;
        }
        if ("correctChoiceIndex" in finalQuestionData) {
            // @ts-ignore
            delete finalQuestionData.correctChoiceIndex;
        }
        console.log(
            `[EditorView onValidSubmit] Calling onQuestionChange for index ${currentIndex}.`
        );
        onQuestionChange(currentIndex, finalQuestionData);
        reset(validatedRHFData, {
            keepValues: true,
            keepDirty: false,
            keepErrors: false,
        });
        prevWatchedTypeRef.current = validatedRHFData.type;
    };

    const onInvalidSubmit: SubmitErrorHandler<QuestionFormContextType> = (
        errors
    ) => {
        // ... same logic ...
        const currentIndex = currentSlideIndex;
        console.error(
            `[EditorView onInvalidSubmit] RHF validation FAILED (index ${currentIndex}):`,
            JSON.stringify(errors, null, 2)
        );
        toast({
            title: "Validation Error",
            description: `Please fix the errors in Slide ${currentIndex + 1
                }. Changes could not be saved.`,
            variant: "destructive",
        });
    };

    // --- <<< MODIFIED Trigger Save Function >>> ---
    const triggerSave = useCallback(async (): Promise<boolean> => {
        const currentIndex = currentSlideIndex;
        console.log(
            `[EditorView triggerSave] Called for index ${currentIndex}. isDirty: ${isDirty}`
        );
        if (currentIndex < 0) return true; // No slide selected

        // --- PRE-SAVE TRANSFORMATION CHECK ---
        const currentValues = getValues();
        const currentType = currentValues.type; // Use type from current values
        const isCurrentTF =
            currentType === "quiz" &&
            currentValues.choices?.length === 2 &&
            currentValues.choices.some(
                (c: ChoiceHostSchemaType) => c.answer === "True"
            ) &&
            currentValues.choices.some(
                (c: ChoiceHostSchemaType) => c.answer === "False"
            );

        const transformedData = transformQuestionDataForType(
            currentValues,
            currentType,
            isCurrentTF
        );

        // Check if transformation actually changed relevant constrained fields
        const needsReset =
            ((currentType === "survey" || currentType === "content") &&
                currentValues.pointsMultiplier !== 0) ||
            ((currentType === "jumble" || currentType === "survey") &&
                (currentValues.choices ?? []).some((c) => !c.correct)) ||
            (currentType === "open_ended" &&
                (currentValues.choices ?? []).some((c) => !c.correct || c.image)) ||
            // Add other specific checks if needed based on transformer logic
            !simpleDeepCompare(currentValues, transformedData); // Fallback deep compare (can be slow)

        if (needsReset) {
            console.warn(
                `[EditorView triggerSave] Data inconsistent with type ${currentType}. Applying pre-save reset.`
            );
            reset(transformedData, {
                keepDefaultValues: false, // Use transformed as new defaults
                keepDirty: true, // Keep dirty state or mark as dirty
                keepErrors: false, // Clear errors before re-validation
            });
            // Need a brief moment for RHF state to update after reset before handleSubmit
            await new Promise((resolve) => setTimeout(resolve, 0));
            console.log(
                "[EditorView triggerSave] State after pre-save reset:",
                getValues()
            );
        }
        // --- END PRE-SAVE TRANSFORMATION CHECK ---

        if (!isDirty && !needsReset) {
            // Also skip if only reset happened but wasn't dirty before
            console.log(
                `[EditorView triggerSave] Skipped save for index ${currentIndex}: Form not dirty or only auto-corrected.`
            );
            return true; // Nothing user-initiated to save
        }

        console.log(`[EditorView triggerSave] Triggering RHF handleSubmit...`);
        await handleSubmit(onValidSubmit, onInvalidSubmit)();

        await new Promise((resolve) => setTimeout(resolve, 0));
        const finalErrors = methods.formState.errors;
        const success = Object.keys(finalErrors).length === 0;
        console.log(
            `[EditorView triggerSave] Submit attempt finished. RHF Validation Success: ${success}. Errors:`,
            finalErrors
        );
        return success;
    }, [
        currentSlideIndex,
        isDirty,
        handleSubmit,
        onValidSubmit,
        onInvalidSubmit,
        methods.formState.errors,
        reset,
        getValues,
        watch,
    ]); // Added getValues, watch

    // Register triggerSave with parent (No Change)
    useEffect(() => {
        if (triggerSaveRef) triggerSaveRef.current = triggerSave;
        return () => {
            if (triggerSaveRef) triggerSaveRef.current = null;
        };
    }, [triggerSaveRef, triggerSave]);

    // --- Handle Type Change Request (No Change needed from previous step) ---
    const handleTypeChange = useCallback(
        async (newType: QuestionHost["type"], isTrueFalseOverride = false) => {
            if (isHandlingTypeChange.current) {
                console.warn(
                    "[EditorView handleTypeChange] Already handling a type change, skipping subsequent call."
                );
                return;
            }
            isHandlingTypeChange.current = true;

            const currentIndex = currentSlideIndex;
            const currentRhfType = getValues("type");
            if (currentIndex < 0) {
                isHandlingTypeChange.current = false;
                return;
            }

            // Check if effective type is actually changing (same logic as before)
            const choices = getValues("choices");
            const isCurrentlyTF =
                currentRhfType === "quiz" &&
                choices?.length === 2 &&
                choices.some((c: ChoiceHostSchemaType) => c.answer === "True") &&
                choices.some((c: ChoiceHostSchemaType) => c.answer === "False");
            if (newType === currentRhfType && isTrueFalseOverride === isCurrentlyTF) {
                console.log(
                    `[EditorView handleTypeChange] Skipped: Type ${newType} (TF: ${isTrueFalseOverride}) effectively already set.`
                );
                if (prevWatchedTypeRef.current !== currentRhfType)
                    prevWatchedTypeRef.current = currentRhfType;
                isHandlingTypeChange.current = false;
                return;
            }
            console.log(
                `[EditorView handleTypeChange] START. Target: ${newType} (TF: ${isTrueFalseOverride}), Current RHF: ${currentRhfType}, Index: ${currentIndex}`
            );

            // --- No triggerSave needed here anymore ---

            const currentValues = getValues();
            const transformedData = transformQuestionDataForType(
                currentValues,
                newType,
                isTrueFalseOverride
            );
            console.log(
                `[EditorView handleTypeChange] Data transformed for type ${newType}:`,
                JSON.parse(JSON.stringify(transformedData))
            );

            console.log(`[EditorView handleTypeChange] Resetting RHF form state...`);
            reset(transformedData, {
                keepDefaultValues: false,
                keepDirty: true,
                keepErrors: false,
            });
            prevWatchedTypeRef.current = newType; // Update tracked type ref immediately

            console.log(
                `[EditorView handleTypeChange] Triggering validation after reset...`
            );
            const isValidAfterReset = await trigger();
            console.log(
                `[EditorView handleTypeChange] Validation after reset result: ${isValidAfterReset}`
            );

            if (!isValidAfterReset) {
                console.error(
                    `[EditorView handleTypeChange] Validation FAILED even after transforming and resetting for type ${newType}!`
                );
                toast({
                    title: "Type Change Error",
                    description:
                        "Could not apply changes for the new question type due to validation issues.",
                    variant: "destructive",
                });
                isHandlingTypeChange.current = false;
                return;
            }

            const parseResult = QuestionHostSchema.safeParse(transformedData);
            let finalDefaultQuestionData: QuestionHost | null = null;
            if (parseResult.success) {
                // ... conversion logic (same as before) ...
                const validatedData = parseResult.data;
                if (validatedData.type === "quiz") {
                    const selectedIndex = transformedData.correctChoiceIndex ?? -1;
                    finalDefaultQuestionData = {
                        ...validatedData,
                        choices: (validatedData.choices || []).map((choice, idx) => ({
                            answer: choice.answer,
                            image: choice.image,
                            correct: idx === selectedIndex,
                        })),
                    } as QuestionHost;
                } else {
                    finalDefaultQuestionData = {
                        ...validatedData,
                        choices: (validatedData.choices || []).map((choice) => ({
                            answer: choice.answer,
                            image: choice.image,
                            correct: choice.correct ?? true,
                        })),
                    } as QuestionHost;
                }
                if ("correctChoiceIndex" in finalDefaultQuestionData) {
                    delete (finalDefaultQuestionData as any).correctChoiceIndex;
                }
            } else {
                console.error(
                    "[EditorView handleTypeChange] Zod validation FAILED for TRANSFORMED default data:",
                    parseResult.error.flatten()
                );
                toast({
                    title: "Internal Error",
                    description: "Could not prepare default data structure.",
                    variant: "destructive",
                });
                finalDefaultQuestionData = null;
            }

            console.log(
                `[EditorView handleTypeChange] Calling onQuestionChange immediately after reset.`
            );
            onQuestionChange(currentIndex, finalDefaultQuestionData);

            console.log(`[EditorView handleTypeChange] END.`);
            isHandlingTypeChange.current = false;
        },
        [
            currentSlideIndex,
            reset,
            onQuestionChange,
            getValues,
            toast,
            trigger,
            prevWatchedTypeRef,
        ] // Removed triggerSave from dependencies here
    );

    // --- RHF Type Watch Effect (No Change) ---
    useEffect(() => {
        if (isHandlingTypeChange.current) return;
        const currentRhfType = getValues("type");
        if (currentRhfType && currentRhfType !== prevWatchedTypeRef.current) {
            console.log(
                `[EditorView RHF Watch Effect] Detected RHF type change: ${prevWatchedTypeRef.current} -> ${currentRhfType}. Calling handleTypeChange.`
            );
            const choices = getValues("choices");
            const isCurrentlyTF =
                currentRhfType === "quiz" &&
                choices?.length === 2 &&
                choices.some((c: ChoiceHostSchemaType) => c.answer === "True") &&
                choices.some((c: ChoiceHostSchemaType) => c.answer === "False");
            handleTypeChange(currentRhfType, isCurrentlyTF);
        } else if (currentRhfType && !prevWatchedTypeRef.current) {
            prevWatchedTypeRef.current = currentRhfType;
        }
    }, [watchedType, getValues, handleTypeChange]);

    // --- Rendering (No Change) ---
    if (
        currentSlideIndex < 0 ||
        !quizData ||
        !quizData.questions[currentSlideIndex]
    ) {
        return (
            <div className="flex-grow flex items-center justify-center p-4 italic text-muted-foreground">
                Select a slide to edit or add a new one.
            </div>
        );
    }
    return (
        <FormProvider
            {...methods}
            key={`editor-form-provider-${currentSlideIndex}`}
        >
            {/* ... rest of rendering ... */}
            <div className={cn("flex-grow flex overflow-hidden", className)}>
                {/* Left Sidebar */}
                <div className="w-60 flex-shrink-0 border-r bg-background overflow-y-auto hidden md:block">
                    <SlideNavigationSidebar
                        slides={quizData?.questions ?? []}
                        currentSlideIndex={currentSlideIndex}
                        onSelectSlide={onSlideSelect}
                    />
                </div>
                {/* Center Panel */}
                <div className="flex-grow flex flex-col overflow-y-auto p-4 md:p-6 bg-muted/30">
                    <QuestionEditorPanel
                        key={`panel-${currentSlideIndex}-${watchedType}`}
                    />
                </div>
                {/* Right Sidebar */}
                <div className="w-72 flex-shrink-0 border-l bg-background overflow-y-auto p-4">
                    <QuestionConfigurationSidebar
                        key={`config-${currentSlideIndex}-${watchedType}`}
                    />
                </div>
            </div>
        </FormProvider>
    );
};

export default QuestionEditorView;
