import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/r2-upload';

const MAX_AUDIO_SIZE = 20 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function safeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload request' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  const isAudio = file.type.startsWith('audio/');
  const isImage = file.type.startsWith('image/');

  if (!isAudio && !isImage) {
    return NextResponse.json(
      { error: 'Only audio and image files are supported' },
      { status: 415 }
    );
  }

  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File must be smaller than ${maxSize / 1024 / 1024} MB` },
      { status: 413 }
    );
  }

  const folder = isImage ? 'images' : 'audio';
  const key = `${folder}/${Date.now()}-${safeFileName(file.name)}`;
  try {
    const url = await uploadFile(file, key);
    return NextResponse.json({ url });
  } catch (err) {
    console.error('Upload failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
