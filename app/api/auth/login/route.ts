import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { encrypt } from '@/lib/session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const users = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = users[0] as any;

    // Simple plain text password check for demo purposes
    // In production, use bcrypt or argon2
    if (user.passwordHash !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await encrypt({
      uid: user.uid,
      email: user.email,
      role: user.role,
      expires
    });

    cookies().set('session', session, { expires, httpOnly: true });

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error("[v0] Auth Login Error:", error);
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}

