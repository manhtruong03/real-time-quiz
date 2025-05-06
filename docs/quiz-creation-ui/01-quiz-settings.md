# Quiz Creation UI: Settings Screen Component Architecture

**Version:** 1.0
**Date:** May 6, 2025
**Target Data:** `QuizStructureHost` (root fields)

## 1. Overview

This document outlines the proposed component architecture for the **Quiz Settings screen**. This is typically the initial screen presented when creating or editing a quiz. It allows users to define the core metadata for their quiz, such as title, description, cover image, tags, visibility, and language.

The architecture prioritizes reusability and consistency, leveraging our tech stack (`Next.js`, `React`, `TypeScript`, `shadcn/ui`, `Tailwind CSS`, `React Hook Form`, `Zod`). The data managed by this screen directly corresponds to the root-level fields of the `QuizStructureHost` type defined in `src/lib/types/quiz-structure.ts`.

## 2. Layout Architecture

The Settings screen employs a consistent layout structure managed by shared components, aiming for a familiar feel across the entire quiz editor:

- **`<QuizEditorLayout>`:** (Reusable) The top-level application shell.
  - Provides the base background styling (default or custom).
  - Establishes the main flex-column structure containing Header, Main Content, and Footer slots.
  - Manages overall padding and potentially max-width constraints.
- **`<QuizEditorHeader>`:** (Reusable) The top navigation/action bar.
  - Displays branding (`<BrandLogo>`).
  - Contains primary actions relevant to the current editor context. For Settings, this includes:
    - `<QuizPreviewButton>`
    - `<QuizSaveButton>` (labelled "Done")
- **`<SettingsContentLayout>`:** (Specific to Settings) The main content area layout.
  - Implements a responsive two-column grid (e.g., `md:grid-cols-2`).
  - Column 1: Houses the `<CoverMediaManager>`.
  - Column 2: Houses the `<QuizMetadataForm>`.
- **`<QuizEditorFooter>`:** (Reusable) The bottom bar.
  - For the Settings context, it displays:
    - `<QuizSettingsButton>`
    - `<SlideNavigator>` (Provides context even when editing global settings)
    - `<AddSlideButton>`

## 3. Component Breakdown

### 3.1 Major Functional Components

- **`<CoverMediaManager>`:** (Reusable) Manages the state and interactions for the quiz cover image. Handles placeholder display, image upload/selection, display of the selected image, overlay controls (replace, delete, edit, zoom - functionalities TBD), and AI generation triggering.
- **`<QuizMetadataForm>`:** (Specific to Settings) The core `React Hook Form` wrapper for all quiz-level metadata fields (title, description, tags, language, visibility, etc.). Manages form state, validation, and submission logic.

### 3.2 Granular UI Components

_(Primarily used within `<QuizMetadataForm>` or other major components)_

- **`<RHFTextField>`:** (Reusable) RHF-integrated wrapper for `shadcn/ui <Input>`. Includes `<Label>`, error handling via `<FormMessage>`, optional clear button, and optional `<AIGenerateButton>`.
- **`<RHFTextAreaField>`:** (Reusable) RHF-integrated wrapper for `shadcn/ui <Textarea>`. Similar features to `<RHFTextField>`.
- **`<RHFTagInputField>`:** (Reusable) RHF-integrated wrapper for the custom `<TagInput>` component. Includes `<Label>`, error handling, and optional `<AIGenerateButton>`.
- **`<TagInput>`:** (Potentially Reusable) Custom component handling the logic and UI for adding, displaying (as `<Badge>`), and removing tags within a form field.
- **`<RHFSelectField>`:** (Reusable) RHF-integrated wrapper for `shadcn/ui <Select>`. Includes `<Label>`, error handling, and takes options list as prop. Used for Language, Visibility, etc.
- **`<AIGenerateButton>`:** (Reusable) A button component, often placed next to input fields, to trigger AI content suggestions. Includes loading state and icon.
- **`<MediaPlaceholder>`:** (Internal to `<CoverMediaManager>`) Displays when no media is selected, includes "Add media" and AI buttons.
- **`<MediaDisplayControls>`:** (Internal to `<CoverMediaManager>`) Overlay controls shown on hover/focus over existing media (Delete, Replace, etc.).
- **`<SlideNavigator>`:** (Reusable) Displays the horizontal list of slide thumbnails in the footer.
- **`<SlideThumbnail>`:** (Reusable) Renders a single slide preview within the `<SlideNavigator>`.
- **Action Buttons:** (`<QuizSettingsButton>`, `<QuizPreviewButton>`, `<QuizSaveButton>`, `<AddSlideButton>`, etc.) - Likely simple wrappers around `shadcn/ui <Button>` with specific icons and onClick handlers.

