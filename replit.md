# AI Action Learning Facilitator

## Overview
A mobile-first AI-powered Action Learning facilitator app that helps enterprise teams conduct structured problem-solving workshops. The AI replaces parts of the traditional "Facilitator" role, providing topic evaluation, risk analysis, question classification, and summary generation.

## Architecture
- **Frontend**: Expo (React Native) with file-based routing via expo-router
- **Backend**: Express.js server with OpenAI AI integration (Replit AI Integrations)
- **Database**: PostgreSQL (Replit built-in) for workshop history persistence
- **State Management**: React Context (WorkshopContext) for global workshop state
- **Styling**: React Native StyleSheet with custom color theme
- **Fonts**: @expo-google-fonts/inter
- **Charts**: Custom radar chart using react-native-svg

## Project Structure
```
app/
  _layout.tsx          - Root layout with providers (fonts, context, error boundary)
  index.tsx            - Home/entry screen with history entry
  stage1.tsx           - Topic submission & AI quality evaluation
  stage2.tsx           - Pre-mortem AI warning analysis
  stage3.tsx           - Question storm with 5F radar chart & multi-select golden questions
  stage4.tsx           - Cognitive reconstruction, action plan & auto-save to DB
  history.tsx          - Workshop history list
  history-detail.tsx   - Workshop detail view (topic, participants, golden questions, report)
components/
  AICard.tsx           - AI-styled card with sparkles icon
  ErrorBoundary.tsx    - Error boundary wrapper
  ErrorFallback.tsx    - Error fallback UI
  LoadingDots.tsx      - Animated loading dots indicator
  RadarChart.tsx       - SVG-based radar chart component
  ScoreCircle.tsx      - Circular progress score indicator
  StageProgress.tsx    - 4-stage progress bar
constants/
  colors.ts            - Theme color constants
contexts/
  WorkshopContext.tsx   - Global workshop state (topic, questions, radar, actions)
server/
  routes.ts            - AI API routes + workshop CRUD
  index.ts             - Express server setup
```

## Database Schema
- **workshops** table: id (serial PK), topic_title, topic_background, topic_pain_points, topic_tried_actions, total_score, golden_questions (JSONB), participants (JSONB), reflections, action_plan (JSONB), summary_report, created_at, completed_at

## Key Features
1. **Stage 1**: Topic submission with AI 6-dimension quality scoring (radar chart)
2. **Stage 2**: AI pre-mortem risk analysis and warning
3. **Stage 3**: 5F question storm with real-time classification, blind spot detection, shadow questions, multi-select golden questions
4. **Stage 4**: Golden question review, 4-layer cognitive reconstruction, action plan, AI summary report, auto-save to database
5. **History**: View past workshops with time, topic, participants, score, summary report, and full detail view

## API Routes
- POST /api/evaluate-topic - AI evaluates topic quality (streaming SSE)
- POST /api/pre-mortem - AI generates risk warnings (streaming SSE)
- POST /api/classify-question - AI classifies question into 5F category
- POST /api/shadow-questions - AI generates questions for missing dimensions
- POST /api/generate-summary - AI generates workshop summary report (streaming SSE)
- POST /api/workshops - Save completed workshop to database
- GET /api/workshops - List all workshop history (most recent first)
- GET /api/workshops/:id - Get workshop detail by ID

## AI Integration
Uses Replit AI Integrations (OpenAI) with gpt-5.2 model. No API key required - charges billed to Replit credits.
