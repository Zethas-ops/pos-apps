import { Router } from "express";
import multer from "multer";
import path from "path";
import db from "../db.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
const router = Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
router.get("/", authenticate, (req, res) => {
  const items = db.prepare("SELECT * FROM MENU WHERE is_active = 1").all();
  const itemsWithDetails = items.map((item) => {
    const addons = db.prepare(`
      SELECT m.* FROM MENU_ADDONS ma
      JOIN MENU m ON ma.addon_menu_id = m.menu_id
      WHERE ma.menu_id = ?
    `).all(item.menu_id);
    const recipes = db.prepare(`
      SELECT r.*, i.ingredient_name, i.unit, i.current_stock
      FROM RECIPES r
      JOIN INGREDIENTS i ON r.ingredient_id = i.ingredient_id
      WHERE r.menu_id = ?
    `).all(item.menu_id);
    let maxQty = Infinity;
    if (recipes.length > 0) {
      for (const recipe of recipes) {
        let possible = Math.floor(recipe.current_stock / recipe.usage_amount);
        if (possible < 0) possible = 0;
        if (possible < maxQty) maxQty = possible;
      }
    }
    const addonsWithStock = addons.map((addon) => {
      const addonRecipes = db.prepare(`
        SELECT r.*, i.current_stock
        FROM RECIPES r
        JOIN INGREDIENTS i ON r.ingredient_id = i.ingredient_id
        WHERE r.menu_id = ?
      `).all(addon.menu_id);
      let addonMaxQty = Infinity;
      if (addonRecipes.length > 0) {
        for (const recipe of addonRecipes) {
          let possible = Math.floor(recipe.current_stock / recipe.usage_amount);
          if (possible < 0) possible = 0;
          if (possible < addonMaxQty) addonMaxQty = possible;
        }
      }
      return { ...addon, maxQty: addonMaxQty, recipes: addonRecipes };
    });
    return { ...item, addons: addonsWithStock, recipes, maxQty };
  });
  res.json(itemsWithDetails);
});
router.post("/", authenticate, requireAdmin, upload.single("image"), (req, res) => {
  const { name, category, price, recipes, addons, addon_target } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const insertMenu = db.prepare("INSERT INTO MENU (name, category, price, image, addon_target) VALUES (?, ?, ?, ?, ?)");
  const transaction = db.transaction(() => {
    const info = insertMenu.run(name, category, parseFloat(price), image, addon_target || null);
    const menuId = info.lastInsertRowid;
    if (recipes) {
      const parsedRecipes = JSON.parse(recipes);
      const insertRecipe = db.prepare("INSERT INTO RECIPES (menu_id, ingredient_id, usage_amount) VALUES (?, ?, ?)");
      for (const recipe of parsedRecipes) {
        insertRecipe.run(menuId, recipe.ingredient_id, recipe.usage_amount);
      }
    }
    if (addons) {
      const parsedAddons = JSON.parse(addons);
      const insertAddon = db.prepare("INSERT INTO MENU_ADDONS (menu_id, addon_menu_id) VALUES (?, ?)");
      for (const addonId of parsedAddons) {
        insertAddon.run(menuId, addonId);
      }
    }
    return menuId;
  });
  try {
    const menuId = transaction();
    res.json({ success: true, menuId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create menu item" });
  }
});
router.put("/:id", authenticate, requireAdmin, upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, category, price, recipes, addons, addon_target } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : void 0;
  const transaction = db.transaction(() => {
    if (image !== void 0) {
      db.prepare("UPDATE MENU SET name = ?, category = ?, price = ?, image = ?, addon_target = ? WHERE menu_id = ?").run(
        name,
        category,
        parseFloat(price),
        image,
        addon_target || null,
        id
      );
    } else {
      db.prepare("UPDATE MENU SET name = ?, category = ?, price = ?, addon_target = ? WHERE menu_id = ?").run(
        name,
        category,
        parseFloat(price),
        addon_target || null,
        id
      );
    }
    db.prepare("DELETE FROM RECIPES WHERE menu_id = ?").run(id);
    if (recipes) {
      const parsedRecipes = JSON.parse(recipes);
      const insertRecipe = db.prepare("INSERT INTO RECIPES (menu_id, ingredient_id, usage_amount) VALUES (?, ?, ?)");
      for (const recipe of parsedRecipes) {
        insertRecipe.run(id, recipe.ingredient_id, recipe.usage_amount);
      }
    }
    db.prepare("DELETE FROM MENU_ADDONS WHERE menu_id = ?").run(id);
    if (addons) {
      const parsedAddons = JSON.parse(addons);
      const insertAddon = db.prepare("INSERT INTO MENU_ADDONS (menu_id, addon_menu_id) VALUES (?, ?)");
      for (const addonId of parsedAddons) {
        insertAddon.run(id, addonId);
      }
    }
  });
  try {
    transaction();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update menu item" });
  }
});
router.delete("/:id", authenticate, requireAdmin, (req, res) => {
  try {
    db.prepare("UPDATE MENU SET is_active = 0 WHERE menu_id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete menu item" });
  }
});
var stdin_default = router;
export {
  stdin_default as default
};
