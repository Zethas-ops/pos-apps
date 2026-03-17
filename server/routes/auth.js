import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const user = db.prepare("SELECT * FROM USERS WHERE username = ?").get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  let permissions = [];
  if (user.permissions) {
    permissions = JSON.parse(user.permissions);
  } else {
    permissions = user.role === 'ADMIN' ? ["pos", "open-bills", "history", "menu", "inventory", "promo", "roles", "settings"] : ["pos", "open-bills", "history"];
  }
  const token = jwt.sign({ id: user.id, name: user.name, username: user.username, role: user.role, permissions }, JWT_SECRET, {
    expiresIn: "24h"
  });
  res.json({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role, permissions } });
});
var stdin_default = router;
export {
  stdin_default as default
};
