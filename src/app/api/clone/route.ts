import { NextRequest, NextResponse } from 'next/server';

// Proxy endpoint for voice cloning via FastAPI backend
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const backendUrl = process.env.VOICE_SERVICE_URL || 'http://localhost:3030';

    const response = await fetch(`${backendUrl}/api/clone`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Clone API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Voice cloning failed', details: message },
      { status: 500 }
    );
  }
}
