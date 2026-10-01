# Survey Studio

Survey Studio is a SurveyMonkey-style web platform for creating, publishing and analysing surveys.

## Version 2 features

- Email/password user accounts
- Google sign-in
- Shared cloud surveys using Firebase Cloud Firestore
- Public respondent links
- Owner-only editing and response access
- Draft and published states
- 11 question types
- Required questions
- Add, duplicate, delete and reorder questions
- Conditional question logic
- Survey templates
  - Customer feedback
  - Course evaluation
  - Event feedback
  - Employee pulse
- Results dashboard
- Response counts and completion rate
- Choice percentages
- Rating and scale averages
- Open-text response review
- CSV export
- Responsive mobile layout
- Browser-only demo fallback when Firebase is not configured

## Turn on cloud mode

The app works immediately in demo mode. To make surveys and responses work across different devices, connect Firebase.

### 1. Create a Firebase project

Go to the Firebase Console and create a project. Add a **Web App** to the project.

### 2. Enable Authentication

In **Build > Authentication > Sign-in method**, enable:

- Email/Password
- Google

Add your GitHub Pages domain to **Authentication > Settings > Authorized domains** if Firebase does not add it automatically.

### 3. Create Cloud Firestore

In **Build > Firestore Database**, create a database.

### 4. Install the security rules

Open Firestore **Rules**. Replace the default rules with the contents of `firestore.rules` in this repository, then publish them.

These rules allow:

- survey owners to create, edit and delete their own surveys
- public reading of published surveys only
- public submission to published surveys
- response viewing and deletion by the survey owner only

### 5. Add the Firebase web configuration

Open **Project settings > Your apps > SDK setup and configuration** and copy the Firebase configuration object.

Edit `config.js` and replace:

```js
window.SURVEY_STUDIO_FIREBASE = null;
```

with your Firebase web configuration:

```js
window.SURVEY_STUDIO_FIREBASE = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

Firebase web configuration identifies the Firebase project. Access control is enforced by Firestore security rules.

## Run locally

Serve the repository through a local web server because authentication works best over HTTP rather than directly from a `file://` URL.

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## GitHub Pages

The repository contains a GitHub Pages workflow under `.github/workflows/pages.yml`.

In GitHub:

1. Open **Settings > Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` or manually run the Pages workflow.

The public app will then be available from the repository's GitHub Pages address.

## Data model

### Survey

```text
/surveys/{surveyId}
  id
  ownerId
  title
  description
  status
  published
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
options[]
scale
logic {
  sourceId
  value
}
```

A question with `logic` appears only when the selected source question matches the configured answer.

### Response

```text
/surveys/{surveyId}/responses/{responseId}
  surveyId
  submittedAt
  answers { questionId: value }
```

## Next production upgrades

Good next steps are email invitations, collector links, duplicate-response controls, custom themes, team workspaces, PDF reporting, response filters and a question bank.
