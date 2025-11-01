import { NextRequest, NextResponse } from 'next/server';
import { generateZWOFromSession, generateZWOFilename } from '@/lib/zwoGenerator';
import type { TrainingSession } from '@/types';

/**
 * API Route: Export Training Session as ZWO
 * 
 * POST /api/training/export-zwo
 * Body: { session: TrainingSession, ftp: number, platform?: 'zwift' | 'mywoosh' }
 * 
 * Returns .ZWO file for download
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session, ftp, platform = 'zwift' } = body;

    if (!session || !ftp) {
      return NextResponse.json(
        { error: 'Missing session data or FTP' },
        { status: 400 }
      );
    }

    // Generate ZWO XML
    const zwoXML = generateZWOFromSession(session as TrainingSession, ftp);
    const filename = generateZWOFilename(session as TrainingSession);

    // Return file for download
    return new NextResponse(zwoXML, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating ZWO:', error);
    return NextResponse.json(
      { error: 'Failed to generate ZWO file' },
      { status: 500 }
    );
  }
}