## 4. Detailed Component Descriptions

### 4.1 Layout Components

- **`<QuizEditorLayout>`**
  - **Purpose:** Main application layout shell.
  - **Props:** `children`.
  - **`shadcn/ui` & Styling:** `div`, Tailwind (`min-h-screen`, `flex`, `flex-col`), potentially custom background styles.
- **`<QuizEditorHeader>`**
  - **Purpose:** Consistent top bar for actions and branding.
  - **Props:** `showPreviewButton?`, `showSaveButton?`, `onSave?`, `onPreview?`, `children` (for optional title input/status).
  - **`shadcn/ui` & Styling:** `header`, `div`, `<Button>`, Tailwind (`flex`, `justify-between`, `items-center`, `p-2` or `p-4`, `border-b`). Icons: `<Eye>`, `<Check>`/`<Save>`.
- **`<SettingsContentLayout>`**
  - **Purpose:** Two-column layout for settings content.
  - **Props:** `children`.
  - **`shadcn/ui` & Styling:** `main`, `div`, Tailwind (`grid`, `md:grid-cols-2`, `gap-4`, `p-4` or `p-6`).
- **`<QuizEditorFooter>`**
  - **Purpose:** Consistent bottom bar container. Conditionally renders content.
  - **Props:** `showNavigator?`, `showAddButton?`, `showSettingsButton?`, `children`.
  - **`shadcn/ui` & Styling:** `footer`, `div`, Tailwind (`flex`, `justify-between`, `items-center`, `p-2`, `border-t`). Contains slots for left/center/right content.

### 4.2 Functional Components

- **`<CoverMediaManager>` (Concept: `<MediaManager>`)**
  - **Purpose:** Manage cover image lifecycle (placeholder, upload, display, controls, AI).
  - **Props:** `fieldName: string` (RHF name, e.g., "cover"), `control: Control` (RHF), `setValue: UseFormSetValue<QuizStructureHost>` (RHF), `label?: string`, `onGenerateAI?: () => Promise<string | null>`, `aspectRatio?: string` ("16/9").
  - **`shadcn/ui` & Styling:** `<Card>`/`div` (container), `<Button>`, `<Tooltip>`, `<Input type="file">` (hidden), `<Image>` (Next.js), Tailwind (layout, placeholders, overlay). Icons: `<ImagePlus>`, `<Sparkles>`, `<Replace>`, `<Trash2>`, `<PenLine>`, `<ZoomIn>`, `<ZoomOut>`.
  - **Data Flow:** Binds to `cover` field via RHF `control`. Upload/AI Generation calls APIs and updates the `cover` URL using `setValue`. Delete sets value to `null`. Placeholder shown if value is null/empty.
- **`<QuizMetadataForm>`**
  - **Purpose:** Context provider for RHF, structures the metadata form fields.
  - **Props:** `onSubmit: SubmitHandler<QuizMetadataSchema>` (RHF), `initialData?: DeepPartial<QuizMetadataSchema>`, `children`.
  - **`shadcn/ui` & Styling:** `<Form>` (from `shadcn/ui`, wraps RHF `FormProvider`), `form` element.
  - **Data Flow:** Initializes `useForm` with Zod schema (`QuizMetadataSchema` - a subset of `QuizStructureHost`). Manages state for `title`, `description`, `tags`, `language`, `visibility`, `cover`. Passed `onSubmit` triggered by `<QuizSaveButton>`.

### 4.3 Granular UI Components

- **`<RHFTextField>` / `<RHFTextAreaField>`**
  - **Purpose:** Standardized RHF input/textarea with label, errors, optional AI/Clear.
  - **Props:** `name: Path<QuizMetadataSchema>`, `label: string`, `control: Control<QuizMetadataSchema>`, `showAIButton?`, `onGenerateAI?: (fieldName: string) => void`, `showClearButton?`, input/textarea props.
  - **`shadcn/ui` & Styling:** `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`, `<Input>`/`<Textarea>`, `<Button>`, `<AIGenerateButton>`. Tailwind (`flex`, `gap-2`). Icons: `<X>`, `<Sparkles>`.
  - **Data Flow:** Uses RHF `<Controller>` or `register`. AI/Clear buttons interact with RHF `setValue`. Displays Zod validation errors. Maps to `title`, `description`.
- **`<RHFTagInputField>`**
  - **Purpose:** Integrates `<TagInput>` with RHF.
  - **Props:** `name: Path<QuizMetadataSchema>`, `label: string`, `control: Control<QuizMetadataSchema>`, `showAIButton?`, `onGenerateAI?`.
  - **`shadcn/ui` & Styling:** `<FormField>`, etc. Wraps `<TagInput>`.
  - **Data Flow:** Connects `<TagInput>` `value`/`onChange` to RHF array field `tags`.
