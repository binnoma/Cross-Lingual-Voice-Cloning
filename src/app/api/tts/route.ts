import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// TTS API endpoint using z-ai-web-dev-sdk
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, language, speed } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Limit text to 1024 characters (API constraint)
    const trimmedText = text.substring(0, 1024);

    // Clamp speed between 0.5 and 2.0
    const clampedSpeed = Math.min(Math.max(Number(speed) || 1.0, 0.5), 2.0);

    // Map language codes to voice names
    // Available voices: tongtong, chuichui, xiaochen, jam, kazi, douji, luodo
    const voiceMap: Record<string, string> = {
      ar: 'tongtong',
      en: 'jam',
      es: 'kazi',
      fr: 'xiaochen',
      zh: 'tongtong',
      ja: 'douji',
      ko: 'chuichui',
      de: 'luodo',
    };

    const voice = voiceMap[language] || 'tongtong';

    // Import ZAI SDK dynamically (must be backend only)
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Generate TTS audio using the correct API
    const response = await zai.audio.tts.create({
      input: trimmedText,
      voice: voice,
      speed: clampedSpeed,
      response_format: 'wav',
      stream: false,
    });

    // Get array buffer from Response object
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Save the audio to a file
    const audioDir = process.env.AUDIO_OUTPUT_DIR || './download/audio';
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const filename = `tts_${Date.now()}.wav`;
    const filepath = path.join(audioDir, filename);
    fs.writeFileSync(filepath, buffer);

    console.log(`[TTS] Generated audio: ${filename} (${buffer.length} bytes, voice: ${voice}, speed: ${clampedSpeed})`);

    return NextResponse.json({
      status: 'success',
      audioUrl: `/api/audio?file=${filename}`,
      filename,
      text: trimmedText.substring(0, 100),
      language,
    });
  } catch (error: unknown) {
    console.error('TTS Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'TTS generation failed', details: message },
      { status: 500 }
    );
  }
}
