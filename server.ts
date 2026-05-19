import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { put } from "@vercel/blob";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse large JSON (since images are base64)
  app.use(express.json({ limit: "50mb" }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/upload", async (req, res) => {
    try {
      const { base64, filename } = req.body;
      
      if (!base64 || !filename) {
          return res.status(400).json({ error: "Missing base64 or filename" });
      }

      if (!process.env.BLOB_READ_WRITE_TOKEN) {
          // If token missing, maybe simulate or return an error
          return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN is missing on server" });
      }

      // buffer from base64
      const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const blob = await put(filename, buffer, {
          access: 'private',
      });

      res.json({ url: `/api/image?url=${encodeURIComponent(blob.url)}` });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to upload" });
    }
  });

  app.get("/api/image", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "Missing url parameter" });
      }

      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ error: "Missing BLOB_READ_WRITE_TOKEN" });
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch image" });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to load image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Since using express 4, it's app.get('*')
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
