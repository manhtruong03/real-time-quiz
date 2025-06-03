# Quiz Creation UI: Question Editor Screen Component Architecture

**Version:** 1.0
**Date:** May 6, 2025
**Target Data:** Edits a single `QuestionHost` object within the `QuizStructureHost.questions` array.

## 1. Overview

This document details the component architecture for the main **Question Editor screen**. This is where users spend most of their time configuring individual questions or content slides after adding them via the "Add Slide" screen or selecting an existing slide from the navigator.

The architecture uses a multi-panel layout inspired by the Kahoot editor examples. It must be flexible to adapt the central editing area and right-hand configuration options based on the selected `question.type`. The goal remains consistency and reusability, leveraging our tech stack and ultimately managing data for individual `QuestionHost` objects.

## 2. Layout Architecture

The Question Editor utilizes the consistent 4-panel layout:

- **`<QuizEditorLayout>`:** (Reusable) Top-level shell.
- **`<QuizEditorHeader>`:** (Reusable) Top bar. May include quiz title input/display and global actions (Save, Preview, Exit, Themes, Settings).
- **`<SlideNavigationSidebar>`:** (Reusable) Left sidebar containing the `<SlideList>` (with `<SlideThumbnail>`), `<AddQuestionButton>`, and `<AddSlideButton>`. Clicking a thumbnail updates the Center and Right panels to reflect the selected slide.
- **`<QuestionEditorPanel>`:** (New) The central workspace, dynamically displaying content based on the selected slide's type. Contains question text input, media manager, and the dynamic answer editing area.
- **`<QuestionConfigurationSidebar>`:** (New) The right sidebar, dynamically displaying configuration options relevant to the selected slide's type.

## 3. Component Breakdown

_(Focusing on the Editor Panel and Configuration Sidebar)_

### 3.1 Layout & Reusable Components (Defined Previously)

- `<QuizEditorLayout>`, `<QuizEditorHeader>`, `<QuizEditorFooter>`
- `<SlideNavigationSidebar>`, `<SlideList>`, `<SlideThumbnail>`
- `<AddQuestionButton>`, `<AddSlideButton>`, `<QuizSettingsButton>`, `<QuizPreviewButton>`, `<QuizSaveButton>`
- `<MediaManager>` (Adapted from `<CoverMediaManager>`)
- `<RHFTextField>`, `<RHFTextAreaField>`, `<RHFSelectField>`
- `<AIGenerateButton>`

### 3.2 Question Editor Specific Components

- **`<QuestionEditorPanel>`:** Container for the central editing area. Conditionally renders the appropriate answer editor based on `questionType`. Likely wrapped by RHF `FormProvider`.
  - **`<QuestionTextInput>`:** (Reusable Concept/Wrapper) Input/Textarea for the main question text (`questionData.question`). Uses `<RHFTextAreaField>`.
  - **Dynamic Answer Area Components:**
    - **`<AnswerGrid>`:** Layout component (CSS Grid) for Quiz/TrueFalse answers.
    - **`<AnswerInput>`:** Component for a single Quiz/TrueFalse answer option. Handles text, optional image, shape/color indicator, and correct answer selection.
    - **`<SortableAnswerList>`:** Container for Jumble answers, integrating `@dnd-kit`.
    - **`<DraggableEditorAnswerItem>`:** Component for a single Jumble answer option. Includes drag handle, shape/color, text input, image button.
    - **`<OpenEndedAnswerEditor>`:** Component for managing the list of acceptable answers for Open Ended questions.
    - **`<ContentSlideEditor>`:** (Not shown, but needed) Component for editing `title` and `description` of a "content" type slide.
- **`<QuestionConfigurationSidebar>`:** Container for the right sidebar. Conditionally renders relevant configuration options.
  - **`<QuestionTypeSelect>`:** (Reusable Concept/Wrapper) Select dropdown bound to `questionData.type`. Changing this _must_ trigger updates in both the Editor Panel and this Sidebar. Uses `<RHFSelectField>`.
  - **`<TimeLimitSelect>`:** (Reusable Concept/Wrapper) Select dropdown bound to `questionData.time`. Uses `<RHFSelectField>`.
  - **`<PointsSelect>`:** (Reusable Concept/Wrapper) Select dropdown bound to `questionData.pointsMultiplier`. Uses `<RHFSelectField>`.
  - **`<AnswerOptionsSelect>`:** (Specific to Quiz) Select dropdown for single/multi-select. Uses `<RHFSelectField>`.
  - **`<SlideActions>`:** Container for slide actions at the bottom of the sidebar.
    - **`<DeleteSlideButton>`:** Action button.
    - **`<DuplicateSlideButton>`:** Action button.

