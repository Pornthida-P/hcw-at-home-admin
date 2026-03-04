# HCW@Home — Admin Frontend

This folder contains the **HCW@Home admin** frontend source code (Angular). The app is built and served by a web server such as Nginx in production. Build output goes to the `dist/` folder.

## Prerequisites

- Node.js

## How to run

```bash
npm install
npm start
```

Then open **http://localhost:4200/**. The app will reload when you change source files.

## Build

```bash
npm run build
```

Use the `--prod` flag for a production build if needed. Artifacts are in `dist/`.

## Code scaffolding

- New component: `ng generate component component-name`
- Other: `ng generate directive|pipe|service|class|guard|interface|enum|module`

## Tests

- **Unit tests:** `npm test` (Karma)
- **E2E tests:** `npm run e2e` (Protractor)

## Deploy

See: **https://docs.hcw-at-home.com/deploy/**

## Angular CLI

For more commands: `ng help` or [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
