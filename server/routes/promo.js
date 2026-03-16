import { Router } from "express";
import db from "../db.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
const router = Router();
router.get("/", authenticate, (req, res) => {
  const promos = db.prepare("SELECT * FROM PROMOTIONS ORDER BY promo_id DESC").all();
  res.json(promos);
});
router.post("/", authenticate, requireAdmin, (req, res) => {
  const { title, type, discount_percent, discount_amount, min_buy_qty, free_qty, min_buy_menu_id, free_menu_id, min_nominal, promo_rule, start_date, end_date, day_filter, time_filter } = req.body;
  try {
    const info = db.prepare(`
      INSERT INTO PROMOTIONS (title, type, discount_percent, discount_amount, min_buy_qty, free_qty, min_buy_menu_id, free_menu_id, min_nominal, promo_rule, start_date, end_date, day_filter, time_filter)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, type, discount_percent || null, discount_amount || null, min_buy_qty || null, free_qty || null, min_buy_menu_id || null, free_menu_id || null, min_nominal || null, promo_rule || null, start_date, end_date, day_filter || null, time_filter || null);
    res.json({ success: true, promo_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: "Failed to create promotion" });
  }
});
router.put("/:id", authenticate, requireAdmin, (req, res) => {
  const { title, type, discount_percent, discount_amount, min_buy_qty, free_qty, min_buy_menu_id, free_menu_id, min_nominal, promo_rule, start_date, end_date, day_filter, time_filter } = req.body;
  try {
    db.prepare(`
      UPDATE PROMOTIONS 
      SET title = ?, type = ?, discount_percent = ?, discount_amount = ?, min_buy_qty = ?, free_qty = ?, min_buy_menu_id = ?, free_menu_id = ?, min_nominal = ?, promo_rule = ?, start_date = ?, end_date = ?, day_filter = ?, time_filter = ?
      WHERE promo_id = ?
    `).run(title, type, discount_percent || null, discount_amount || null, min_buy_qty || null, free_qty || null, min_buy_menu_id || null, free_menu_id || null, min_nominal || null, promo_rule || null, start_date, end_date, day_filter || null, time_filter || null, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update promotion" });
  }
});
router.patch("/:id/toggle", authenticate, requireAdmin, (req, res) => {
  try {
    db.prepare("UPDATE PROMOTIONS SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE promo_id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle promotion" });
  }
});
router.delete("/:id", authenticate, requireAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM PROMOTIONS WHERE promo_id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete promotion" });
  }
});
var stdin_default = router;
export {
  stdin_default as default
};
