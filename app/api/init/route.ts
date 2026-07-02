export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function safeAddColumn(table: string, column: string, type: string) {
    try {
        await executeQuery(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
        console.log(`[Init DB] Successfully added column ${column} to table ${table}`)
    } catch (e: any) {
        // SQLite throws an error if the column already exists (e.g. duplicate column name)
        console.log(`[Init DB] Column ${column} in ${table} checked: ${e.message}`)
    }
}

export async function runMigrations() {
    // 1. Categories Table
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

    // 2. Products Table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        originalPrice REAL,
        category TEXT NOT NULL,
        tags TEXT,
        imageUrl TEXT,
        downloadUrl TEXT,
        isActive INTEGER DEFAULT 1,
        salesCount INTEGER DEFAULT 0,
        pageCode TEXT,
        pageType TEXT DEFAULT 'shop',
        createdBy TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
      );
    `)

    // 3. Orders Table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        userEmail TEXT,
        userName TEXT,
        userPhone TEXT,
        items TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        paymentId TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
      );
    `)

    // 4. Users Table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        passwordHash TEXT,
        displayName TEXT,
        role TEXT DEFAULT 'user',
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        isGuest INTEGER DEFAULT 0,
        createdAt INTEGER,
        updatedAt INTEGER
      );
    `)

    // 5. Reviews Table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        userId TEXT,
        userName TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        createdAt INTEGER,
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
      );
    `)

    // Dynamic Migrations: ensure columns exist in old live databases
    await safeAddColumn('users', 'phone', 'TEXT')
    await safeAddColumn('users', 'address', 'TEXT')
    await safeAddColumn('users', 'city', 'TEXT')
    await safeAddColumn('users', 'state', 'TEXT')
    await safeAddColumn('users', 'country', 'TEXT')
    await safeAddColumn('users', 'isGuest', 'INTEGER DEFAULT 0')

    await safeAddColumn('products', 'originalPrice', 'REAL')
    await safeAddColumn('products', 'pageType', "TEXT DEFAULT 'shop'")

    await safeAddColumn('orders', 'userEmail', 'TEXT')
    await safeAddColumn('orders', 'userName', 'TEXT')
    await safeAddColumn('orders', 'userPhone', 'TEXT')
    await safeAddColumn('orders', 'couponCode', 'TEXT')
    await safeAddColumn('orders', 'discountAmount', 'REAL DEFAULT 0')

    // 5. Coupons Table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS coupons (
        code TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        value REAL NOT NULL,
        isActive INTEGER DEFAULT 1,
        createdAt INTEGER,
        updatedAt INTEGER
      );
    `)
}

export async function GET(request: NextRequest) {
    try {
        await runMigrations()
        return NextResponse.json({ success: true, message: "Database schema successfully migrated and updated" })
    } catch (error: any) {
        console.error("[v0] Init API Error:", error)
        return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 })
    }
}
