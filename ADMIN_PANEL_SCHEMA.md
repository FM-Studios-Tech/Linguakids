# Admin panel schema and data workflow

This document describes the current admin panel source code. It is not an export of the live database or confirmation of deployed Firebase rules. Examples use illustrative content and media URLs.

## 1. Storage overview

| System | What it stores |
| --- | --- |
| Firebase Realtime Database | Worlds, levels, lessons, learning cells, quiz questions, answers, and media URL references under `/appState`. |
| Firebase Authentication | Administrator accounts, identity providers, password credentials managed by Firebase, and custom claims. |
| Cloudflare R2 | Uploaded image and audio file bytes. |
| Browser memory | Unsaved edits, selections, import previews, upload status, and other temporary interface state. |

The admin panel has four content tabs: Worlds, Levels, Lessons, and Lesson Editor. There is no separate administrator-managed collection for avatars, player accounts, player progress, purchases, or leaderboards in these tabs.

## 2. Database tree

```text
/appState
  /worlds
    /{worldId}
      title
      order
      buttonImageUrl
      backgroundImageUrl
      /levels
        /{levelId}
          title
          order
          /lessons
            /{lessonId}
              title
              order
              /data
                /learningItems
                  name
                  description
                  /gridSize
                    rows
                    columns
                  /items
                    /{itemId}
                      /cells
                        /{cellId}
                          row
                          column
                          language
                          text
                          audioUrl
                /quizzes
                  /{quizId}
                    type
                    order                     (optional)
                    questionText              (type-dependent)
                    questionAudioUrl          (type-dependent)
                    correctOptionId           (type-dependent)
                    correctAnswerText         (type-dependent)
                    correctAnswerBoolean      (type-dependent)
                    englishPromptText         (type-dependent)
                    arabicPromptText          (optional compatibility field)
                    /options                  (multiple choice only)
                      /{optionId}
                        text
```

Collections are objects keyed by IDs, not arrays. IDs live in the paths; objects do not repeat their own IDs as fields. The Firebase console may omit empty collections because Realtime Database does not retain empty objects.

## 3. IDs and ordering

| Entity | Current generated ID example | ID scope |
| --- | --- | --- |
| World | `world_001` | Within `appState.worlds` |
| Level | `level_001` | Within a world's `levels` |
| Lesson | `lesson_001` | Within a level's `lessons` |
| Learning item | `item_001` | Within a lesson's learning items |
| Cell | `cell_1_1` | Within an item's cells; encodes row and column |
| Quiz | `quiz_001` | Within a lesson's quizzes |
| Option | `option_001` | Within a quiz's options |

World, lesson, item, quiz, and option IDs use the highest existing numeric suffix in their scope plus one, with at least three digits. Level IDs instead follow their positive whole-number display order: order 10 uses `level_010` and title `"10"`. The title is filled automatically. Deleted level numbers can be reused. Existing conflicting IDs or orders are rejected. Editing a level order moves the record to the matching ID and preserves its lessons; other existing records are not automatically renumbered. Existing legacy IDs can still be present until explicitly edited. Changing a level ID does not migrate player-progress records maintained by a separate game application.

Worlds, levels, and lessons have numeric `order` values; the panel sorts these ascending. Quiz `order` is optional. The Lesson Editor groups quizzes by type and sorts within each type using `order`, defaulting to zero. Do not assume every consumer uses a single global quiz ordering: the supplied old Unity script uses its own type priority and ID sorting.

## 4. Field reference

### Root and worlds

| Path or field | Type | Meaning |
| --- | --- | --- |
| `/appState` | object | Entire content state saved by the panel. |
| `worlds` | ID-keyed object of World | All worlds. |
| World.`title` | string | World name; create/edit dialog requires nonblank text. |
| World.`order` | number | Display ordering. |
| World.`buttonImageUrl` | string | World selection button image URL; can be empty. |
| World.`backgroundImageUrl` | string | World background image URL; can be empty. |
| World.`levels` | ID-keyed object of Level | Levels belonging to this world. |

