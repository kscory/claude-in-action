# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator that creates components in real-time using Claude AI. The application features a virtual file system, live preview capabilities, and component persistence for authenticated users.

## Development Commands

```bash
# Initial setup - install dependencies and initialize database
npm run setup

# Development server with Turbopack
npm run dev

# Development server with background logging
npm run dev:daemon

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Run tests
npm test

# Run specific test file
npm test -- src/path/to/test.test.ts

# Reset database (WARNING: destroys all data)
npm run db:reset
```

## Architecture Overview

### Core Components
- **Virtual File System** (`src/lib/file-system.ts`): In-memory file system that doesn't write to disk
- **Chat Interface** (`src/components/chat/`): AI conversation interface using Vercel AI SDK
- **Preview Frame** (`src/components/preview/PreviewFrame.tsx`): Live component preview with hot reload
- **Code Editor** (`src/components/editor/`): Monaco-based editor with file tree
- **Authentication System** (`src/lib/auth.ts`): JWT-based auth with bcrypt password hashing

### Key Contexts
- **FileSystemProvider** (`src/lib/contexts/file-system-context.tsx`): Manages virtual file operations and state
- **ChatProvider** (`src/lib/contexts/chat-context.tsx`): Handles AI conversations and project persistence

### Database Schema
Uses Prisma with SQLite:
- **User**: Authentication and project ownership
- **Project**: Stores chat messages and virtual file system state as JSON

### AI Integration
- **Chat API** (`src/app/api/chat/route.ts`): Streams responses from Claude with tool usage
- **Tools** (`src/lib/tools/`): `str_replace_editor` and `file_manager` for file operations
- **Generation Prompt** (`src/lib/prompts/generation.tsx`): System prompt for component generation

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **Database**: Prisma with SQLite (generated client in `src/generated/prisma/`)
- **AI**: Anthropic Claude via Vercel AI SDK
- **Testing**: Vitest with React Testing Library
- **Authentication**: JWT with bcrypt
- **Editor**: Monaco Editor with React wrapper

## Development Notes

### File System Architecture
The virtual file system operates entirely in memory - no files are written to disk during normal operation. All file operations are handled through the `VirtualFileSystem` class and synchronized with the UI through React contexts.

### AI Tool Usage
The chat API uses two primary tools:
- `str_replace_editor`: Creates, edits, and replaces content in files
- `file_manager`: Handles file/directory operations like rename and delete

### Preview System
The preview frame dynamically compiles and renders React components using Babel standalone for JSX transformation. Components are isolated in their own iframe context.

### Database Integration
Project data (chat history and file system state) is persisted only for authenticated users. Anonymous users work with ephemeral state that resets on page refresh.

### Environment Setup
The app can run without an API key - it will use static mock responses instead of calling Claude AI. Set `ANTHROPIC_API_KEY` in `.env` for full AI functionality.
- Use comments sparingly. Only comment complex code.
- The database schema is defined in the @prisma/schema.prisma file. Reference it anytime you need to understand the structure of data stored in the database.
- vitest config is in vitest.config.mts