export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { encrypt } from '@/lib/session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const existingUsers = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const uid = crypto.randomUUID();
    const now = Date.now();

    // Check if this is the admin email
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@example.com";
    const role = email.toLowerCase() === adminEmail.toLowerCase() ? 'admin' : 'user';

    await executeQuery(`
      INSERT INTO users (uid, email, passwordHash, displayName, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [uid, email, password, displayName || email.split('@')[0], role, now, now]);

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await encrypt({
      uid,
      email,
      role,
      expires
    });

    cookies().set('session', session, { expires, httpOnly: true });

    return NextResponse.json({
      success: true,
      user: {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        role
      }
    });
  } catch (error: any) {
    console.error("[v0] Auth Register Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

