'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => onIdTokenChanged(getFirebaseAuth(), async user => {
    setSignedIn(!!user);
    try { setAdmin(!!user && (await user.getIdTokenResult()).claims.admin === true); }
    catch { setAdmin(false); setMessage('Could not verify your administrator access.'); }
    finally { setReady(true); }
  }), []);
  async function perform(action: () => Promise<unknown>) {
    setBusy(true); setMessage('');
    try { await action(); setPassword(''); }
    catch { setMessage('Unable to sign in. Check your credentials and enabled Firebase sign-in providers.'); }
    finally { setBusy(false); }
  }
  function login(event: FormEvent) { event.preventDefault(); void perform(() => signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)); }
  if (!ready) return <main className="p-8">Checking administrator access…</main>;
  if (admin) return <><div className="flex justify-end gap-4 border-b px-6 py-2"><span className="text-sm">Administrator</span><Button size="sm" variant="outline" onClick={() => void signOut(getFirebaseAuth())}>Sign out</Button></div>{children}</>;
  return <main className="mx-auto max-w-md space-y-5 px-6 py-16">
    <h1 className="text-2xl font-bold">English Plus Admin</h1>
    {signedIn ? <><p>Your account does not have administrator access. A Firebase project administrator must grant your account the admin role.</p><Button onClick={() => void signOut(getFirebaseAuth())}>Use another account</Button></> : <>
      <form onSubmit={login} className="space-y-4">
        <label className="block">Email<Input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="block">Password<Input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        <Button disabled={busy} type="submit" className="w-full">Sign in</Button>
      </form>
      <Button disabled={busy} variant="outline" className="w-full" onClick={() => void perform(() => signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider()))}>Continue with Google</Button>
      <Button disabled={busy || !email.trim()} variant="link" onClick={() => void perform(async () => { await sendPasswordResetEmail(getFirebaseAuth(), email.trim()); setMessage('If this account exists, a reset link has been sent.'); })}>Forgot password</Button>
    </>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </main>;
}
