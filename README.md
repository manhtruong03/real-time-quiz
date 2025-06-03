# Vui Quiz - Real-Time Quiz Platform

Vui Quiz is an interactive, real-time quiz application designed to create engaging and educational experiences. Users can create quizzes, host live game sessions, and review detailed reports. This project is built with a modern front-end stack focusing on performance, type safety, and a great user experience.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure Overview](#project-structure-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Development Server](#running-the-development-server)
  - [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)

## Features

- **User Authentication:** Secure registration and login for users.
- **Quiz Creation & Management:**
  - Intuitive interface for creating and editing quizzes.
  - Support for various question types (Multiple Choice, True/False, Jumble, Open-Ended, Survey, Content Slides).
  - Media uploads for quiz covers and question images.
  - Configuration options for time limits, points, etc.
- **Real-Time Gameplay:**
  - Host live quiz sessions with a unique game PIN.
  - Players join using the PIN and a nickname.
  - Real-time question broadcasting and answer submission via WebSockets.
  - Live leaderboards and results.
  - Avatar selection for players.
  - Game settings for lobby (background, music).
  - Animated scoreboards and podium.
- **Detailed Reports:**
  - Session summaries with overall statistics.
  - Player performance reports (rank, score, accuracy).
  - Question-specific reports:
    - Filters for "All Questions" and "Difficult Questions".
    - Client-side search for question titles and choice content.
    - Client-side sorting by question order and correctness percentage.
    - "Load more" button for viewing questions.
    - Conditional display for survey/content type questions in reports./components/questions/AnswerChoiceReportItem.tsx"]
- **Responsive Design:** UI adapts to various screen sizes.
- **Theming:** Light and Dark mode support.

## Tech Stack

- **Framework:** Next.js (v15.2.4)
- **Language:** TypeScript (v5)
- **UI Library:** React (v19)
- **UI Components:** shadcn/ui (built on Radix UI)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Form Handling:** React Hook Form (v7.55.0)
- **Schema Validation:** Zod (v3.24.3)
- **WebSocket Client:** @stomp/stompjs (v7.1.1)
- **Drag & Drop:** @dnd-kit (core, sortable, utilities)
- **Date Formatting:** date-fns (v4.1.0)
- **Animation:** Framer Motion (v12.10.4)
- **Package Manager:** pnpm

## Project Structure Overview

- **`/src/app/`**: Main application routes using Next.js App Router.
  - **`/src/app/(pages)/`**: Page components (e.g., `home`, `login`, `signup`, `reports`, `my-quizzes`, `quiz/create`, `game/host`, `game/player`).
  - **`/src/app/api/`**: (If any frontend API routes, though most API interactions are with an external backend).
- **`/src/components/`**: Reusable UI components.
  - **`/src/components/ui/`**: shadcn/ui components.
  - **`/src/components/layout/`**: Layout components like `AppHeader`.
  - **`/src/components/game/`**: Components specific to the gameplay views (host, player, common elements).
  - **`/src/components/quiz-editor/`**: Components for the quiz creation and editing interface.
  - **`/src/components/auth/`**: Authentication-related components like `ProtectedRoute`.
- **`/src/context/`**: React Context providers (e.g., `AuthContext`, `GameAssetsContext`).
- **`/src/hooks/`**: Custom React hooks for managing complex logic.
  - **`/src/hooks/game/`**: Hooks for game coordination, WebSocket handling, state management.
  - **`/src/hooks/quiz-editor/`**: Hooks for quiz creation and editing logic.
- **`/src/lib/`**: Core utilities, type definitions, API communication clients, and schemas.
  - **`/src/lib/api/`**: Functions for interacting with the backend API.
  - **`/src/lib/schemas/`**: Zod schemas for form validation.
  - **`/src/lib/types/`**: TypeScript type definitions.
  - **`/src/lib/utils.ts`**: Utility functions (e.g., `cn` for Tailwind).
- **`/public/`**: Static assets.
- **`/docs/`**: Project documentation, including API specs and data structures.
- **`/__mocks__/`**: Mock data for development and testing.

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended, e.g., v18 or v20)
- pnpm (packet manager)

### Installation

1.  **Install pnpm globally (if you haven't already):**

    ```bash
    npm install -g pnpm
    ```

2.  **Clone the repository:**

    ```bash
    git clone https://github.com/manhtruong03/real-time-quiz
    cd real-time-quiz # Or your project directory name
    ```

3.  **Install dependencies:**
    ```bash
    pnpm install
    ```
    This command will install all dependencies listed in `package.json` and `pnpm-lock.yaml`, including specific libraries like `@dnd-kit/core`, `@stomp/stompjs`, `qrcode.react`, `jwt-decode` etc.

### Running the Development Server

To start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser to see the result.

### Building for Production

To create an optimized production build:

```bash
pnpm build
```

This command compiles the TypeScript, bundles assets, and optimizes the application. The output will be in the `.next` folder.

## Deployment

To deploy the built application (e.g., on a VPS):

1.  Ensure Node.js and pnpm are installed on your VPS.

2.  Copy the entire project folder (including the `.next` folder from the build, `package.json`, `pnpm-lock.yaml`, `public`, and any configuration files like `next.config.mjs`) to your VPS.

3.  On the VPS, navigate to the project directory.

4.  Install production dependencies:

    ```bash
    pnpm install --prod
    ```

5.  Start the Next.js production server:

    ```bash
    pnpm start
    ```

    It's highly recommended to use a process manager like PM2 or NSSM (for Windows) to keep the application running reliably in the background.

    **Example with PM2 (Linux):**

    ```bash
    # Install PM2 globally
    sudo pnpm install -g pm2

    # Start your Next.js app
    pm2 start pnpm --name "vui-quiz-frontend" -- start

    # To make PM2 restart on server reboot
    pm2 startup
    pm2 save
    ```

## API Documentation

The backend API documentation (OpenAPI specification) can be found in `/docs/api-docs.json`. This file details all available endpoints, request/response schemas, and authentication requirements.

Additional documentation on WebSocket communication protocols and data structures are also available in the `/docs` folder.
