import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { authenticate, requirePermission } from "../middleware/auth.js";
const router = Router();
router.use(authenticate);
router.use(requirePermission("roles"));
router.get("/", (req, res) => {
  try {
    const users = db.prepare("SELECT id, name, username, role, permissions FROM USERS").all();
    const formattedUsers = users.map(u => ({
      ...u,
      permissions: u.permissions ? JSON.parse(u.permissions) : (u.role === 'ADMIN' ? ["pos", "open-bills", "history", "menu", "inventory", "promo", "roles", "settings"] : ["pos", "open-bills", "history"])
    }));
    res.json(formattedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/", (req, res) => {
  const { name, username, password, role, permissions } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Username, password, and role are required" });
  }
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const permsString = permissions ? JSON.stringify(permissions) : JSON.stringify([]);
    const info = db.prepare("INSERT INTO USERS (name, username, password, role, permissions) VALUES (?, ?, ?, ?, ?)").run(name, username, hashedPassword, role, permsString);
    res.status(201).json({ id: info.lastInsertRowid, name, username, role, permissions });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      res.status(400).json({ error: "Username already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});
router.put("/:id", (req, res) => {
  const { name, username, password, role, permissions } = req.body;
  const { id } = req.params;
  if (!username || !role) {
    return res.status(400).json({ error: "Username and role are required" });
  }
  try {
    const permsString = permissions ? JSON.stringify(permissions) : JSON.stringify([]);
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare("UPDATE USERS SET name = ?, username = ?, password = ?, role = ?, permissions = ? WHERE id = ?").run(name, username, hashedPassword, role, permsString, id);
    } else {
      db.prepare("UPDATE USERS SET name = ?, username = ?, role = ?, permissions = ? WHERE id = ?").run(name, username, role, permsString, id);
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
