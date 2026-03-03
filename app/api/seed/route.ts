import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const now = Date.now()

        // --- Seed Categories ---
        const categories = [
            { name: 'Electronics', slug: 'electronics', description: 'Smartphones, laptops, gadgets & more', imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
            { name: 'Fashion', slug: 'fashion', description: 'Trending clothing, shoes & accessories', imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400' },
            { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Furniture, appliances & home decor', imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
            { name: 'Books', slug: 'books', description: 'Bestsellers, textbooks & novels', imageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400' },
            { name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Gym equipment, sportswear & outdoor gear', imageUrl: 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcfdb?w=400' },
            { name: 'Beauty & Health', slug: 'beauty-health', description: 'Skincare, makeup & wellness products', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400' },
        ]

        for (const cat of categories) {
            const id = crypto.randomUUID()
            try {
                await executeQuery(`
          INSERT OR IGNORE INTO categories (id, name, slug, description, imageUrl, productCount, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, cat.name, cat.slug, cat.description, cat.imageUrl, 0, 1, now, now])
            } catch (e) {
                // Ignore duplicate slug/name errors
            }
        }

        // --- Seed Products ---
        const products = [
            {
                title: 'iPhone 15 Pro Max',
                description: 'Apple iPhone 15 Pro Max with A17 Pro chip, 256GB storage, titanium design, 48MP camera system with 5x optical zoom. The most powerful iPhone ever with USB-C and Action button.',
                price: 134900,
                category: 'electronics',
                tags: ['apple', 'iphone', 'smartphone', 'premium'],
                imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500',
            },
            {
                title: 'Samsung Galaxy S24 Ultra',
                description: 'Samsung Galaxy S24 Ultra with Snapdragon 8 Gen 3, 200MP camera, built-in S Pen, 6.8" Dynamic AMOLED display, 5000mAh battery, Galaxy AI features.',
                price: 129999,
                category: 'electronics',
                tags: ['samsung', 'galaxy', 'smartphone', 'android'],
                imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500',
            },
            {
                title: 'MacBook Air M3',
                description: 'Apple MacBook Air 15-inch with M3 chip, 8GB RAM, 256GB SSD, Liquid Retina display, 18-hour battery life, MagSafe charging, fanless design.',
                price: 134900,
                category: 'electronics',
                tags: ['apple', 'macbook', 'laptop', 'premium'],
                imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
            },
            {
                title: 'Sony WH-1000XM5 Headphones',
                description: 'Premium noise-cancelling wireless headphones with 30-hour battery, multipoint connection, speak-to-chat, adaptive sound control.',
                price: 24990,
                category: 'electronics',
                tags: ['sony', 'headphones', 'audio', 'wireless'],
                imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
            },
            {
                title: 'Men\'s Premium Cotton T-Shirt',
                description: 'Ultra-soft 100% organic cotton crew neck t-shirt. Available in multiple colors. Perfect for everyday casual wear with a modern slim fit.',
                price: 799,
                category: 'fashion',
                tags: ['men', 'tshirt', 'cotton', 'casual'],
                imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
            },
            {
                title: 'Women\'s Running Shoes - Nike Air Zoom',
                description: 'Lightweight and responsive running shoes with Zoom Air cushioning, breathable mesh upper, and durable rubber outsole.',
                price: 8995,
                category: 'fashion',
                tags: ['women', 'shoes', 'nike', 'running'],
                imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
            },
            {
                title: 'Leather Crossbody Bag',
                description: 'Handcrafted genuine leather crossbody bag with adjustable strap, multiple compartments, and brass hardware. Perfect for daily use.',
                price: 2499,
                category: 'fashion',
                tags: ['bag', 'leather', 'accessories', 'unisex'],
                imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500',
            },
            {
                title: 'Instant Pot Duo 7-in-1',
                description: 'Electric pressure cooker, slow cooker, rice cooker, steamer, yogurt maker, warmer, and sauté all in one. 6-quart capacity for families.',
                price: 6499,
                category: 'home-kitchen',
                tags: ['kitchen', 'cooker', 'appliance', 'instant-pot'],
                imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
            },
            {
                title: 'Minimalist Desk Lamp LED',
                description: 'Modern LED desk lamp with adjustable brightness, color temperature control, USB charging port, and touch controls. Eye-care technology.',
                price: 1899,
                category: 'home-kitchen',
                tags: ['lamp', 'led', 'desk', 'home-decor'],
                imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=500',
            },
            {
                title: 'Atomic Habits by James Clear',
                description: 'The #1 New York Times bestseller. An easy and proven way to build good habits and break bad ones. Over 15 million copies sold worldwide.',
                price: 499,
                category: 'books',
                tags: ['self-help', 'habits', 'bestseller', 'non-fiction'],
                imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
            },
            {
                title: 'The Psychology of Money',
                description: 'By Morgan Housel. Timeless lessons on wealth, greed, and happiness. 19 short stories exploring the strange ways people think about money.',
                price: 399,
                category: 'books',
                tags: ['finance', 'psychology', 'bestseller', 'non-fiction'],
                imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
            },
            {
                title: 'Yoga Mat Premium 6mm',
                description: 'Non-slip exercise yoga mat with alignment marks, eco-friendly TPE material, carrying strap included. Perfect for yoga, pilates, and stretching.',
                price: 1299,
                category: 'sports-fitness',
                tags: ['yoga', 'mat', 'fitness', 'exercise'],
                imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500',
            },
            {
                title: 'Adjustable Dumbbell Set 24kg',
                description: 'Space-saving adjustable dumbbell set with quick-change weight system. Replaces 15 pairs of dumbbells. Range: 2.5kg to 24kg per dumbbell.',
                price: 14999,
                category: 'sports-fitness',
                tags: ['dumbbell', 'weights', 'gym', 'home-workout'],
                imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500',
            },
            {
                title: 'Vitamin C Serum - 30ml',
                description: '20% pure Vitamin C serum with hyaluronic acid and Vitamin E. Brightens skin, reduces dark spots, and boosts collagen production.',
                price: 699,
                category: 'beauty-health',
                tags: ['skincare', 'serum', 'vitamin-c', 'beauty'],
                imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500',
            },
            {
                title: 'Smart Watch Pro X1',
                description: 'Advanced fitness smartwatch with AMOLED display, heart rate monitor, SpO2 tracking, GPS, 14-day battery life, 100+ sport modes, and IP68 water resistance.',
                price: 4999,
                category: 'electronics',
                tags: ['smartwatch', 'fitness', 'wearable', 'tech'],
                imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
            },
            {
                title: 'Wireless Bluetooth Speaker',
                description: 'Portable Bluetooth 5.3 speaker with 360° surround sound, IPX7 waterproof, 24-hour battery life, built-in microphone for hands-free calls.',
                price: 2999,
                category: 'electronics',
                tags: ['speaker', 'bluetooth', 'wireless', 'portable'],
                imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
            },
        ]

        let addedCount = 0
        for (const prod of products) {
            const id = crypto.randomUUID()
            try {
                await executeQuery(`
          INSERT INTO products (id, title, description, price, category, tags, imageUrl, downloadUrl, isActive, salesCount, pageCode, createdBy, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
                    id,
                    prod.title,
                    prod.description,
                    prod.price,
                    prod.category,
                    JSON.stringify(prod.tags),
                    prod.imageUrl,
                    '',
                    1,
                    Math.floor(Math.random() * 500),
                    null,
                    'admin',
                    now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
                    now
                ])
                addedCount++
            } catch (e: any) {
                console.error(`Failed to insert product ${prod.title}:`, e.message)
            }
        }

        // Update category product counts
        for (const cat of categories) {
            try {
                await executeQuery(`
          UPDATE categories SET productCount = (
            SELECT COUNT(*) FROM products WHERE category = ? AND isActive = 1
          ) WHERE slug = ?
        `, [cat.slug, cat.slug])
            } catch (e) { }
        }

        return NextResponse.json({
            success: true,
            message: `Seeded ${categories.length} categories and ${addedCount} products`
        })
    } catch (error: any) {
        console.error("[v0] Seed API Error:", error);
        return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 })
    }
}