## 4. Detailed Component Descriptions

_(Focus on new/variant components)_

### 4.1 Editor Panel Components

- **`<QuestionEditorPanel>`**
  - **Purpose:** Main workspace container, dynamically showing the correct UI based on the selected question's type. Manages the RHF form context for the _current_ question.
  - **Props:** `currentQuestion: QuestionHost`, `onQuestionChange: (updatedQuestion: QuestionHost) => void`.
  - **`shadcn/ui` & Styling:** `div`, Tailwind (layout). RHF `FormProvider`.
  - **Data Flow:** Receives the current `QuestionHost` data. Initializes `useForm` with this data and a Zod schema specific to the question type (or a union schema). Children components interact with this form context. Saving/slide change triggers `onQuestionChange` with the latest form state.
- **`<QuestionTextInput>`**
  - **Purpose:** Provides input for the main question text.
  - **Props:** `name: Path<QuestionHost>` ("question"), `control`, `label` (implicit/hidden?).
  - **`shadcn/ui` & Styling:** `<RHFTextAreaField>` likely used internally. Large font size, placeholder text.
  - **Data Flow:** Binds to the `question` field in the RHF context.
- **`<AnswerGrid>`**
  - **Purpose:** Layout for Quiz/TrueFalse answer options (2x1 for TF, 2x2 for Quiz).
  - **Props:** `children`.
  - **`shadcn/ui` & Styling:** `div`, Tailwind (`grid`, `grid-cols-2`, `gap-2` or `gap-3`).
- **`<AnswerInput>`**
  - **Purpose:** Edit a single answer option for Quiz/True/False.
  - **Props:**
    - `index: number`.
    - `fieldNamePrefix: string` (e.g., "choices.${index}").
    - `control: Control`.
    - `setValue: UseFormSetValue`.
    - `getValues: UseFormGetValues`.
    - `correctAnswerFieldName: string` (e.g., "correctChoiceIndex").
    - `isTrueFalseVariant?: boolean`.
  - **`shadcn/ui` & Styling:** Container `div`, `<Button size="icon">` (shape/color), `<Input>` (text), `<Button variant="ghost">` (image icon), `<Button variant="ghost" role="radio">` (correct selector circle). Tailwind for layout. Icons: `<Triangle>`, `<Diamond>`, `<Circle>`, `<Square>`, `<Image>`, `<CheckCircle>` (filled inside selector).
  - **Data Flow:** Uses `Controller` or `register` to bind text input to `fieldNamePrefix + ".answer"`. Image button interacts with `<MediaManager>` logic, updating `fieldNamePrefix + ".image"`. Correct selector click uses `setValue` to update `correctAnswerFieldName` with this input's `index`, which implicitly sets `choices[index].correct = true` and others to `false` on save.
- **`<SortableAnswerList>`**
  - **Purpose:** Container for draggable Jumble answer items.
  - **Props:** `fieldNamePrefix: string` (e.g., "choices"), `control`.
  - **`shadcn/ui` & Styling:** Uses `@dnd-kit/core` and `@dnd-kit/sortable`. `div` with flex column layout.
  - **Data Flow:** Manages the order of items based on drag-and-drop. The `arrayMove` updates the RHF `choices` array directly, preserving the correct order.
- **`<DraggableEditorAnswerItem>`**
  - **Purpose:** Edit a single answer option for Jumble.
  - **Props:** `id: string`, `index: number`, `fieldNamePrefix: string` ("choices.${index}"), `control`.
  - **`shadcn/ui` & Styling:** Styled `div`, `<Button>` (drag handle), Shape/Color Indicator, `<Input>`, `<Button>` (image). Icon: `<GripVertical>`. Uses `useSortable` hook.
  - **Data Flow:** Binds text/image to RHF fields similar to `<AnswerInput>`, but order is managed by parent `<SortableAnswerList>`. No correct selector.
- **`<OpenEndedAnswerEditor>`**
  - **Purpose:** Manage the list of acceptable correct answers for Open Ended.
  - **Props:** `fieldName: string` ("choices"), `control`.
  - **`shadcn/ui` & Styling:** `div`, `<Input>` (for adding), `<Button>` (add), `<Badge>` (display), `<Button>` (delete).
  - **Data Flow:** Uses RHF `useFieldArray` to manage the list of acceptable answers (`choices` array, where each item is `{ answer: string, correct: true }`).

### 4.2 Configuration Sidebar Components

