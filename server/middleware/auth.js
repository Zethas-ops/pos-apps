import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function requirePermission(permission) {
  return (req, res, next) => {
    const userPerms = req.user?.permissions || (req.user?.role === "ADMIN" ? ["pos", "open-bills", "history", "menu", "inventory", "promo", "roles", "settings"] : ["pos", "open-bills", "history"]);
    if (!userPerms.includes(permission)) {
      return res.status(403).json({ error: `Permission '${permission}' required` });
    }
    next();
  };
}

export {
  authenticate,
  requireAdmin,
  requirePermission
};
