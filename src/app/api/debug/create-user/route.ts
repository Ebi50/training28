import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Debug endpoint to create a user document in Firestore
 * Usage: POST /api/debug/create-user
 * Body: { "userId": "xxx", "email": "xxx@example.com" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Create user document with defaults
    await adminDb.collection('users').doc(userId).set({
      email: email || 'unknown@example.com',
      stravaConnected: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'User document created',
      userId
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
