# Figma Make version

This folder holds Figma Make's build of the same "AI = Buffalo" brief, hosted for comparison with Claude's version in the repo root.

* **Live:** https://willardwonder.github.io/AI-Buffalo/figma/
* **Claude's version:** https://willardwonder.github.io/AI-Buffalo/

## What's here

* `source/` is the Figma Make project exactly as exported (`src/App.tsx`, `src/index.css`, `src/main.tsx`, `vite.config.ts`, `package.json`, `tsconfig.json`, `index.html`, `AGENTS.md`, `CLAUDE.md`, `public/favicon.svg`).
* `index.html`, `assets/`, and `favicon.svg` are the production build of `source/`, served by GitHub Pages.

The one file added to the source is `source/.figma/make/site.json`. Figma's `vite.config.ts` imports it, but it wasn't in the export. It sets the page title and favicon and adds the "Compare with Claude's" link through Figma's own `customScripts` setting, so the generated app code is untouched.

## Rebuilding

```bash
cd figma/source
npm install
FIGMA_PUBLIC_URL=/AI-Buffalo/figma npx vite build
cp -r dist/* ..
```
