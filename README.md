# Eventim Frontend Test

Welcome to the Eventim frontend test for new hires (Mid Level). The purpose of this test is to build a React UI that integrates with the backend API.

## Tech Stack

- Node 22
- React 18 + TypeScript
- Vite
- MUI (Material UI v5)
- Redux Toolkit
- Formik + Yup

All dependencies are already installed — no need to add them.

## Requirements

- NVM (to switch to the correct Node version)
- The backend API must be running on `http://localhost:3000` before you start the frontend

## Setup

1. Fork this repository into your own GitHub account
2. Clone the fork to your machine
3. Run `nvm use` to switch to the correct Node version
4. Run `yarn install` to install dependencies
5. Run `yarn dev` to start the development server

The Vite dev server proxies `/events` and `/settings` to the backend automatically, so no extra configuration is needed.
For deployed environments, copy `.env.example` to the environment-specific Vite file and set
`VITE_API_BASE_URL` to the backend origin.

## Available commands

- `yarn dev` — start the development server
- `yarn build` — type-check and create a production build
- `yarn lint` — run ESLint
- `yarn test` — run the automated test suite once
- `yarn test:watch` — run tests in watch mode

## Tasks

### 1. Events list

Consume `GET /events` from the backend and display the list of events. Each event should show its relevant information.

- Use MUI components to build the UI
- The layout should be responsive
- Use Redux to manage the events state

### 2. Settings form

Build a form that reads and updates a settings object via the backend API (`GET /settings` and `POST /settings`).

- Use MUI components to build the form
- The layout should be responsive
- Use Redux to manage the settings state
- Use Formik for the form and Yup for validation
