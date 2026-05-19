import { put } from "@vercel/blob";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { base64, filename } = req.body;
    
    if (!base64 || !filename) {
        return res.status(400).json({ error: "Missing base64 or filename" });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN is missing on server" });
    }

    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const blob = await put(filename, buffer, {
        access: 'private',
    });

    res.status(200).json({ url: `/api/image?url=${encodeURIComponent(blob.url)}` });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to upload" });
  }
}
