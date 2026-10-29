import { S3Client } from "@aws-sdk/client-s3";

export type R2Config = {
  client: S3Client;
  bucket: string;
  publicBaseUrl: string;
};

function clean(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

function normalizeAccountId(value: string) {
  const match = value.match(/([a-f0-9]{32})/i);
  return match ? match[1].toLowerCase() : value;
}

function normalizePublicBaseUrl(value: string) {
  if (!value) return "";
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getR2Config(): { config: R2Config | null; missing: string[] } {
  const accountId = normalizeAccountId(clean(process.env.R2_ACCOUNT_ID));
  const accessKeyId = clean(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = clean(process.env.R2_SECRET_ACCESS_KEY);
  const bucket = clean(process.env.R2_BUCKET_NAME);
  const publicBaseUrl = normalizePublicBaseUrl(clean(process.env.R2_PUBLIC_BASE_URL));

  const missing = Object.entries({
    R2_ACCOUNT_ID: /^[a-f0-9]{32}$/.test(accountId) ? accountId : "",
    R2_ACCESS_KEY_ID: accessKeyId,
    R2_SECRET_ACCESS_KEY: secretAccessKey,
    R2_BUCKET_NAME: bucket,
    R2_PUBLIC_BASE_URL: publicBaseUrl,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) return { config: null, missing };

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { config: { client, bucket, publicBaseUrl }, missing };
}

export function describeR2Error(error: unknown) {
  const name = (error as { name?: string; Code?: string })?.name || (error as { Code?: string })?.Code || "";
  switch (name) {
    case "NoSuchBucket":
      return "Bucket R2 tidak ditemukan. Periksa R2_BUCKET_NAME.";
    case "InvalidAccessKeyId":
    case "SignatureDoesNotMatch":
    case "Unauthorized":
      return "Kunci akses R2 tidak valid. Periksa R2_ACCESS_KEY_ID dan R2_SECRET_ACCESS_KEY.";
    case "AccessDenied":
      return "Token R2 tidak punya izin tulis (Object Read & Write) ke bucket ini.";
    default:
      return `Upload ke Cloudflare R2 gagal${name ? ` (${name})` : ""}. Periksa pengaturan R2.`;
  }
}
