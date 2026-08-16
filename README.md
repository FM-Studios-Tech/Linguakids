# LinguaKids Admin Panel

A premium admin dashboard for managing kids' language learning content — worlds, levels, lessons, learning items, and quizzes. Built with Next.js (App Router), Tailwind CSS, shadcn/ui, and lucide-react.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Running Locally](#running-locally)
3. [Connecting Firebase Realtime Database](#connecting-firebase-realtime-database)
4. [Connecting Cloudflare R2 for Audio Storage](#connecting-cloudflare-r2-for-audio-storage)
5. [Deploying to Netlify](#deploying-to-netlify)
6. [Project Structure](#project-structure)

---

## Prerequisites

- **Node.js** 18.17 or newer (Node 20 recommended)
- **npm** 9+ (ships with Node)
- A **Firebase** account (free Spark plan is fine)
- A **Cloudflare** account (free R2 plan includes 10 GB storage)
- A **Netlify** account (free Starter plan is fine)
- A **GitHub** account (used by Netlify for continuous deployment)

---

## Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

### 3. Try the "Save to Firebase" button

The header has a **Save to Firebase** button. In its current state it `console.log`s the entire app state as JSON. Open your browser DevTools (F12 → Console tab) and click the button — you will see the full nested JSON object printed.

Once you complete the Firebase setup below, this button can be wired to actually write to your database.

### 4. Build & type-check (optional, before deploying)

```bash
npm run build
npm run typecheck
```

Both should pass with no errors.

---

## Connecting Firebase Realtime Database

The app stores a deeply nested JSON object (worlds → levels → lessons → learning items & quizzes). Firebase Realtime Database is a natural fit because it stores data as a JSON tree.

### Step 1 — Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and give it a name (e.g. `linguakids-admin`).
3. You can disable Google Analytics for now — not needed.

### Step 2 — Create a Realtime Database

1. In the left sidebar, go to **Build → Realtime Database**.
2. Click **Create Database**.
3. Choose a location close to your users (e.g. `us-central1`).
4. Start in **test mode** for now (we will lock this down with rules later).
   - Test mode allows read/write without auth for 30 days.
   - We will replace the rules in Step 5.

### Step 3 — Get your config and database URL

1. In the left sidebar, click the **gear icon → Project settings**.
2. Scroll down to the **Your apps** section. If no app exists, click the web icon (`</>`) to add a web app.
3. Register the app (nickname e.g. `linguakids-web`).
4. Firebase will show a config object like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "linguakids-admin.firebaseapp.com",
     databaseURL: "https://linguakids-admin-default-rtdb.firebaseio.com",
     projectId: "linguakids-admin",
     storageBucket: "linguakids-admin.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef123456",
   };
   ```

5. Copy all of these values — you will put them in your `.env` file.

### Step 4 — Add environment variables

Open the `.env` file in the project root and add these lines (replace the placeholder values with the ones from Firebase):

```env
# Firebase Realtime Database
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=linguakids-admin.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://linguakids-admin-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=linguakids-admin
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=linguakids-admin.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

> **Important:** Any variable prefixed with `NEXT_PUBLIC_` is exposed to the browser. For an admin panel behind authentication this is normal and expected — Firebase web SDK uses these public values plus your security rules to enforce access control.

### Step 5 — Install the Firebase SDK

```bash
npm install firebase
```

### Step 6 — Create a Firebase client module

Create a file at `lib/firebase.ts`:

```ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getDatabase(app);
```

### Step 7 — Wire the "Save to Firebase" button

Open `app/page.tsx` and replace the `handleSave` function body with a real write:

```ts
import { ref, set } from 'firebase/database';
import { db } from '@/lib/firebase';

async function handleSave() {
  try {
    await set(ref(db, 'appState'), app.state);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  } catch (err) {
    console.error('Failed to save to Firebase:', err);
    alert('Save failed — check the console for details.');
  }
}
```

### Step 8 — (Optional) Load initial state from Firebase

To hydrate the app from Firebase on startup instead of using mock data, you can read once on mount. In `app/page.tsx`:

```ts
import { ref, onValue } from 'firebase/database';
import { useEffect } from 'react';

// Inside your component, before the return:
useEffect(() => {
  const stateRef = ref(db, 'appState');
  const unsub = onValue(stateRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Replace initial state with Firebase data
      // You would need to add a "replaceState" action to your reducer
      console.log('Loaded state from Firebase', data);
    }
  });
  return () => unsub();
}, []);
```

### Step 9 — Lock down with security rules

Go back to the Firebase Console → **Realtime Database → Rules** and replace the test rules with something safer. For a simple admin-only setup:

```json
{
  "rules": {
    "appState": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

This requires a signed-in user. To add email/password auth, see the [Firebase Auth docs](https://firebase.google.com/docs/auth/web/password-auth). For a fully public prototype you can set `.read` and `.write` to `true`, but **never do this in production**.

---

## Connecting Cloudflare R2 for Audio Storage

The learning items and quizzes reference audio URLs (e.g. letter pronunciation, word pronunciation). Currently the upload buttons generate mock Cloudflare URLs. To store real audio files, use Cloudflare R2 (S3-compatible object storage).

### Step 1 — Create an R2 bucket

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left sidebar, click **R2 Object Storage** (you may need to enable it — the free plan includes 10 GB).
3. Click **Create bucket**.
4. Name it e.g. `linguakids-audio`.
5. Choose a location hint (e.g. `APAC`, `EEU`, `NA` — pick the region closest to your users).

### Step 2 — Enable public access (for read URLs)

1. Open the bucket → **Settings** tab.
2. Under **Public access**, enable **Allow Access**.
3. Note the public URL, e.g. `https://pub-abc123def456.r2.dev`.
   - This is your **R2 public base URL**. Audio files will be accessible at `<this-url>/<filename>`.

> For production you should put a custom domain in front of R2 via Cloudflare's CDN. See the [R2 custom domain docs](https://developers.cloudflare.com/r2/buckets/object-ownership/#develop). For prototyping the public dev URL is fine.

### Step 3 — Create an API token for uploads

1. In the Cloudflare Dashboard, click the profile icon (top-right) → **My Profile → API Tokens**.
2. Click **Create Token**.
3. Use the **Create Custom Token** option with these permissions:
   - **Account → Workers R2 Storage → Edit**
4. Under **Account Resources**, include your account.
5. Click **Continue to summary → Create Token**.
6. Copy the token value — you will only see it once.

### Step 4 — Get your account ID

1. In the Cloudflare Dashboard, look at the right sidebar of any page — **Account ID** is listed there.
2. Copy it.

### Step 5 — Add environment variables

Add these to your `.env` file (these are **server-side only** — do NOT prefix with `NEXT_PUBLIC_`):

```env
# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=linguakids-audio
R2_PUBLIC_BASE_URL=https://pub-abc123def456.r2.dev
```

> If you created the token via the API Tokens page, you got a token value. For S3-compatible API access you need **Access Key ID** and **Secret Access Key** instead. To get those: go to **R2 → Manage R2 API Tokens → Create API Token**, select **Object Read & Write**, and check **Use S3 API credentials**. Cloudflare will show you an Access Key ID and Secret.

### Step 6 — Install the S3 SDK

```bash
npm install @aws-sdk/client-s3
```

Cloudflare R2 is S3-compatible, so the AWS SDK works with custom endpoints.

### Step 7 — Create an upload helper

Create a file at `lib/r2-upload.ts`:

```ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadAudio(file: File, key: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'audio/mpeg',
    })
  );
  return `${process.env.R2_PUBLIC_BASE_URL}/${key}`;
}
```

### Step 8 — Create an upload API route

Since the R2 credentials are server-side, uploads must go through a server route. Create a file at `app/api/upload/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadAudio } from '@/lib/r2-upload';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  const key = `audio/${Date.now()}-${file.name}`;
  try {
    const url = await uploadAudio(file, key);
    return NextResponse.json({ url });
  } catch (err) {
    console.error('Upload failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

### Step 9 — Replace the mock upload buttons

In `components/tabs/learning-item-card.tsx` and `components/tabs/quiz-card.tsx`, replace the `mockUploadUrl(...)` calls with real uploads. Example pattern:

```ts
async function realUpload(file: File, label: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}
```

To let the user pick a file, use a hidden `<input type="file" accept="audio/*">` and trigger it on button click.

> **Note:** The current admin panel uses mock URLs for a reason — it lets you build and test the full UI without setting up R2 first. Only do this step when you are ready to handle real audio files.

---

## Deploying to Netlify

This project is already configured for Netlify via `netlify.toml`:

```toml
[build]
  command = "npx next build"
  publish = ".next"

  [[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Option A — Deploy via the Netlify UI (recommended for first deploy)

1. Push your project to a **GitHub** repository.
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git branch -M main
   git push -u origin main
   ```
   (If you do not have a GitHub repo yet, create one at [github.com/new](https://github.com/new).)

2. Go to [app.netlify.com](https://app.netlify.com/) and log in.

3. Click **Add new site → Import an existing project**.

4. Connect to GitHub and select your repository.

5. Netlify will auto-detect Next.js. Verify the settings:
   - **Build command:** `npx next build`
   - **Publish directory:** `.next`
   - The `@netlify/plugin-nextjs` plugin is listed automatically.

6. Click **Show advanced → Add environment variable** and add every variable from your `.env` file:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_PUBLIC_BASE_URL`

7. Click **Deploy site**. The first build takes 1–3 minutes.

8. Once deployed, Netlify gives you a URL like `https://linguakids-admin.netlify.app`. You can set a custom domain under **Domain settings**.

### Option B — Deploy via the Netlify CLI

1. Install the CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Log in:
   ```bash
   netlify login
   ```

3. Initialize the site (run once):
   ```bash
   netlify init
   ```
   Follow the prompts to create or link a site.

4. Set environment variables:
   ```bash
   netlify env:set NEXT_PUBLIC_FIREBASE_API_KEY "AIzaSy..."
   netlify env:set NEXT_PUBLIC_FIREBASE_DATABASE_URL "https://..."
   # ...repeat for every variable
   ```

5. Deploy:
   ```bash
   # Preview deploy (creates a draft URL)
   netlify deploy

   # Production deploy
   netlify deploy --prod
   ```

### Continuous deployment

Once linked to GitHub, every `git push` to `main` automatically triggers a Netlify build and deploy. You can see build logs in the Netlify dashboard under **Deploys**.

### Troubleshooting Netlify builds

- **Build fails with "Module not found":** Run `npm install` locally, commit `package-lock.json`, and push.
- **Environment variables missing on the live site:** Verify them in the Netlify dashboard under **Site settings → Environment variables**. Redeploy after adding.
- **Firebase permission denied on the live site:** Check that your Firebase Realtime Database rules allow access and that your `databaseURL` env var is correct.
- **404 on client-side routes:** Make sure `@netlify/plugin-nextjs` is in `netlify.toml` (it already is in this project).

---

## Project Structure

```
project/
├── app/
│   ├── globals.css          # Theme tokens (colors, radius, spacing)
│   ├── layout.tsx           # Root layout + font
│   └── page.tsx             # Main admin page (header + tabs)
├── components/
│   ├── tabs/
│   │   ├── worlds-tab.tsx          # Tab 1: Worlds CRUD
│   │   ├── levels-tab.tsx         # Tab 2: Levels CRUD (world-scoped)
│   │   ├── lessons-tab.tsx        # Tab 3: Lessons CRUD (world+level scoped)
│   │   ├── lesson-editor-tab.tsx  # Tab 4: Lesson content editor
│   │   ├── learning-item-card.tsx # Learning item form card
│   │   └── quiz-card.tsx          # Quiz form card (conditional UI by type)
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── types.ts             # TypeScript interfaces for the data model
│   ├── mock-data.ts         # Initial nested JSON state
│   ├── use-app-state.ts     # useReducer hook with all CRUD actions
│   └── utils.ts             # cn() helper
├── netlify.toml             # Netlify build config
├── next.config.js
├── tailwind.config.ts
└── package.json
```

### Data model

```
worlds
  └── world_001
        ├── title, order
        └── levels
              └── level_001
                    ├── title, order
                    └── lessons
                          └── lesson_001
                                ├── title, order
                                └── data
                                      ├── learningItems
                                      │     └── item_001 (letter, words, audio URLs)
                                      └── quizzes
                                            └── quiz_001 (type, question, options/answer)
```

All state is managed by a single `useReducer` in `lib/use-app-state.ts`. Every create, update, or delete dispatches an action that immutably updates the nested tree, so the UI reflects changes instantly without a page reload.
