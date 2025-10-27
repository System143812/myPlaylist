import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'
import handler from './proxy.js';

dotenv.config();
const PORT = process.env.PORT;

const app = express();
app.use(cors());
app.all(/^\/api\/proxy\/.*$/, handler);
app.listen(PORT, () => console.log(`gabby's proxy server is running on port: ${PORT}`));