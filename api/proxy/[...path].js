import fetch from 'node-fetch';
import dotenv from 'dotenv'

dotenv.config();

const PROXY_KEY = process.env.PROXY_KEY;
const BACKEND_URL = process.env.BACKEND_URL;
const PROXY_URL = process.env.PROXY_URL_VERCEL;

export default async function handler(req, res) {
    try {
        const path = req.url.replace("/api/proxy", "");
        const backendUrl = `${BACKEND_URL}/${path}`;
        const response = await fetch(backendUrl, {
            method: req.method,
            headers: {
                "Content-Type":"application/json",
                "x-proxy-key": PROXY_KEY,
                ...(req.headers.Authorization && {"Authorization": req.headers.Authorization})
            },
            body: req.method !== "GET" ? JSON.stringify(req.body) : undefined
        });
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
            console.log(key, value);
        });
        //check if yung header is json or kung anong file type man
        const contentType =  response.headers.get("content-type");
        if(contentType && contentType.includes("application/json")){
            const data = await response.json();
            return res.status(response.status).json(data);
        }

        if(contentType.startsWith('text/')){
            const data = await response.text();
            return res.status(response.status).send(data);
        }

        try {
            response.body.pipe(res);
        } catch (error) {
            return res.status(500).json({error: `Error loading error: ${error}`});
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Proxy server error", details: error.message});
    }
}

