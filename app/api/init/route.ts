export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Categories Table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        imageUrl TEXT,
        productCount INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        createdAt INTEGER,
        updatedAt INTEGER
      );
    `)

    // Products Table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        tags TEXT,
        imageUrl TEXT,
        downloadUrl TEXT,
        isActive INTEGER DEFAULT 1,
        salesCount INTEGER DEFAULT 0,
        pageCode TEXT,
        createdBy TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
      );
    `)

    // Orders Table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        items TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        paymentId TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
      );
    `)

    // Users Table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        passwordHash TEXT,
        displayName TEXT,
        role TEXT DEFAULT 'user',
        createdAt INTEGER,
        phone TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        updatedAt INTEGER
      );
    `)

    return NextResponse.json({ success: true, message: "Database initialized successfully" })
  } catch (error: any) {
    console.error("[v0] Init API Error:", error);
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 })
  }
}

