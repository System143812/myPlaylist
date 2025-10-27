import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL;
const PROXY_KEY = process.env.PROXY_KEY;

export default async function handler(req, res) {
  try {
    // Handle both local and Vercel parameter naming
    const rawPath = req.query.path || req.query["...path"];
    const joinedPath = Array.isArray(rawPath) ? rawPath.join("/") : rawPath;

    if (!joinedPath) {
      console.error("❌ Missing or invalid path:", req.query);
      return res.status(400).json({ error: "Invalid or missing path" });
    }

    const backendUrl = `${BACKEND_URL}/${joinedPath}`;
    console.log("🔁 Proxying request to:", backendUrl);

    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        "x-proxy-key": PROXY_KEY,
        "Content-Type": "application/json",
      },
    });

    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    const buffer = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(buffer));
  } catch (error) {
    console.error("❌ Proxy server error:", error.message);
    res.status(500).json({ error: "Proxy server error", details: error.message });
  }
}
