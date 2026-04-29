import crypto from "crypto";

const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_DIGEST = "sha512";
const TOKEN_ALGORITHM = "HS256";

type TokenPayload = {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
};

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, "base64");
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET must be set and at least 16 characters long");
  }
  return secret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST)
    .toString("hex");

  return `pbkdf2$${PASSWORD_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedPassword: string): boolean {
  const [scheme, iterationsRaw, salt, originalHash] = String(storedPassword).split("$");
  if (scheme !== "pbkdf2" || !iterationsRaw || !salt || !originalHash) return false;

  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations < 10000) return false;

  const candidateHash = crypto
    .pbkdf2Sync(password, salt, iterations, Buffer.from(originalHash, "hex").length, PASSWORD_DIGEST)
    .toString("hex");

  return crypto.timingSafeEqual(Buffer.from(candidateHash, "hex"), Buffer.from(originalHash, "hex"));
}

export function signToken(payload: TokenPayload, expiresInSeconds = 60 * 60 * 24 * 7): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: TOKEN_ALGORITHM, typ: "JWT" };
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedBody}`;
  const signature = crypto.createHmac("sha256", getJwtSecret()).update(data).digest();

  return `${data}.${base64UrlEncode(signature)}`;
}

export function verifyToken(token: string): TokenPayload {
  const [encodedHeader, encodedBody, encodedSignature] = String(token).split(".");
  if (!encodedHeader || !encodedBody || !encodedSignature) {
    throw new Error("Invalid token format");
  }

  const data = `${encodedHeader}.${encodedBody}`;
  const expectedSignature = crypto.createHmac("sha256", getJwtSecret()).update(data).digest();
  const actualSignature = base64UrlDecode(encodedSignature);

  if (expectedSignature.length !== actualSignature.length || !crypto.timingSafeEqual(expectedSignature, actualSignature)) {
    throw new Error("Invalid token signature");
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8"));
  if (header.alg !== TOKEN_ALGORITHM || header.typ !== "JWT") {
    throw new Error("Invalid token header");
  }

  const payload = JSON.parse(base64UrlDecode(encodedBody).toString("utf8")) as TokenPayload;
  const now = Math.floor(Date.now() / 1000);
  if (!payload.id || !payload.email || !payload.role) throw new Error("Invalid token payload");
  if (payload.exp && payload.exp < now) throw new Error("Token expired");

  return payload;
}

export function createPasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string): string {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}
