# Quiz Creation UI: Add Slide Screen Component Architecture

**Version:** 1.0
**Date:** May 6, 2025
**Target Data:** Modifies `QuizStructureHost.questions` array, determines the `type` for a new `QuestionHost`.

## 1. Overview

This document outlines the component architecture for the **Add Slide screen**. This screen is displayed when the user initiates adding a new slide or question to the quiz (e.g., by clicking the "Add question" or "Add slide" button). It presents the available slide/question types (Quiz, True/False, Jumble, Open Ended, Content, etc.) for the user to choose from. Selecting a type triggers the creation of a new default slide of that type and typically navigates the user to the editor for that new slide.

The architecture leverages the reusable layout components (`<QuizEditorLayout>`, `<QuizEditorHeader>`, `<QuizEditorFooter>`) defined previously and introduces specific components for type selection.

## 2. Layout Architecture

The Add Slide screen uses the shared editor layout structure:

- **`<QuizEditorLayout>`:** (Reusable) The main application shell.
- **`<QuizEditorHeader>`:** (Reusable) Consistent top navigation bar. Actions like "Save" and "Preview" might be disabled or have different behaviour in this context.
- **Main Content Area:** Unlike the settings screen, this area is typically a single, centered column containing:
  - A screen title (e.g., "Add Slide").
  - The `<QuestionTypeSelectorGrid>` component.
- **`<QuizEditorFooter>`:** (Reusable) Consistent bottom bar.
  - For the Add Slide context, the central `<SlideNavigator>` is **hidden**.
  - The `<QuizSettingsButton>` is likely still present.
  - The `<AddSlideButton>` might be hidden or disabled, as the primary action is selecting a type from the grid.

## 3. Component Breakdown

### 3.1 Layout & Reusable Components

- **`<QuizEditorLayout>`:** (Defined previously)
- **`<QuizEditorHeader>`:** (Defined previously)
- **`<QuizEditorFooter>`:** (Defined previously - used with `showNavigator={false}`)
- **`<QuizSettingsButton>`:** (Defined previously)
- **`<AddSlideButton>`:** (Defined previously - potentially hidden/disabled here)

### 3.2 Add Slide Screen Specific Components

- **`ScreenTitle`:** (Simple Element) An `h1` or `h2` displaying "Add Slide".
- **`<QuestionTypeSelectorGrid>`:** A layout component (e.g., `div` with CSS Grid) responsible for arranging the `<QuestionTypeSelectorCard>` components.
- **`<QuestionTypeSelectorCard>`:** Represents a single, clickable card for selecting a question/slide type.

## 4. Detailed Component Descriptions

### 4.1 Layout Components

- **`<QuizEditorLayout>`**
  - **Purpose:** Provides the consistent outer shell.
  - **Props:** `children`.
  - **`shadcn/ui` & Styling:** `div`, Tailwind (`min-h-screen`, `flex`, `flex-col`).
- **`<QuizEditorHeader>`**
  - **Purpose:** Displays the top action bar.
  - **Props:** `showPreviewButton?`, `showSaveButton?`, etc. May pass `disabled` states for Preview/Save.
  - **`shadcn/ui` & Styling:** `header`, `div`, `<Button>`, Tailwind (`flex`, `justify-between`, `items-center`, `p-4`, `border-b`).
- **`<QuizEditorFooter>`**
  - **Purpose:** Displays the bottom bar content.
  - **Props:** `showNavigator={false}`, `showAddButton={false}` (or `true` but disabled), `showSettingsButton={true}`, `children`.
  - **`shadcn/ui` & Styling:** `footer`, `div`, Tailwind (`flex`, `justify-between`, `items-center`, `p-2`, `border-t`).

### 4.2 Functional / UI Components

- **`ScreenTitle`**
  - **Purpose:** Display the title "Add Slide".
  - **Props:** None (or `children` if made a component).
  - **`shadcn/ui` & Styling:** `h1` or `h2`, Tailwind (`text-2xl`, `font-bold`, `my-6`, `text-center`).
- **`<QuestionTypeSelectorGrid>`**
  - **Purpose:** Arrange the type selection cards in a responsive grid.
  - **Props:** `children`.
  - **`shadcn/ui` & Styling:** `div`, Tailwind (`grid`, `grid-cols-2`, `md:grid-cols-3`, `gap-4`, `max-w-3xl`, `mx-auto`).
- **`<QuestionTypeSelectorCard>`**
  - **Purpose:** Display a single question/slide type option and handle its selection.
  - **Props:**
    - `type: QuestionHost['type']` (e.g., 'quiz', 'jumble', 'content') - Used to identify the type selected.
    - `title: string` - Display name (e.g., "Multiple Choice", "Info Slide").
    - `description: string` - Brief explanation.
    - `icon: React.ElementType` - Icon component (e.g., Lucide icon).
    - `onClick: (type: QuestionHost['type']) => void` - Callback function when the card is clicked.
  - **`shadcn/ui` & Styling:** `<Card className="cursor-pointer hover:border-primary transition-colors">`, `<CardHeader>`, `<CardContent>`, `<CardTitle>`, `<CardDescription>`. Internal layout using Flexbox. Tailwind for spacing, text styles. Custom or `Lucide` icons.
  - **Data Flow:** When clicked, it invokes the `onClick` prop, passing its `type`.

## 5. Data Flow & Interaction

1.  The user navigates to this screen (likely triggered by `<AddQuestionButton>` or `<AddSlideButton>`).
2.  The `<QuestionTypeSelectorGrid>` renders multiple `<QuestionTypeSelectorCard>` components, each configured with its specific `type`, `title`, `description`, `icon`, and the shared `onClick` handler.
3.  The user clicks on a `<QuestionTypeSelectorCard>`.
4.  The `onClick(type)` handler (defined in the parent page/component managing the editor state) is executed with the selected `type`.
5.  This handler performs the following logic:
    - Creates a new default `QuestionHost` object based on the selected `type` (e.g., a Quiz question with default empty choices, a default Content slide).
    - Locates the `questions` array within the main `QuizStructureHost` state object.
    - Appends the newly created `QuestionHost` object to this array.
    - Updates the overall application state (e.g., using `setLiveGameState` or similar) with the modified `QuizStructureHost`.
    - Updates the editor's current view state to focus on the newly added slide (e.g., setting `currentSlideIndex` to the index of the new slide).
    - This state update triggers a re-render, causing the UI to display the appropriate Question Editor panel for the new slide.

## 6. Handling Variations

- This screen itself has minimal variations. It primarily displays static options. The main variation compared to other screens is the content of the main area and the simplified footer.

## 7. Reusability Notes

- **Highly Reusable:** `<QuizEditorLayout>`, `<QuizEditorHeader>`, `<QuizEditorFooter>`, `<QuizSettingsButton>`, `<AddSlideButton>`.
- **Specific to this Screen:** `<QuestionTypeSelectorGrid>`, `<QuestionTypeSelectorCard>`. These are purpose-built for the task of selecting a slide type.

This screen acts as a functional selection hub, using the consistent layout shell but presenting unique interactive cards (`<QuestionTypeSelectorCard>`) to drive the core logic of adding different types of slides to the quiz structure.
