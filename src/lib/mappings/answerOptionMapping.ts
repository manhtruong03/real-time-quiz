// src/lib/mappings/answerOptionMapping.ts
import {
  Triangle,
  Diamond,
  Circle,
  Square,
  Star,
  Pentagon,
} from "lucide-react";
import type React from "react";

export interface AnswerOptionStyle {
  Icon: React.ElementType;
  colorClass: string; // Tailwind class (e.g., 'bg-red-500', or 'bg-answer-icon-triangle')
  name: string;
}

export const answerOptionMapping: AnswerOptionStyle[] = [
  {
    Icon: Triangle,
    colorClass: "bg-answer-icon-triangle", // Uses CSS var: --answer-icon-triangle: #E74C3C;
    name: "Triangle",
  },
  {
    Icon: Diamond,
    colorClass: "bg-answer-icon-diamond", // Uses CSS var: --answer-icon-diamond: #3498DB;
    name: "Diamond",
  },
  {
    Icon: Circle,
    colorClass: "bg-answer-icon-circle", // Uses CSS var: --answer-icon-circle: #F1C40F;
    name: "Circle",
  },
  {
    Icon: Square,
    colorClass: "bg-answer-icon-square", // Uses CSS var: --answer-icon-square: #2ECC71;
    name: "Square",
  },
  {
    Icon: Star, // Example for 5th option
    colorClass: "bg-purple-500", // Need a CSS var or direct color
    name: "Star",
  },
  {
    Icon: Pentagon, // Example for 6th option
    colorClass: "bg-orange-500", // Need a CSS var or direct color
    name: "Pentagon",
  },
];

export const getAnswerOptionStyle = (index: number): AnswerOptionStyle => {
  return answerOptionMapping[index % answerOptionMapping.length];
};
