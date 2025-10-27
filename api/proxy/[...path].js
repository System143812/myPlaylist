import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const PROXY_KEY = process.env.PROXY_KEY;
const BACKEND_URL = process.env.BACKEND_URL;

export default async function handler(req, res) {
  try {
    
    const fileName = req.query.file;
    const endPoint = req.query["...path"];
    const urlPath = fileName ? `${endPoint}?file=${encodeURIComponent(req.query.file)}` : endPoint
    const backendUrl = `${BACKEND_URL}/${urlPath}`;

    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        "x-proxy-key": PROXY_KEY,
        ...(req.headers.authorization && { "authorization": req.headers.authorization }),
        ...(req.headers.get("Content-Type") && {"Content-Type": req.headers.get("Content-Type")})
  
      },
      body: req.body ? JSON.stringify(req.body) : undefined
    });

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const contentType = response.headers.get("Content-Type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    if (contentType.startsWith("text/")) {
      const data = await response.text();
      return res.status(response.status).send(data);
    }
   
    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(response.status);
    return res.send(buffer);

  } catch (error) {
    console.error("Proxy server error:", error);
    res.status(500).json({
      error: "Proxy server error",
      details: error.message
    });
  }
}
