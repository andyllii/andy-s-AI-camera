export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
}
