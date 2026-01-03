# replit.md

## Overview

This is a Hotel & Restaurant Management System - a full-stack web application for managing hotel room bookings, restaurant orders, and guest services. The system provides both guest-facing features (room browsing, reservations, restaurant menu, ordering) and staff/admin management interfaces (room inventory, menu management, kitchen orders, reservation management).

The application follows a hospitality industry dual-personality design approach: welcoming aesthetics for guest areas inspired by Airbnb, and clean efficiency for management interfaces inspired by Linear.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with custom design tokens for a boutique hotel aesthetic
- **UI Components**: shadcn/ui component library (New York style) with Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints defined in shared route contracts (`shared/routes.ts`)
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Password Security**: Scrypt hashing with timing-safe comparison

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Session Storage**: connect-pg-simple for PostgreSQL session store
- **Schema Location**: `shared/schema.ts` contains all table definitions

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks (auth, rooms, reservations, restaurant)
│   │   ├── pages/        # Route components
│   │   └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── auth.ts       # Authentication setup
│   ├── db.ts         # Database connection
│   ├── routes.ts     # API route handlers
│   └── storage.ts    # Data access layer
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API contract definitions with Zod
```

### Key Design Patterns
- **Shared Contracts**: API routes and validation schemas are defined once in `shared/routes.ts` and used by both client and server for type safety
- **Storage Abstraction**: Database operations are encapsulated in `storage.ts` implementing the `IStorage` interface
- **Custom Hooks**: Each domain (auth, rooms, reservations, restaurant) has dedicated React hooks wrapping React Query mutations and queries
- **Role-Based Access**: User roles (guest, staff, admin/manager) determine dashboard access and available features

### Theme System
- Light/dark mode support via CSS custom properties
- Warm neutral color palette designed for hospitality (boutique hotel vibe)
- Custom font families: Playfair Display for headings, Lato for body text

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations stored in `/migrations`

### Authentication & Sessions
- **Passport.js**: Authentication framework
- **passport-local**: Username/password authentication strategy
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session storage

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form state management
- **zod**: Schema validation (shared between client/server)
- **wouter**: Lightweight routing
- **lucide-react**: Icon library
- **date-fns**: Date formatting and manipulation
- **recharts**: Dashboard charts and analytics

### UI Framework
- **Radix UI**: Headless component primitives (dialog, dropdown, tabs, etc.)
- **class-variance-authority**: Component variant management
- **tailwind-merge**: Tailwind class deduplication
- **embla-carousel-react**: Carousel component

### Build & Development
- **Vite**: Frontend build tool and dev server
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption secret (defaults to "r3pl1t" in development)