- **`<QuestionConfigurationSidebar>`**
  - **Purpose:** Display settings relevant to the current question type.
  - **Props:** `questionType: QuestionHost['type']`, `control`, `setValue`, `getValues`.
  - **`shadcn/ui` & Styling:** `aside` or `div`, Tailwind (layout, padding, border).
  - **Data Flow:** Contains RHF-bound controls (`<RHFSelectField>`). Changing `QuestionTypeSelect` triggers parent state update to re-render editor panel.
- **`<QuestionTypeSelect>` etc.**
  - **Purpose:** Select specific configuration values (Type, Time, Points, Options).
  - **Props:** `name`, `label`, `control`, `options`.
  - **`shadcn/ui` & Styling:** Use `<RHFSelectField>`.
  - **Data Flow:** Bound to corresponding fields (`type`, `time`, `pointsMultiplier`) in the current question's RHF state.
- **`<SlideActions>`**
  - **Purpose:** Container for Delete/Duplicate buttons.
  - **Props:** `onDelete`, `onDuplicate`.
  - **`shadcn/ui` & Styling:** `div`, `<Button variant="destructive">`, `<Button variant="outline">`. Icons: `<Trash2>`, `<Copy>`.
  - **Data Flow:** Buttons trigger callbacks passed from the parent to modify the main `QuizStructureHost.questions` array.

## 5. Data Flow & Form Handling (`QuestionHost` Editing)

- The parent component managing the editor (e.g., `<QuizEditorPage>`) holds the main `QuizStructureHost` state (likely via `useHostGameCoordinator` or similar).
- When a slide is selected via `<SlideNavigationSidebar>`, the corresponding `QuestionHost` object is passed down to `<QuestionEditorPanel>` and `<QuestionConfigurationSidebar>`.
- A `React Hook Form` instance (`useForm`) is initialized (or reset) within `<QuestionEditorPanel>` (or a wrapper around Panel+ConfigSidebar), using the passed `QuestionHost` data as `defaultValues`.
- A Zod schema, potentially conditional based on `questionType`, validates the form fields (`question`, `choices`, `time`, `pointsMultiplier`, etc.).
- All inputs and controls within the Center Panel and Right Sidebar bind to this _single_ form instance for the current question.
- Changes update the local RHF state immediately.
- **Saving:** When the user navigates to another slide, or clicks the global "Save" button:
  1. The current question's RHF form data is validated.
  2. If valid, the `onQuestionChange` callback (passed down to `<QuestionEditorPanel>`) is triggered with the updated `QuestionHost` data from the form state.
  3. The parent component updates the corresponding question object within the main `QuizStructureHost.questions` array in its state.
- **Correct Answer Logic:**
  - **Quiz/TF:** The `correct` boolean is derived based on the `correctChoiceIndex` saved in the RHF state when the data is finalized/saved back to the main quiz structure. The RHF form only needs to store the index of the selected correct answer.
  - **Jumble:** The `correct` boolean for each choice in `QuestionHost` should always be `true`. The correct _sequence_ is determined by the final order of the `choices` array in the RHF state.
  - **Open Ended:** The `correct` boolean for each choice (acceptable answer) in `QuestionHost` should always be `true`.

## 6. Handling Variations

- **Question Type:** The core strategy is conditional rendering within `<QuestionEditorPanel>` (for the answer area) and `<QuestionConfigurationSidebar>` (for relevant options) based on `currentQuestion.type`.
- **Number of Answers:** `<AnswerGrid>` renders 2 or 4 `<AnswerInput>` components based on props or `questionType`. `<SortableAnswerList>` and `<OpenEndedAnswerEditor>` dynamically handle the number of choices based on the RHF field array.

## 7. Reusability Notes

- **High Reusability:** Layout components, Header/Footer actions, `<MediaManager>`, `<SlideNavigationSidebar>`, RHF wrappers (`<RHFSelectField>`, `<RHFTextField>`, `<RHFTextAreaField>`), `<AIGenerateButton>`, `<SlideActions>`.
- **Core Editor Components (with variants/conditional logic):** `<QuestionEditorPanel>`, `<QuestionConfigurationSidebar>`.
- **Type-Specific Answer Editors:** `<AnswerGrid>`, `<AnswerInput>`, `<SortableAnswerList>`, `<DraggableEditorAnswerItem>`, `<OpenEndedAnswerEditor>`. While specific, they encapsulate complexity related to their type.

This detailed breakdown provides a flexible yet consistent architecture for the Question Editor screen, capable of handling various question types while maximizing component reuse.
