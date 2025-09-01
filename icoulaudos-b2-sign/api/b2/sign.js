// Vercel Serverless Function para assinar upload ao Backblaze B2 (compatível S3)
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.B2_REGION || "us-east-005",
  endpoint: process.env.B2_ENDPOINT || "https://s3.us-east-005.backblazeb2.com",
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APP_KEY
  }
});

export default async function handler(req, res) {
  // CORS básico
  const origin = req.headers.origin || "";
  const allowed = process.env.ALLOWED_ORIGIN || "";
  res.setHeader("Access-Control-Allow-Origin", allowed || origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { key, contentType } = req.body || {};
    if (!key) return res.status(400).json({ error: "Missing key" });

    const Bucket = process.env.B2_BUCKET;
    if (!Bucket) return res.status(500).json({ error: "Bucket not configured" });

    const command = new PutObjectCommand({
      Bucket,
      Key: key,
      ContentType: contentType || "application/octet-stream"
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 10 }); // 10 min

    const publicBase = process.env.B2_PUBLIC_BASE_URL || "";
    const publicUrl = publicBase ? `${publicBase.replace(/\/$/, "")}/${key}` : null;

    return res.status(200).json({
      type: "put",
      url,
      headers: {},
      publicUrl
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Sign error" });
  }
}
