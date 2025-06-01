// src/hooks/quiz-editor/form-management/questionFormUtils.ts
import { UseFormGetValues } from "react-hook-form";
import type { QuestionFormContextType } from "@/src/lib/schemas/quiz-question.schema";

export function simpleDeepCompare(obj1: any, obj2: any): boolean {
  if (
    obj1 === null ||
    obj2 === null ||
    typeof obj1 !== "object" ||
    typeof obj2 !== "object"
  ) {
    return obj1 === obj2;
  }
  if (obj1 instanceof File && obj2 instanceof File) {
    return (
      obj1.name === obj2.name &&
      obj1.size === obj2.size &&
      obj1.type === obj2.type
    );
  }
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export const createIsFormTrulyDirty = (
  getValues: UseFormGetValues<QuestionFormContextType>,
  initialFormValues: QuestionFormContextType | null,
  currentSlideIndex: number
) => {
  return () => {
    if (currentSlideIndex < 0 || !initialFormValues) return false;
    const currentValues = getValues();
    const fieldsToCompare: (keyof QuestionFormContextType)[] = [
      "type",
      "question",
      "title",
      "description",
      "time",
      "pointsMultiplier",
      "choices",
      "correctChoiceIndex",
      "image",
      "questionImageUploadKey",
      // "video", "media" // Add if comparing these too
    ];
    for (const key of fieldsToCompare) {
      if (!simpleDeepCompare(currentValues[key], initialFormValues[key]))
        return true;
    }
    if (
      !simpleDeepCompare(currentValues.imageFile, initialFormValues.imageFile)
    )
      return true;
    return false;
  };
};