### Levels and lessons

| Field | Type | Meaning |
| --- | --- | --- |
| Level.`title` | string | Numeric display title, automatically set to the display order as text. |
| Level.`order` | number | Positive whole number; determines the title and `level_NNN` ID within the world. |
| Level.`lessons` | ID-keyed object of Lesson | Lessons belonging to this level. |
| Lesson.`title` | string | Lesson name; create/edit dialog requires nonblank text. |
| Lesson.`order` | number | Display ordering within the level. |
| Lesson.`data` | object | Contains `learningItems` and `quizzes`. |

Level and lesson records do not currently have their own image fields. Deleting a parent removes its nested descendants from the draft; saving persists that removal. It does not automatically delete referenced R2 files.

### Learning content

| Field | Type | Meaning |
| --- | --- | --- |
| `learningItems.name` | string | Learning screen heading. |
| `learningItems.description` | string | Learning screen descriptive text. |
| `learningItems.gridSize.rows` | number | Shared grid height for learning items; configured range 1–4. |
| `learningItems.gridSize.columns` | number | Shared grid width; configured range 1–2. |
| `learningItems.items` | ID-keyed object | Ordered learning content entries, each containing cells. |
| Item.`cells` | ID-keyed object of Cell | Individual text/audio cells. |
| Cell.`row` | number | One-based position within the shared grid. |
| Cell.`column` | number | One-based position within the shared grid. |
| Cell.`language` | `"english"` or `"arabic"` | Cell language. |
| Cell.`text` | string | Displayed letter, word, sentence, or translation. |
| Cell.`audioUrl` | string | Audio file URL; empty means no assigned audio. |

A newly created lesson initially has an unconfigured `{ "rows": 0, "columns": 0 }` grid and empty content. Configure a valid grid before adding/importing learning cells. Cell coordinates must fit within it. The panel model supports the grid; individual Unity consumers must also support its dimensions.

### Quiz fields

| Field | Type | Meaning |
| --- | --- | --- |
| `type` | string enum | One of the six exact values below. |
| `order` | number, optional | Quiz position within its type in the editor. |
| `questionText` | string, optional | Text question, including Arabic or English. |
| `questionAudioUrl` | string, optional | Listening question audio URL. |
| `correctOptionId` | string, optional | Key of the correct entry in this quiz's `options`. |
| `correctAnswerText` | string, optional | Expected typed answer. |
| `correctAnswerBoolean` | boolean, optional | Correct True/False answer; use JSON `true` or `false`, not strings. |
| `options` | ID-keyed object, optional | Each option has a string `text` field. |
| `englishPromptText` | string, optional | Current editable/display prompt for the recording quiz. |
| `arabicPromptText` | string, optional | Retained in the data model; currently not exposed as an active input in the recording quiz editor. |

### Fields used by each quiz type

| Exact `type` | Fields used for a configured quiz |
| --- | --- |
| `text_multiple_choice` | `questionText`, `options`, `correctOptionId` |
| `audio_multiple_choice` | `questionAudioUrl`, `options`, `correctOptionId` |
| `audio_typing` | `questionAudioUrl`, `correctAnswerText` |
| `text_typing` | `questionText`, `correctAnswerText` |
| `true_false` | `questionText`, `correctAnswerBoolean` |
| `arabic_voice_record` | `englishPromptText`; optional legacy `arabicPromptText` |

Text Typing is intended to accept an English answer to an Arabic or English prompt. The updated old Unity script compares typed text without case sensitivity and trims surrounding spaces. This is client behavior, not a database constraint.

Preserve `correctAnswerBoolean: false`: it is a valid answer, not missing data. Nullable `bool?` in the supplied Unity model distinguishes missing answers from false answers.