- **`<TagInput>`**
  - **Purpose:** UI for managing a list of tags.
  - **Props:** `value: string[]`, `onChange: (tags: string[]) => void`, `placeholder?`.
  - **`shadcn/ui` & Styling:** `<Input>`, `<Badge variant="secondary">`, `<Button variant="ghost" size="icon">`, Tailwind (`flex`, `flex-wrap`, `gap-1`). Icon: `<X>`.
  - **Data Flow:** Internal state for current input. `onChange` prop updates the RHF array.
- **`<RHFSelectField>`**
  - **Purpose:** Standardized RHF select dropdown.
  - **Props:** `name: Path<QuizMetadataSchema>`, `label: string`, `control: Control<QuizMetadataSchema>`, `options: Array<{ value: string; label: string }>`, `placeholder?`.
  - **`shadcn/ui` & Styling:** `<FormField>`, `<FormItem>`, `<FormLabel>`, `<Select>`, `<FormControl>`, `<SelectTrigger>`, `<SelectValue>`, `<SelectContent>`, `<SelectItem>`, `<FormMessage>`.
  - **Data Flow:** Uses RHF `<Controller>` to bind `<Select>` value. Maps to `language`, `visibility`.
- **`<AIGenerateButton>`**
  - **Purpose:** Button to trigger AI generation for a field.
  - **Props:** `onClick: () => Promise<string | string[] | null>`, `updateField: (value: any) => void` (passed from RHF field context), `isLoading`.
  - **`shadcn/ui` & Styling:** `<Button variant="ghost">`, `<Tooltip>`. Icons: `<Sparkles>`/`<Wand2>`.
  - **Data Flow:** Calls `onClick`, displays loading, calls `updateField` with result.
- **`<SlideNavigator>` / `<SlideThumbnail>`:**
  - **Purpose:** Display quiz structure, allow navigation (in footer).
  - **Props (`Navigator`):** `slides`, `currentSlideIndex`, `onSelectSlide`.
  - **`shadcn/ui` & Styling:** `<ScrollArea>`, custom `<SlideThumbnail>` (maybe `<Card>`), Tailwind.
  - **Data Flow:** Primarily display/navigation, relevant state managed by parent editor component.

## 5. Data Flow & Form Handling (`QuizStructureHost` Mapping)

- The `<QuizMetadataForm>` component orchestrates the data flow for the settings screen using `React Hook Form`.
- A Zod schema (`QuizMetadataSchema`) defines the validation rules for fields like `title` (required string), `description` (string), `visibility` (enum/number), `tags` (array of strings, optional), `language` (string, optional), `cover` (URL string, optional).
- `useForm` hook initializes the form state, using `defaultValues` for a new quiz or populated values when editing an existing `QuizStructureHost`.
- Each `RHF*` component uses the RHF `control` object (passed down or via context) to register itself and bind its value to the form state.
- Changes in inputs directly update the RHF state.
- `<CoverMediaManager>` updates the `cover` field in the RHF state via `setValue`.
- `<AIGenerateButton>` updates corresponding fields (`title`, `description`, `tags`) via `setValue`.
- Validation errors from the Zod schema are automatically displayed by `<FormMessage>`.
- The main "Done" button (`<QuizSaveButton>`) triggers the `onSubmit` handler passed to `<QuizMetadataForm>`, which receives the validated form data, ready to be used to update the main `QuizStructureHost` state or send to the backend.

## 6. Handling Variations

- **Empty vs. Filled State:** RHF's `defaultValues` handles the initial empty state (showing placeholders in inputs). When editing, the form is populated with existing data. `shadcn/ui` inputs have built-in placeholder support.
- **Media Placeholder vs. Display:** The `<CoverMediaManager>` component internally manages rendering either the `<MediaPlaceholder>` sub-component (with "Add media" / AI buttons) or the image display with overlay controls, based on whether the `cover` field in the RHF state has a value.

## 7. Reusability Notes

- **Highly Reusable:** `<QuizEditorLayout>`, `<QuizEditorHeader>`, `<QuizEditorFooter>`, `<RHFTextField>`, `<RHFTextAreaField>`, `<RHFSelectField>`, `<AIGenerateButton>`, `<MediaManager>` (designed for both cover and question media), `<SlideNavigator>`, `<SlideThumbnail>`.
- **Potentially Reusable:** `<TagInput>` (if tags are used elsewhere).
- **Specific to Settings:** `<SettingsContentLayout>`, `<QuizMetadataForm>` (the specific composition of fields is unique to quiz-level settings).

This unified architecture provides a clear structure for the Quiz Settings screen, ensuring consistency with the overall editor design while leveraging reusable components and standard practices for form handling and data flow.
