# ORION — STACK BASELINE

Checked: 2026-09-25

Current official reference points at this project bootstrap date:
- React 19.3 is the latest React release listed by the official React documentation.
- Material UI v9 is the latest stable major listed by the official MUI documentation.
- Next.js 16.3 is the current documented release line at this project date.
- Node 26.x is the Current line; Node 24.x is an LTS line.
- Express 5.2.1 is currently the latest npm release.

Official references:
React:
https://react.dev/versions

Material UI:
https://mui.com/material-ui/getting-started/versions/

Next.js:
https://nextjs.org/blog

Node.js:
https://nodejs.org/en/blog/release

Express:
https://www.npmjs.com/package/express

## Version rule
Do not blindly copy old versions.
At bootstrap:
1. check official/current sources
2. install the latest stable compatible versions
3. run tests
4. save the lockfile
5. record actual installed versions

"Latest" means latest stable compatible release, not an experimental prerelease.

## Language rule
Use TypeScript/TSX.
JavaScript and JSX are still allowed for gradual migration.
No Python.