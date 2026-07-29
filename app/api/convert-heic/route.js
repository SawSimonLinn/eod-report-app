import { NextResponse } from 'next/server';
import convert from 'heic-convert';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File is too large. Please upload an image under 8MB.' }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await convert({ buffer: inputBuffer, format: 'JPEG', quality: 0.85 });
    const dataUrl = `data:image/jpeg;base64,${Buffer.from(outputBuffer).toString('base64')}`;
    return NextResponse.json({ dataUrl });
  } catch (err) {
    console.error('HEIC conversion error:', err);
    return NextResponse.json({ error: 'Could not convert that HEIC photo. Please try a JPG/PNG instead.' }, { status: 500 });
  }
}
