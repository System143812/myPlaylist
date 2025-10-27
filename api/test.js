import fetch from 'node-fetch';
import dotenv from 'dotenv'

dotenv.config();

const PROXY_KEY = process.env.PROXY_KEY;
const BACKEND_URL = process.env.BACKEND_URL;
const PROXY_URL = process.env.PROXY_URL_VERCEL;

export default function handler(req, res) {
  return res.status(200).json({ message: "✅ API is working" });

}