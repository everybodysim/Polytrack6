export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = new Set(["https://everybodysim.github.io", "http://localhost:8000", "http://127.0.0.1:8000"]);
    const cors = {
      "Access-Control-Allow-Origin": allowed.has(origin) ? origin : "https://everybodysim.github.io",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
    const json = (body, status = 200) => new Response(JSON.stringify(body), {
      status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (!env.DB) return json({ error: "D1 binding DB is not configured." }, 500);
    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        await env.DB.prepare("SELECT 1").first();
        return json({ ok: true, service: "polytrack-community-tracks" });
      }
      if (url.pathname === "/api/tracks" && request.method === "GET") {
        const limit = Math.max(1, Math.min(40, parseInt(url.searchParams.get("limit") || "20", 10) || 20));
        const offset = Math.max(0, Math.min(100000, parseInt(url.searchParams.get("offset") || "0", 10) || 0));
        const result = await env.DB.prepare("SELECT id, name, description, author, created_at FROM community_tracks ORDER BY created_at DESC LIMIT ? OFFSET ?").bind(limit, offset).all();
        const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM community_tracks").first();
        return json({ tracks: result.results || [], total: count ? count.total : 0, limit, offset });
      }
      const match = url.pathname.match(/^\/api\/tracks\/([a-f0-9-]{36})$/i);
      if (match && request.method === "GET") {
        const track = await env.DB.prepare("SELECT id, name, description, author, export_name, export_data, created_at FROM community_tracks WHERE id = ?").bind(match[1]).first();
        return track ? json({ track }) : json({ error: "Track not found." }, 404);
      }
      if (url.pathname === "/api/tracks" && request.method === "POST") {
        const length = Number(request.headers.get("Content-Length") || 0);
        if (length > 220000) return json({ error: "Upload is too large (maximum 220 KB)." }, 413);
        let body;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const description = typeof body.description === "string" ? body.description.trim() : "";
        const author = typeof body.author === "string" ? body.author.trim() : "";
        const exportData = typeof body.exportData === "string" ? body.exportData.trim() : "";
        const exportName = typeof body.exportName === "string" ? body.exportName.trim() : "";
        if (!name || name.length > 64) return json({ error: "Track name must be 1–64 characters." }, 400);
        if (description.length > 400) return json({ error: "Description must be 400 characters or fewer." }, 400);
        if (!author || author.length > 40) return json({ error: "Author must be 1–40 characters." }, 400);
        if (!exportName || exportName.length > 64) return json({ error: "Original track name is missing or too long." }, 400);
        if (!exportData.startsWith("PolyTrack2") || exportData.length > 180000) return json({ error: "Invalid or oversized Polytrack export code." }, 400);
        const id = crypto.randomUUID();
        const created = new Date().toISOString();
        await env.DB.prepare("INSERT INTO community_tracks (id, name, description, author, export_name, export_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id, name, description, author, exportName, exportData, created).run();
        return json({ track: { id, name, description, author, created_at: created } }, 201);
      }
      return json({ error: "Not found." }, 404);
    } catch (error) {
      console.error("Community tracks API error", error);
      return json({ error: "The community track service encountered an internal error." }, 500);
    }
  }
};
