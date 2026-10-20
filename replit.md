# Pharmacy Prescription Processor

## Overview

The Pharmacy Prescription Processor is a web application designed to process and interpret medical prescriptions. The system uses AI-powered optical character recognition (OCR) to extract text from prescription images and translates medical abbreviations into plain language. This tool helps pharmacists and medical professionals quickly understand handwritten or printed prescriptions by digitizing and clarifying medical terminology.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React 19.2.0 with Vite as the build tool

The frontend is built as a single-page application (SPA) using modern React with functional components. The project uses Vite for fast development and optimized production builds, providing hot module replacement and efficient bundling.

**Styling Solution**: Tailwind CSS v4

The application uses Tailwind CSS with PostCSS for utility-first styling. This approach provides rapid UI development with consistent design patterns and minimal custom CSS. The PostCSS pipeline includes autoprefixer for cross-browser compatibility.

**Rationale**: 
- React provides a component-based architecture for maintainable UI code
- Vite offers superior developer experience with instant server start and fast HMR
- Tailwind CSS enables rapid prototyping and consistent styling without writing custom CSS

### Backend Architecture

**Production (Cloudflare)**: Pages Functions (JavaScript)

The production API runs as Cloudflare Pages Functions under `/api/*` (`functions/api/`). These Workers receive image uploads, call OpenAI Vision (with optional Google Vision REST fallback), and normalize medical abbreviations. Secrets are stored as Cloudflare environment variables (`OPENAI_API_KEY`, optional `GOOGLE_VISION_API_KEY`).

**Local / optional**: FastAPI (Python)

The original FastAPI backend in `backend/` remains for local Python development. Vite proxies `/api` to `http://127.0.0.1:8000` when using `npm run dev`.

**CORS Configuration**: 
The application allows all origins (`allow_origins=["*"]`) for cross-origin requests, enabling the frontend to communicate with the backend during development. This should be restricted to specific domains in production.

**Medical Abbreviation Processing**:
The system includes a comprehensive dictionary of medical abbreviations (bd, tid, prn, etc.) mapped to their full meanings. This enables automatic translation of medical shorthand into readable instructions.

**Rationale**:
- FastAPI provides high performance with async support for handling file uploads
- Built-in Pydantic validation ensures type safety for API requests/responses
- Python ecosystem offers robust libraries for image processing and AI integration

### Image Processing Pipeline

**OCR Services**: OpenAI Vision API (Primary) with Google Cloud Vision (Optional Fallback)

The application uses OpenAI's gpt-4o model for optical character recognition. This approach provides:
1. Primary OCR extraction using OpenAI Vision API (gpt-4o model)
2. Optional fallback to Google Cloud Vision API if OpenAI fails
3. Comprehensive medical text extraction and context understanding

**Supported File Formats**: JPEG and PNG images only

**Image Handling**: PIL (Python Imaging Library)

The system uses PIL for image validation and preprocessing before sending to OCR services. This includes format verification and basic image manipulation.

**Rationale**:
- OpenAI's gpt-4o provides excellent multimodal capabilities for prescription text extraction
- Google Cloud Vision serves as an optional fallback for redundancy
- PIL provides lightweight image validation without heavy dependencies

### Development Environment

**Development Server Configuration**:
- Host: `0.0.0.0` (accessible from all network interfaces)
- Port: 5000 (fixed with `strictPort: true`)
- This configuration supports containerized environments and remote development platforms like Replit

**Build System**: 
- ES Modules (`"type": "module"`) for modern JavaScript features
- Vite's optimized build pipeline for production deployments

## External Dependencies

### AI/ML Services

**Google Cloud Vision API** (Optional)
- Purpose: Optional fallback OCR service for prescription image text extraction
- Authentication: Requires Google Cloud credentials (service account or API key)
- Usage: Backup handwriting recognition and text extraction when OpenAI is unavailable

**OpenAI API**
- Purpose: Primary OCR service for prescription image text extraction using gpt-4o model
- Authentication: Requires OpenAI API key (configured via environment variable)
- Usage: Vision-based text extraction from prescription images

### Frontend Libraries

**React Ecosystem**
- `react@19.2.0`: Core UI library
- `react-dom@19.2.0`: DOM rendering

**Build Tools**
- `vite@7.1.9`: Development server and build tool
- `@vitejs/plugin-react@5.0.4`: React integration for Vite

**Styling**
- `tailwindcss@4.1.14`: Utility-first CSS framework
- `@tailwindcss/postcss@4.1.14`: PostCSS plugin for Tailwind
- `autoprefixer@10.4.21`: CSS vendor prefixing
- `postcss@8.5.6`: CSS transformation pipeline

### Backend Libraries

**Web Framework**
- `fastapi`: Async web framework with automatic API documentation
- CORS middleware for cross-origin request handling

**Data Validation**
- `pydantic`: Type validation and settings management via BaseModel

**Image Processing**
- `PIL` (Pillow): Image manipulation and format conversion
- `google.cloud.vision`: Google Cloud Vision client library
- `openai`: OpenAI API client library

### Environment Requirements

**API Keys/Credentials Needed**:
- `OPENAI_API_KEY`: OpenAI API authentication (required)
- Google Cloud credentials file or environment variable for Vision API (optional fallback)

**Runtime Environment**:
- Python 3.11 (for FastAPI backend)
- Node.js 20 (for Vite frontend build process)
- Network access to external AI APIs

## Recent Changes (October 2025)

**Implementation Complete**:
- Full-stack application with FastAPI backend and React frontend
- OpenAI gpt-4o integration for OCR extraction
- Medical abbreviation normalization with 30+ medical shorthand rules
- Three-column results display (Raw Data, Normalized Instructions, Administration Time)
- File upload with drag-and-drop support (JPEG, PNG)
- Error handling and loading states
- CORS configuration for cross-origin requests
- Modular architecture for easy extension of normalization rules

**File Format Support**:
- Supported: JPEG (.jpg, .jpeg), PNG (.png)
- Not supported: PDF (requires additional processing library)