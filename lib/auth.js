export const JWT_SECRET = process.env.JWT_SECRET;

export function generateToken(user) {
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    // issuedAtMs: exact issue time, compared with passwordChangedAt to sign
    // out sessions from before a password change (iat is whole seconds only).
    { id: user.id, email: user.email, role: user.role, issuedAtMs: Date.now() },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

export function verifyToken(token) {
  const jwt = require("jsonwebtoken");
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Cookie options for the session token. Not httpOnly: the client decodes it
// to know the user's role.
export const SESSION_COOKIE = {
  httpOnly: false,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60, // same lifetime as the JWT
};