The recording quiz currently has no configured pronunciation service, reference-audio upload control, pass threshold, or persisted student recording field. Speech scoring and bulk audio upload were discussed but have not been implemented. Do not add assumed `scoreThreshold`, `referenceAudioUrl`, or `recordedAudioUrl` fields to content expecting the current code to use them.

## 5. Complete example with all six quiz types

This is an example database-root object. The admin's in-memory AppState is the inner `appState` object, which is written to `/appState`.

```json
{
  "appState": {
    "worlds": {
      "world_001": {
        "title": "World 1",
        "order": 0,
        "buttonImageUrl": "https://media.example.com/images/world-button.png",
        "backgroundImageUrl": "https://media.example.com/images/world-background.png",
        "levels": {
          "level_001": {
            "title": "Level 1",
            "order": 0,
            "lessons": {
              "lesson_001": {
                "title": "Fruits",
                "order": 0,
                "data": {
                  "learningItems": {
                    "name": "Learn fruit names",
                    "description": "Listen and learn the words.",
                    "gridSize": { "rows": 2, "columns": 1 },
                    "items": {
                      "item_001": {
                        "cells": {
                          "cell_1_1": {
                            "row": 1,
                            "column": 1,
                            "language": "english",
                            "text": "Apple",
                            "audioUrl": "https://media.example.com/audio/apple-en.mp3"
                          },
                          "cell_2_1": {
                            "row": 2,
                            "column": 1,
                            "language": "arabic",
                            "text": "تفاحة",
                            "audioUrl": "https://media.example.com/audio/apple-ar.mp3"
                          }
                        }
                      }
                    }
                  },
                  "quizzes": {
                    "quiz_001": {
                      "type": "text_multiple_choice",
                      "order": 0,
                      "questionText": "What does تفاحة mean?",
                      "correctOptionId": "option_001",
                      "options": {
                        "option_001": { "text": "Apple" },
                        "option_002": { "text": "Banana" }
                      }
                    },
                    "quiz_002": {
                      "type": "audio_multiple_choice",
                      "order": 0,
                      "questionAudioUrl": "https://media.example.com/audio/apple-en.mp3",
                      "correctOptionId": "option_001",
                      "options": {
                        "option_001": { "text": "Apple" },
                        "option_002": { "text": "Orange" }
                      }
                    },
                    "quiz_003": {
                      "type": "audio_typing",
                      "order": 0,
                      "questionAudioUrl": "https://media.example.com/audio/apple-en.mp3",
                      "correctAnswerText": "apple"
                    },
                    "quiz_004": {
                      "type": "text_typing",
                      "order": 0,
                      "questionText": "اكتب كلمة تفاحة بالإنجليزية",
                      "correctAnswerText": "apple"
                    },
                    "quiz_005": {
                      "type": "true_false",
                      "order": 0,
                      "questionText": "Apple means موزة.",
                      "correctAnswerBoolean": false
                    },
                    "quiz_006": {
                      "type": "arabic_voice_record",
                      "order": 0,
                      "englishPromptText": "Say apple in Arabic.",
                      "arabicPromptText": "تفاحة"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## 6. Editing and saving

1. The panel subscribes to `/appState` using a Firebase realtime listener.
2. Creating, updating, deleting, reordering, and applying an Excel preview modify the browser's draft state.
3. The global **Save to Firebase** button removes undefined properties and calls `set()` on `/appState` with the entire draft.
4. This replaces the content subtree; it is not a per-field merge and does not write to unrelated root paths.

Dialog buttons such as Create Lesson and Save Changes apply changes to the draft. They are distinct from the global Firebase save. Drafts are not a separately persisted database collection. Remote listener updates can also replace the current draft; there is no documented version conflict system or durable revision history.

## 7. Single-sheet lesson Excel schema

Use **Lessons → Import Excel** beside an existing lesson. Worlds, levels, and lesson records are created manually first.

Sample: `public/templates/lesson-content-sample.xlsx`.
AI content-planning instructions: `public/templates/lesson-content-chatgpt-prompt.md`.

The workbook must contain exactly one sheet with these headers. Headers must be present and must not be duplicated; the parser locates them by name.

| Column | Usage |
| --- | --- |
| `Content Type` | `Learning Name`, `Learning Description`, `Grid Size`, `Learning Cell`, or `Quiz` (values matched without case sensitivity). |
| `Sequence` | Whole number 1–999999 for Learning Cell and Quiz rows. |
| `Row` | Grid row count for Grid Size; one-based cell row for Learning Cell. |
| `Column` | Grid column count for Grid Size; one-based cell column for Learning Cell. |
| `Language` | English or Arabic for Learning Cell rows. |
| `Text / Question` | Learning name/description, cell text, text quiz question, or recording prompt. |
| `Quiz Type` | Exact quiz type identifier from the six-type table. |
| `Correct Answer` | Correct choice text, typed answer, or True/False. |
| `Wrong Answer 1` | Optional multiple-choice distractor. |
| `Wrong Answer 2` | Optional multiple-choice distractor. |
| `Wrong Answer 3` | Optional multiple-choice distractor. |

Import behavior:

- Learning Cell sequence 1 maps to `item_001`; its coordinates map to `cell_{row}_{column}`.
- Quiz sequence 1 maps to `quiz_001`, with `order: 0`; sequence N maps to `order: N - 1`.
- Correct multiple-choice answer becomes `option_001`; nonempty distractors receive subsequent option IDs.
- True/False strings in Excel become actual JSON booleans.
- Recording quiz `Text / Question` maps to `englishPromptText`.
- Grid rows must be 1–4 and columns 1–2. Existing retained cells must also fit the new grid.
- Duplicate metadata, duplicate quiz sequences, and duplicate item/cell coordinates are rejected.
- Metadata rows are resolved before content rows, regardless of their location in the sheet.
- Existing data not addressed by workbook rows is retained. An addressed quiz is reconstructed for its imported type; do not assume all of its previous fields survive.
- Existing cell audio is retained when updating that same cell. Existing question audio is retained for imported audio quiz types at the same quiz ID.
- An empty Learning Cell text intentionally removes that addressed cell; it is not a blank word.
- There is no audio-upload or audio-URL column in this template. Missing question audio generates a warning for relevant quiz types; add it in the editor.
- Import produces a preview, then applies locally. Review and explicitly Save to Firebase.

The codebase also contains older multi-sheet import utilities in `lib/excel-import.ts`. They support legacy workbook layouts; they are not the active lesson-scoped workflow and are not an additional database schema. The current UI does not offer an overall import button.

## 8. Media upload schema

Endpoint: `POST /api/upload`.

```text
Authorization: Bearer <Firebase ID token with admin: true>
Content-Type: multipart/form-data (browser-generated boundary)
Form field: file = one audio or image file
```

| Media | Accepted MIME family | Application size limit | R2 object key |
| --- | --- | --- | --- |
| Audio | `audio/*` | 20 MiB | `audio/{timestamp}-{sanitized-original-name}` |
| Image | `image/*` | 10 MiB | `images/{timestamp}-{sanitized-original-name}` |

The application rejects sizes greater than these limits. Hosting request-size limits may be smaller. The upload route chooses the folder using the MIME type; it replaces filename characters outside letters, digits, dots, underscores, and hyphens with hyphens.

Success response:

```json
{ "url": "https://media.example.com/audio/1700000000000-apple.mp3" }
```

Errors return `{ "error": "message" }`, including 403 for missing admin access, 400 for invalid/missing upload data, 415 for unsupported media, 413 for oversized files, and 500 for storage failure.

An upload stores the file immediately in R2 and updates a URL in the browser draft. Saving the lesson reference still requires Save to Firebase. Removing a URL or deleting content does not call an R2 deletion endpoint. There is no bulk-upload endpoint, asset catalog, upload manifest, or automatic filename-to-lesson mapping in the current implementation.

## 9. Administrator authentication and access

Accounts are stored in Firebase Authentication, outside `/appState`. The panel supports email/password sign-in, a Google sign-in button when that provider is configured, password-reset email, and sign-out. It does not provide an admin signup or user-management tab.

An administrator needs the custom claim:

```json
{ "admin": true }
```

This claim belongs to the Auth user/token; it is not a database field such as `/admins/{uid}`. Assign it with Firebase Admin SDK in a trusted environment, preserving any other claims. Sign out and back in after assignment so the browser obtains the updated token.

The page gate checks the ID token claim. The upload endpoint independently verifies the signed Firebase ID token and requires `admin === true`. Database writes additionally depend on the deployed Realtime Database security rules.

The repository's rules file specifies public content reads and administrator-only writes for `/appState`:

```json
"appState": {
  ".read": true,
  ".write": "auth != null && auth.token.admin === true"
}
```

This is a description of the repository configuration, not proof that these rules are live. Database field tables in this document describe application types and importer checks; the current rules do not enforce a complete field-by-field content schema. Publicly readable content includes the correct answers.

## 10. Configuration fields (not content database records)

| Environment variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app configuration. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain. |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Realtime Database endpoint. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project identifier; also used by the server token verifier. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase web configuration field; this upload implementation uses R2. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase web configuration field. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app identifier. |
| `R2_ACCOUNT_ID` | Server-side R2 account identifier. |
| `R2_ACCESS_KEY_ID` | Server-side R2 access credential. |
| `R2_SECRET_ACCESS_KEY` | Server-side R2 secret credential. |
| `R2_BUCKET_NAME` | Server-side destination bucket. |
| `R2_PUBLIC_BASE_URL` | Public prefix used to construct returned file URLs. |

Firebase authorized website domains are Authentication console settings. Service-account private keys are trusted-environment credentials used for tasks such as assigning claims; they are not content fields and must not be placed in frontend files or committed to the repository. No credential values are included in this document.

## 11. Related game backend paths outside the admin panel

The separate game backend source references these Realtime Database roots. The current admin panel does not edit them, and their presence in source does not confirm deployment or live data:

| Root | Backend purpose |
| --- | --- |
| `/gamePlayers/{uid}` | Player profiles and game state. |
| `/gameUsernames/{normalizedUsername}` | Private username-to-UID lookup. |
| `/gameLeaderboard/{uid}` | Global leaderboard entries. |
| `/gameWeeklyLeaderboard/{weekKey}/{uid}` | Weekly leaderboard entries. |
| `/gameFriends/{uid}` | Player friend relationships. |
| `/gameGoogleSessions/{sessionId}` | Backend Google session handoff state. |
| `/gameRateLimits/...` | Backend request throttling state. |

These are separate from the complete admin content schema above. No game profile, auth, leaderboard, or Unity behavior was changed to create this document.

## 12. Source references

- `lib/types.ts`: canonical admin content interfaces and quiz type enum.
- `lib/use-app-state.ts`: IDs, draft changes, and compatibility normalization of older data.
- `app/page.tsx`: Firebase listener and full `/appState` save.
- `components/tabs/worlds-tab.tsx`, `levels-tab.tsx`, `lessons-tab.tsx`: parent entity editing.
- `components/tabs/lesson-editor-tab.tsx`, `learning-item-card.tsx`, `learning-grid-cell.tsx`, `quiz-card.tsx`: learning/quiz editing.
- `lib/lesson-excel-import.ts`, `components/tabs/lesson-content-import.tsx`: active single-sheet parsing and review.
- `components/admin-auth-gate.tsx`, `lib/firebase-admin.ts`: administrator access checks.
- `app/api/upload/route.ts`, `lib/r2-upload.ts`: media upload contract and R2 storage.
- `firebase-game/database.rules.json`: repository database access rules.
