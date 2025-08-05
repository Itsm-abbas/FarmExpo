export const JWT_SECRET = process.env.JWT_SECRET;

export function generateToken(user) {
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
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
