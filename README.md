# Survey Studio

A lightweight SurveyMonkey-style survey builder built as a responsive web app.

## Included in this version

- Survey dashboard
- Create, duplicate, edit and delete surveys
- Draft and published states
- 11 question types:
  - Short text
  - Long text
  - Multiple choice
  - Checkboxes
  - Dropdown
  - Rating 1–5
  - Linear scale
  - Yes / No
  - Email
  - Number
  - Date
- Required questions
- Add, delete, duplicate and reorder questions
- Live respondent view
- Shareable survey URL
- Response submission
- Results dashboard
- Bar summaries for structured questions
- Open-text response review
- CSV response export
- Responsive mobile layout

## Current storage model

This MVP uses browser `localStorage`. It is excellent for prototyping and demonstrations, but each browser has its own data.

For a real public survey service, connect a shared database and authentication layer so responses from different devices flow into the survey owner's dashboard. Supabase, Firebase, PostgreSQL behind an API, or another hosted backend can be used.

## Run locally

Open `index.html` in a browser or serve the repository with any static web server.

Example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## GitHub Pages

A Pages workflow is included under `.github/workflows/pages.yml`. After Pages is enabled for GitHub Actions in the repository settings, pushes to `main` deploy the app.

## Recommended production phase

1. Add user registration and sign-in.
2. Add a hosted database for surveys and responses.
3. Add row-level access controls so each owner sees only their data.
4. Add anonymous public submission endpoints.
5. Add skip logic / branching.
6. Add themes and branding.
7. Add reusable templates.
8. Add email invitations and collector management.
9. Add richer analytics and PDF reports.
10. Add team workspaces and roles.

## Data model

### Survey

```text
id
title
description
status
createdAt
updatedAt
theme
questions[]
```

### Question

```text
id
type
title
required
options[] (when relevant)
scale (when relevant)
```

### Response

```text
id
surveyId
submittedAt
answers { questionId: value }
```
