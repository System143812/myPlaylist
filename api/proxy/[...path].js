import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const PROXY_KEY = process.env.PROXY_KEY;
const BACKEND_URL = process.env.BACKEND_URL;

export default async function handler(req, res) {
  try {
    const path = req.query.path || req.url.replace("/api/proxy", "");
    const backendUrl = `${BACKEND_URL}/${path}`;

    console.log("========== 🌐 INCOMING REQUEST ==========");
    console.log("➡️  Method:", req.method);
    console.log("➡️  Request URL:", req.url);
    console.log("➡️  Backend Target:", backendUrl);
    console.log("=========================================");

    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        "x-proxy-key": PROXY_KEY,
        ...(req.headers.authorization && { "authorization": req.headers.authorization })
      },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined
    });

    console.log("✅ Backend response status:", response.status);
    console.log("📦 Content-Type:", response.headers.get("content-type"));

    // Copy headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const contentType = response.headers.get("content-type") || "";

    // Handle JSON
    if (contentType.includes("application/json")) {
      const data = await response.json();
      console.log("🧩 JSON Response detected.");
      return res.status(response.status).json(data);
    }

    // Handle text (HTML, plain text, etc.)
    if (contentType.startsWith("text/")) {
      const data = await response.text();
      console.log("📝 Text Response detected.");
      return res.status(response.status).send(data);
    }

    // Handle binary (audio, video, etc.)
    console.log("🎵 Binary/Stream Response detected.");
    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(response.status);
    return res.send(buffer);

  } catch (error) {
    console.error("❌ Proxy server error:", error);
    res.status(500).json({
      error: "Proxy server error",
      details: error.message
    });
  }
}
