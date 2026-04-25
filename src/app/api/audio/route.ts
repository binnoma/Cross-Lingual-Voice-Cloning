import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Serve generated audio files
export async function GET(request: NextRequest) {
  try {
    const filename = request.nextUrl.searchParams.get('file');

    if (!filename) {
      return NextResponse.json({ error: 'File parameter is required' }, { status: 400 });
    }

    // Security: prevent directory traversal
    const safeName = path.basename(filename);
    const filepath = path.join(process.env.AUDIO_OUTPUT_DIR || './download/audio', safeName);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const buffer = fs.readFileSync(filepath);

    // Determine content type
    const ext = path.extname(safeName).toLowerCase();
    const contentType = ext === '.mp3' ? 'audio/mpeg' : ext === '.wav' ? 'audio/wav' : 'audio/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    console.error('Audio serve error:', error);
    return NextResponse.json({ error: 'Failed to serve audio' }, { status: 500 });
  }
}
