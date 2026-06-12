const crypto = require("crypto");
const { nowIso } = require("./store");

const TOKEN_SECRET = process.env.RICHLAND_AUTH_SECRET || "richland-dev-secret-change-me";
const TOKEN_TTL_SECONDS = Number(process.env.RICHLAND_AUTH_TTL_SECONDS || 60 * 60 * 12);

function createPasswordHash(password, saltSeed) {
  const salt = crypto.createHash("sha256").update(String(saltSeed)).digest("hex").slice(0, 24);
  const digest = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt:${salt}:${digest}`;
}

function verifyPassword(password, passwordHash) {
  const [scheme, salt, digest] = String(passwordHash || "").split(":");
  if (scheme !== "scrypt" || !salt || !digest) return false;
  const candidate = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(digest, "hex"));
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(value) {
  return crypto.createHmac("sha256", TOKEN_SECRET).update(value).digest("base64url");
}

function issueToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  };
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function readBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

function verifyToken(token) {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) return null;
  const expectedSignature = sign(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch (error) {
    return null;
  }
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}

function authenticateRequest(req, store) {
  const token = readBearerToken(req);
  const payload = verifyToken(token);
  if (!payload) {
    return {
      authenticated: false,
      role: null,
      user: null,
      token: ""
    };
  }

  const user = (store.users || []).find((entry) => entry.id === payload.sub && entry.isActive !== false) || null;
  if (!user) {
    return {
      authenticated: false,
      role: null,
      user: null,
      token: ""
    };
  }

  return {
    authenticated: true,
    role: user.role,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      updatedAt: user.updatedAt || nowIso()
    },
    token
  };
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

module.exports = {
  createPasswordHash,
  verifyPassword,
  issueToken,
  authenticateRequest,
  sanitizeUser
};
