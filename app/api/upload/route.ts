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