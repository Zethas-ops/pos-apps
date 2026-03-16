import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
const router = Router();
router.use(authenticate);
router.use(requireAdmin);
router.get("/", (req, res) => {
  try {
    const users = db.prepare("SELECT id, name, username, role FROM USERS").all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/", (req, res) => {
  const { name, username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Username, password, and role are required" });
  }
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const info = db.prepare("INSERT INTO USERS (name, username, password, role) VALUES (?, ?, ?, ?)").run(name, username, hashedPassword, role);
    res.status(201).json({ id: info.lastInsertRowid, name, username, role });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      res.status(400).json({ error: "Username already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});
router.put("/:id", (req, res) => {
  const { name, username, password, role } = req.body;
  const { id } = req.params;
  if (!username || !role) {
    return res.status(400).json({ error: "Username and role are required" });
  }
  try {
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare("UPDATE USERS SET name = ?, username = ?, password = ?, role = ? WHERE id = ?").run(name, username, hashedPassword, role, id);
    } else {
      db.prepare("UPDATE USERS SET name = ?, username = ?, role = ? WHERE id = ?").run(name, username, role, id);
    }
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      res.status(400).json({ error: "Username already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const adminCount = db.prepare("SELECT COUNT(*) as count FROM USERS WHERE role = 'ADMIN'").get();
  const userToDelete = db.prepare("SELECT role FROM USERS WHERE id = ?").get(id);
  if (userToDelete && userToDelete.role === "ADMIN" && adminCount.count <= 1) {
    return res.status(400).json({ error: "Cannot delete the last administrator" });
  }
  try {
    db.prepare("DELETE FROM USERS WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var stdin_default = router;
export {
  stdin_default as default
};
