# LOGOS - Product Requirements Document

## Overview
LOGOS is a JARVIS-like assistant designed to help individual power users manage their markdown-based knowledge base (similar to Obsidian vault) with AI-powered capabilities. It combines a chat interface with AI agents that can perform predefined workflows on the user's knowledge base.

## Core Purpose
To assist users in managing their personal knowledge base (markdown files) by providing:
- Text chat interface for interaction
- CRUD operations on markdown files
- AI-powered workflows for knowledge management
- Real-time synchronization with external file changes

## Target User
Individual power user who maintains a personal knowledge base and wants AI assistance in managing it.

## Core Features (MVP)

### 1. Markdown File Management
- View and navigate existing markdown files in a designated folder
- Create new markdown files
- Edit markdown files in-place
- Search within markdown content
- Link between markdown files (wiki-style)
- Tagging and categorization
- Graph view of file relationships (stretch goal)

### 2. Chat Interface
- Text-based chat with LLM (similar to Hermes)
- Ability to trigger predefined AI workflows from chat
- Hybrid approach: conversational AI + action triggers

### 3. AI Capabilities
- Simple chat with LLM for general assistance
- Predefined workflows that can perform actions:
  - File operations (create, read, update, delete)
  - Web search and summarization
  - Knowledge graph generation
  - Content analysis and tagging suggestions

### 4. Technical Specifications
- Frontend: React.js with Material UI (latest version)
- Backend: Node.js / Express
- Deployment: Localhost only (no authentication)
- Storage: Designated folder within the project (configurable)
- Real-time updates: WebSocket for live file synchronization
- Authentication: None (open localhost)

### 5. Non-Features (Explicitly Out of Scope)
- Smart home control
- Email management
- Calendar & scheduling
- Entertainment/media control
- Multi-user collaboration
- Cloud deployment
- Enterprise features

## Success Criteria
- User can perform all CRUD operations on markdown files through the interface
- AI can understand and execute simple predefined workflows via chat commands
- Real-time file synchronization works when external changes occur
- Interface is responsive and follows Material Design principles
- No authentication required for local development/use

## Future Enhancements (Post-MVP)
- Voice command input
- Integration with external services (web search APIs)
- Advanced AI agents for complex reasoning
- Graph visualization of knowledge connections
- Template system for common note types
- Export/import capabilities
- Plugin system for extending functionality