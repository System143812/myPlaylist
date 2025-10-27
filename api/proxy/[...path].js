// api/proxy/[...path].js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const BACKEND_URL = (process.env.BACKEND_URL || "").replace(/\/$/, ""); // no trailing slash
const PROXY_KEY = process.env.PROXY_KEY || "";

export default async function handler(req, res) {
  try {
    // ---------- Logging for debugging ----------
    console.log("INCOMING:", req.method, req.url);
    console.log("Query keys:", req.query);

    // Accept both forms: req.query.path (array) or req.query["...path"] or fallback to req.url
    const rawQueryPath = req.query.path || req.query["...path"] || null;
    let forwardPath;

    if (rawQueryPath) {
      forwardPath = Array.isArray(rawQueryPath) ? rawQueryPath.join("/") : String(rawQueryPath);
    } else {
      // strip leading /api/proxy or /api/proxy/ prefix
      forwardPath = req.url.replace(/^\/api\/proxy\/?/, "");
      // If req.url equals "/api/proxy" forwardPath becomes "" - handle that below
    }

    if (!forwardPath) {
      console.log("No forward path found. req.url:", req.url, "req.query:", req.query);
      return res.status(400).json({ error: "Missing path. Use /api/proxy/<path>." });
    }

    const backendUrl = `${BACKEND_URL}/${forwardPath}`;
    console.log("Proxy -> backendUrl:", backendUrl);

    // Forward headers: copy some but overwrite host and add proxy key
    const outgoingHeaders = {};
    // copy relevant headers (user-agent, accept-range, range etc.)
    ["range", "if-range", "user-agent", "accept", "accept-encoding"].forEach(h => {
      if (req.headers[h]) outgoingHeaders[h] = req.headers[h];
    });
    if (PROXY_KEY) outgoingHeaders["x-proxy-key"] = PROXY_KEY;

    // Fetch backend
    const backendResponse = await fetch(backendUrl, {
      method: req.method,
      headers: outgoingHeaders,
      // body only for POST/PUT/PATCH
      body: ["GET","HEAD"].includes(req.method) ? undefined : req.body ? JSON.stringify(req.body) : undefined,
    });

    console.log("Backend status:", backendResponse.status, "| content-type:", backendResponse.headers.get("content-type"));

    // Forward backend headers (watch out for hop-by-hop headers)
    backendResponse.headers.forEach((value, name) => {
      // don't forward transfer-encoding chunked (let Vercel handle content-length)
      if (["transfer-encoding"].includes(name)) return;
      res.setHeader(name, value);
    });

    // If backend returned JSON/text -> forward appropriately
    const ct = (backendResponse.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("application/json")) {
      const jsonData = await backendResponse.json();
      return res.status(backendResponse.status).json(jsonData);
    }
    if (ct.startsWith("text/") || ct.includes("application/javascript") || ct.includes("application/xml")) {
      const text = await backendResponse.text();
      return res.status(backendResponse.status).send(text);
    }

    // For binary (audio/video/images): read arrayBuffer -> send Buffer
    const ab = await backendResponse.arrayBuffer();
    const buffer = Buffer.from(ab);
    res.status(backendResponse.status).send(buffer);
  } catch (err) {
    console.error("PROXY ERROR:", err);
    return res.status(502).json({ error: "Proxy error", details: String(err.message) });
  }
}
