import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { HttpsProxyAgent } from "https-proxy-agent";
import { z } from "zod";

/**
 * Neon object storage helper (DEC-32, M-09). S3-compatible; credentials, endpoint and
 * region come from the AWS_* variables Neon injects (`neon deploy` / `neon env pull`).
 *
 *  - private objects → bucket "assets"        (read only via signed, expiring URLs)
 *  - public objects  → bucket "public-assets" (anonymous read; add a CDN before launch)
 */
export const BUCKETS = { private: "assets", public: "public-assets" } as const;
export type Visibility = keyof typeof BUCKETS;

/** Max lifetime for signed URLs (seconds). */
export const MAX_SIGNED_URL_TTL = 60 * 60;
/** Upload size cap (bytes). */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

// K-15: validate every input before it reaches storage.
const keySchema = z
  .string()
  .min(1)
  .max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._\-/]*$/, "key: letters, digits, . _ - / only")
  .refine((k) => !k.split("/").includes(".."), "key must not contain '..'");

const uploadSchema = z.object({
  key: keySchema,
  visibility: z.enum(["public", "private"]),
  contentType: z
    .string()
    .regex(/^[\w.+-]+\/[\w.+-]+$/, "invalid MIME type")
    .max(127),
  size: z.number().int().nonnegative().max(MAX_UPLOAD_BYTES),
  cacheControl: z.string().max(200).optional(),
});

let client: S3Client | undefined;

function s3(): S3Client {
  if (client) return client;
  // The AWS SDK ignores HTTPS_PROXY; honour it when set (sandboxed/proxied environments).
  // No-op on Vercel, where no proxy is configured.
  const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy;
  client = new S3Client({
    forcePathStyle: true, // required by Neon object storage
    ...(proxy
      ? { requestHandler: new NodeHttpHandler({ httpsAgent: new HttpsProxyAgent(proxy) }) }
      : {}),
  });
  return client;
}

function endpoint(): string {
  const url = process.env.AWS_ENDPOINT_URL_S3;
  if (!url) throw new Error("AWS_ENDPOINT_URL_S3 is not set");
  return url.replace(/\/+$/, "");
}

const encodeKey = (key: string) => key.split("/").map(encodeURIComponent).join("/");

export type UploadInput = {
  key: string;
  body: Uint8Array | Buffer | string;
  contentType: string;
  visibility: Visibility;
  cacheControl?: string;
};

/** Upload an object. Returns what the `media` table stores (key, visibility, mime, size). */
export async function upload(input: UploadInput) {
  const size =
    typeof input.body === "string" ? Buffer.byteLength(input.body) : input.body.byteLength;
  const v = uploadSchema.parse({ ...input, size });
  await s3().send(
    new PutObjectCommand({
      Bucket: BUCKETS[v.visibility],
      Key: v.key,
      Body: input.body,
      ContentType: v.contentType,
      ContentLength: size,
      ...(v.cacheControl ? { CacheControl: v.cacheControl } : {}),
    }),
  );
  return { key: v.key, visibility: v.visibility, mime: v.contentType, size };
}

/** Plain URL for a public object (anonymous read). */
export function publicUrl(key: string): string {
  return `${endpoint()}/${BUCKETS.public}/${encodeKey(keySchema.parse(key))}`;
}

/** Plain (unsigned) URL of a private object — always denied without a signature. */
export function unsignedPrivateUrl(key: string): string {
  return `${endpoint()}/${BUCKETS.private}/${encodeKey(keySchema.parse(key))}`;
}

/** Signed, expiring GET URL for a private object (default 5 minutes, max 1 hour). */
export async function signedUrl(key: string, expiresIn = 300): Promise<string> {
  const ttl = z.number().int().min(1).max(MAX_SIGNED_URL_TTL).parse(expiresIn);
  return getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: BUCKETS.private, Key: keySchema.parse(key) }),
    { expiresIn: ttl },
  );
}

/** Delete an object. */
export async function remove(key: string, visibility: Visibility): Promise<void> {
  await s3().send(
    new DeleteObjectCommand({ Bucket: BUCKETS[visibility], Key: keySchema.parse(key) }),
  );
}

/** True if the object exists. */
export async function exists(key: string, visibility: Visibility): Promise<boolean> {
  try {
    await s3().send(
      new HeadObjectCommand({ Bucket: BUCKETS[visibility], Key: keySchema.parse(key) }),
    );
    return true;
  } catch (e) {
    const status = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return false;
    throw e;
  }
}
