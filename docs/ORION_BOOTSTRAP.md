# ORION — BOOTSTRAP CHECKLIST

This is the practical first build instruction.

## Step 1 — Inspect
Before changing anything:
```
bash
node --version
npm --version
git status
```

Inspect the repository tree.

## Step 2 — Create the application
The web application is:
```
text
Next.js
React
TypeScript
TSX
App Router
```

## Step 3 — Install MUI
Use the latest stable MUI packages at bootstrap.
```
bash
npm install @mui/material@latest @emotion/react@latest @emotion/styled@latest @mui/icons-material@latest
```

## Step 4 — Create Express API
Use Express 5.
```
bash
npm install express@latest
```

## Step 5 — SQLite
Start with:
```
bash
npm install better-sqlite3@latest
```

Verify native module compatibility with the selected Node version.

## Step 6 — Environment
Create:
```
text
.env.example
```

Expected concepts:
```
text
ORION_HOME=
ORION_WORKSPACE_ROOT=
ORION_API_URL=
ORION_MODEL_PROVIDER=
ORION_MODEL_BASE_URL=
ORION_MODEL_NAME=
TELEGRAM_BOT_TOKEN=
```

Never commit the real `.env`.

## Step 7 — First run
The first goal is simply:
```
text
web starts
API starts
web can call API
health works
```

Do not start building councils, memory, retrieval, or automation at bootstrap.

## Step 8 — First real data test
After storage exists:
```
text
create project
→ write project.md
→ read project.md
→ update project.md manually
→ detect change
```

## Step 9 — First approval test
Later:
```
text
user asks for file change
→ ORION proposes
→ user approves
→ ORION changes file
→ ORION verifies
```

This becomes the central safety test.

## Step 10 — Remember
Do not optimize for how much code exists.
Optimize for whether the whole loop works correctly.