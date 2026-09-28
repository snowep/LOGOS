# LOGOS - Technical Design Document

## Architecture Overview
LOGOS follows a client-server architecture with real-time synchronization capabilities. The application is split into two main parts:
- **Frontend**: Single-page React application using Material UI v6
- **Backend**: Node.js/Express server providing REST API and WebSocket endpoints
- **Communication**: 
  - REST API for CRUD operations and workflow triggering
  - WebSocket for real-time file system change notifications
- **Storage**: Local file system (designated markdown folder)

## Technology Stack

### Frontend
- **Framework**: React 18+ with hooks
- **UI Library**: Material UI v9 (MUI)
- **State Management**: React Context API (for simplicity) or Redux Toolkit (if needed)
- **Markdown Processing**: marked or remark library for rendering
- **HTTP Client**: axios or fetch for API calls
- **WebSocket Client**: native WebSocket or Socket.IO client
- **Build Tool**: Vite or Create React App
- **Language**: JavaScript (with potential migration to TypeScript later)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **API Design**: RESTful endpoints for file operations
- **Real-time**: WebSocket library (ws or Socket.IO)
- **File System**: Native fs/promises with chokidar for watching
- **Markdown Parsing**: marked or remark for processing content
- **CORS**: Configured for localhost development
- **Environment**: dotenv for configuration

### Development Tools
- **Package Manager**: npm or yarn
- **Linting**: ESLint with Airbnb config
- **Formatting**: Prettier
- **Testing**: Jest (unit), React Testing Library (frontend), SuperTest (backend API)
- **Version Control**: Git

## System Components

### Frontend Components
1. **App Layout**: Main container with responsive drawer/header
2. **File Explorer Panel**: 
   - Tree view of markdown folders/files
   - Context menu for file operations (rename, delete, new)
   - Search bar for filtering files
   - Drag-and-drop support (future)
3. **Editor Panel**:
   - Markdown editor (using react-markdown or similar)
   - Split view: edit/preview modes
   - Toolbar for basic formatting (bold, italic, header, list, link)
   - Auto-save indicator
4. **Chat Interface**:
   - Message list with user/bot distinction
   - Input area with send button
   - Workflow trigger suggestions (based on chat context)
   - Markdown rendering for bot responses
5. **Workflow Panel** (optional):
   - List of available predefined workflows
   - Execution status and logs
6. **Settings Panel**:
   - Configuration for markdown folder path
   - Appearance/theme selection
   - Advanced options

### Backend Services
1. **File Service**:
   - CRUD operations on markdown files
   - File system watching for external changes
   - Path validation and security (restrict to designated folder)
   - Metadata extraction (size, dates, etc.)
2. **API Service**:
   - REST endpoints for file operations
   - Workflow triggering endpoints
   - Error handling and validation
3. **WebSocket Service**:
   - Broadcast file system changes to connected clients
   - Handle client connections/disconnections
   - Message queuing for offline clients (if needed)
4. **Workflow Engine**:
   - Registry of predefined workflows
   - Execution sandbox (limited to file operations initially)
   - Status tracking and result reporting
5. **LLM Service** (optional):
   - Proxy to LLM API (for chat responses)
   - Prompt engineering for workflow detection
   - Response caching

## Data Flow

### File Operations (Create/Read/Update/Delete)
1. User action in File Explorer or Editor triggers frontend event
2. Frontend sends REST API request to backend (e.g., POST /api/files for create)
3. Backend validates request, performs file system operation
4. Backend returns success/error response
5. Frontend updates UI optimistically, then syncs with response
6. Backend emits WebSocket event for file change
7. All connected clients receive update and refresh relevant views

### Chat Interaction
1. User types message in chat input and sends
2. Frontend sends message to backend via POST /api/chat
3. Backend processes message:
   - Checks for workflow trigger keywords/patterns
   - If workflow detected, triggers workflow engine
   - Otherwise, sends message to LLM service for response
4. Backend returns chat response (either from workflow or LLM)
5. Frontend displays response in chat panel
6. If workflow execution produces file changes, WebSocket updates trigger UI refresh

### Real-time Synchronization
1. Backend uses chokidar to watch designated markdown folder
2. On file change (create/update/delete), backend emits WebSocket event
3. All connected clients receive event and update their file views
4. Conflict resolution: Last write wins (with timestamp) or prompt user (future)

## Security Considerations
- **Localhost Only**: Binding to localhost/127.0.0.1 only, no external exposure
- **No Authentication**: By design for personal use; user responsible for machine security
- **Path Sanitization**: All file paths validated to prevent directory traversal
- **File Type Restriction**: Only allow .md files (optional)
- **Input Validation**: Sanitize all inputs to prevent injection attacks

## File Structure
```
LOGOS/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── layout/
│   │   ├── file-explorer/
│   │   ├── editor/
│   │   ├── chat/
│   │   └── workflow/
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service calls
│   ├── store/              # State management (Context/Redux)
│   ├── utils/              # Utility functions
│   ├── styles/             # CSS/MUI theme overrides
│   └── App.js              # Main application component
├── server/
│   ├── controllers/        # Request handlers
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic (file, workflow, websocket)
│   ├── middleware/         # Custom Express middleware
│   ├── utils/              # Backend utilities
│   └── server.js           # Entry point
├── markdown-vault/         # Default markdown storage folder (configurable)
├── package.json            # Frontend dependencies
├── server-package.json     # Backend dependencies (or monorepo setup)
├── vite.config.js          # or webpack.config.js
└── README.md
```

## Workflow Engine Details
### Predefined Workflows (MVP)
1. **Create Daily Note**: Creates a markdown file with today's date and template
2. **Search and Summarize**: Searches markdown for term, returns summary
3. **Tag Suggestion**: Analyzes file content and suggests tags
4. **Link Finder**: Finds related files based on common tags/keywords
5. **Backup Vault**: Creates timestamped backup of markdown folder

### Workflow Execution
- Triggered via chat command (e.g., "/workflow create-daily-note")
- Executed in backend service
- Progress and results reported back to chat
- File system changes trigger WebSocket updates

## Deployment Instructions (Localhost)
1. Clone repository
2. Install frontend dependencies: `npm install`
3. Install backend dependencies: `cd server && npm install`
4. Configure markdown folder path in `.env` (default: ./markdown-vault)
5. Start backend: `npm run dev` (or `node server.js`)
6. Start frontend: `npm run dev` (from root)
7. Access application at http://localhost:3000

## Future Enhancements
- TypeScript migration for frontend and backend
- User authentication (optional)
- Cloud sync capabilities
- Advanced AI agents for complex reasoning
- Plugin system for custom workflows
- Mobile responsive improvements
- Dark/light theme toggle
- Keyboard shortcuts
- Export/import vault functionality