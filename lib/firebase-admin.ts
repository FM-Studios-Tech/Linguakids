import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Verifying Firebase-signed ID tokens uses public certificates; no service-account
// key is shipped to the browser or Unity. Admin access is a signed custom claim.
export async function isFirebaseAdministrator(header: string | null): Promise<boolean> {
  if (!header?.startsWith('Bearer ')) return false;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return false;
  const app = getApps().find(app => app.name === 'admin-token-verifier') || initializeApp({ projectId }, 'admin-token-verifier');
  try { return (await getAuth(app).verifyIdToken(header.slice(7))).admin === true; }
  catch { return false; }
}
