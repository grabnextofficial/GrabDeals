interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: any;
  error?: string;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1Result>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // --- PRODUCTS API ---

      // GET /api/products (Fetch all active products)
      if (path === "/api/products" && method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM products WHERE isActive = 1 ORDER BY createdAt DESC"
        ).all();
        
        const products = results.map((p: any) => ({
          ...p,
          tags: JSON.parse(p.tags as string || "[]"),
          isActive: Boolean(p.isActive)
        }));
        
        return Response.json(products, { headers: corsHeaders });
      }

      // POST /api/products (Add new product - for admin)
      if (path === "/api/products" && method === "POST") {
        const data: any = await request.json();
        const id = crypto.randomUUID();
        const now = Date.now();

        await env.DB.prepare(`
          INSERT INTO products (id, title, description, price, category, tags, imageUrl, downloadUrl, isActive, salesCount, pageCode, createdBy, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id, 
          data.title, 
          data.description, 
          data.price, 
          data.category, 
          JSON.stringify(data.tags || []), 
          data.imageUrl, 
          data.downloadUrl, 
          data.isActive ? 1 : 0, 
          0, 
          data.pageCode || null, 
          data.createdBy, 
          now, 
          now
        ).run();

        return Response.json({ success: true, id }, { status: 201, headers: corsHeaders });
      }

      // --- ORDERS API ---

      // POST /api/orders (Create Order)
      if (path === "/api/orders" && method === "POST") {
        const data: any = await request.json();
        const id = "ORD-" + crypto.randomUUID().slice(0, 8).toUpperCase();
        const now = Date.now();

        await env.DB.prepare(`
          INSERT INTO orders (id, userId, items, totalAmount, status, paymentId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          data.userId,
          JSON.stringify(data.items),
          data.totalAmount,
          data.status || 'pending',
          data.paymentId || null,
          now,
          now
        ).run();

        return Response.json({ success: true, id }, { status: 201, headers: corsHeaders });
      }

      // GET /api/orders/user/:userId (Get user orders)
      if (path.startsWith("/api/orders/user/") && method === "GET") {
        const userId = path.split("/").pop();
        const { results } = await env.DB.prepare(
          "SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC"
        ).bind(userId).all();

        const orders = results.map((o: any) => ({
          ...o,
          items: JSON.parse(o.items as string || "[]")
        }));

        return Response.json(orders, { headers: corsHeaders });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });

    } catch (err: any) {
      return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
  }
};