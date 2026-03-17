import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Image as ImageIcon, Search } from "lucide-react";
import supabase from "../supabase";

function MenuManagement() {
  const [menu, setMenu] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "Coffee",
    price: "",
    addon_target: "All",
    recipes: [],
    addons: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  // 🔥 FETCH DATA
  const fetchData = async () => {
    const { data: menuData } = await supabase.from("menu").select("*");
    const { data: ing } = await supabase.from("ingredients").select("*");

    setMenu(menuData || []);
    setIngredients(ing || []);
  };

  // 🔥 SAVE MENU
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let menuId = editId;

      // 1️⃣ INSERT / UPDATE MENU
      if (editId) {
        await supabase
          .from("menu")
          .update({
            name: formData.name,
            category: formData.category,
            price: Number(formData.price),
            addon_target: formData.addon_target,
          })
          .eq("menu_id", editId);
      } else {
        const { data } = await supabase
          .from("menu")
          .insert([
            {
              name: formData.name,
              category: formData.category,
              price: Number(formData.price),
              addon_target: formData.addon_target,
            },
          ])
          .select()
          .single();

        menuId = data.menu_id;
      }

      // 2️⃣ DELETE OLD RELATIONS
      await supabase.from("recipes").delete().eq("menu_id", menuId);
      await supabase.from("menu_addons").delete().eq("menu_id", menuId);

      // 3️⃣ INSERT RECIPES
      if (formData.recipes.length > 0) {
        await supabase.from("recipes").insert(
          formData.recipes.map((r) => ({
            menu_id: menuId,
            ingredient_id: Number(r.ingredient_id),
            usage_amount: Number(r.usage_amount),
          }))
        );
      }

      // 4️⃣ INSERT ADDONS
      if (formData.addons.length > 0) {
        await supabase.from("menu_addons").insert(
          formData.addons.map((id) => ({
            menu_id: menuId,
            addon_menu_id: id,
          }))
        );
      }

      setShowModal(false);
      setEditId(null);
      setFormData({
        name: "",
        category: "Coffee",
        price: "",
        addon_target: "All",
        recipes: [],
        addons: [],
      });

      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error saving menu");
    }
  };

  // 🔥 DELETE
  const confirmDelete = async () => {
    if (!deleteId) return;

    await supabase.from("menu").delete().eq("menu_id", deleteId);

    setDeleteId(null);
    fetchData();
  };

  const handleEdit = async (item) => {
    // fetch recipes
    const { data: recipes } = await supabase
      .from("recipes")
      .select("*")
      .eq("menu_id", item.menu_id);

    const { data: addons } = await supabase
      .from("menu_addons")
      .select("*")
      .eq("menu_id", item.menu_id);

    setEditId(item.menu_id);

    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      addon_target: item.addon_target || "All",
      recipes: recipes || [],
      addons: addons?.map((a) => a.addon_menu_id) || [],
    });

    setShowModal(true);
  };

  const addRecipeRow = () => {
    setFormData({
      ...formData,
      recipes: [...formData.recipes, { ingredient_id: "", usage_amount: "" }],
    });
  };

  const updateRecipeRow = (i, field, val) => {
    const r = [...formData.recipes];
    r[i][field] = val;
    setFormData({ ...formData, recipes: r });
  };

  const removeRecipeRow = (i) => {
    const r = [...formData.recipes];
    r.splice(i, 1);
    setFormData({ ...formData, recipes: r });
  };

  const filteredMenu = menu.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Menu</h1>

        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-xl"
        />

        <button
          onClick={() => {
            setEditId(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-4 gap-4">
        {filteredMenu.map((item) => (
          <div key={item.menu_id} className="border p-4 rounded-xl">
            <h3 className="font-bold">{item.name}</h3>
            <p>Rp {item.price}</p>

            <div className="flex gap-2 mt-2">
              <button onClick={() => handleEdit(item)}>
                <Edit size={16} />
              </button>
              <button onClick={() => setDeleteId(item.menu_id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <form
          onSubmit={handleSubmit}
          className="fixed inset-0 bg-black/50 flex justify-center items-center"
        >
          <div className="bg-white p-6 rounded-xl w-[500px] space-y-4">
            <input
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border p-2"
            />

            <input
              type="number"
              placeholder="Price"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="w-full border p-2"
            />

            {/* RECIPES */}
            <div>
              <button type="button" onClick={addRecipeRow}>
                + Ingredient
              </button>

              {formData.recipes.map((r, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <select
                    value={r.ingredient_id}
                    onChange={(e) =>
                      updateRecipeRow(i, "ingredient_id", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    {ingredients.map((ing) => (
                      <option
                        key={ing.ingredient_id}
                        value={ing.ingredient_id}
                      >
                        {ing.ingredient_name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Qty"
                    value={r.usage_amount}
                    onChange={(e) =>
                      updateRecipeRow(i, "usage_amount", e.target.value)
                    }
                  />

                  <button onClick={() => removeRecipeRow(i)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" className="bg-blue-600 text-white px-4 py-2">
              Save
            </button>
          </div>
        </form>
      )}

      {/* DELETE */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-4 rounded-xl">
            <p>Delete this menu?</p>
            <button onClick={confirmDelete}>Yes</button>
            <button onClick={() => setDeleteId(null)}>No</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuManagement;