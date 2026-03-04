export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

// GET: Fetch current user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const users = await executeQuery('SELECT * FROM users WHERE uid = ?', [session.uid]);
    if (!users || (users as any[]).length === 0) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = (users as any[])[0] as any;
    return NextResponse.json({
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        isGuest: user.isGuest === 1 || user.isGuest === true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error: any) {
    console.error("[v0] Auth Me Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update user profile fields
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const data = await request.json();
    const now = Date.now();

    const fields: string[] = [];
    const values: any[] = [];

    if (data.displayName !== undefined) { fields.push("displayName = ?"); values.push(data.displayName); }
    if (data.phone !== undefined) { fields.push("phone = ?"); values.push(data.phone); }
    if (data.address !== undefined) { fields.push("address = ?"); values.push(data.address); }
    if (data.city !== undefined) { fields.push("city = ?"); values.push(data.city); }
    if (data.country !== undefined) { fields.push("country = ?"); values.push(data.country); }

    if (fields.length === 0) {
      return NextResponse.json({ success: true, message: "No changes" });
    }

    fields.push("updatedAt = ?");
    values.push(now);
    values.push(session.uid);

    const query = `UPDATE users SET ${fields.join(", ")} WHERE uid = ?`;
    await executeQuery(query, values);

    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (error: any) {
    console.error("[v0] Auth Update Profile Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update password
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
    }

    // Verify current password
    const users = await executeQuery('SELECT * FROM users WHERE uid = ?', [session.uid]);
    if (!users || (users as any[]).length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = (users as any[])[0] as any;
    if (user.passwordHash !== currentPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const now = Date.now();
    await executeQuery('UPDATE users SET passwordHash = ?, updatedAt = ? WHERE uid = ?', [newPassword, now, session.uid]);

    return NextResponse.json({ success: true, message: "Password updated" });
  } catch (error: any) {
    console.error("[v0] Auth Update Password Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

