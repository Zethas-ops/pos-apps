import { useEffect, useState } from "react";
import { Plus, Search, Edit2 } from "lucide-react";
import supabase from "../supabase";

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    ingredient_name: "",
    unit: "",
    current_stock: ""
  });
  const [adjustAmount, setAdjustAmount] = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  // 🔥 FETCH INVENTORY
  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("ingredient_id", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setInventory(data);
  };

  // 🔥 ADD INVENTORY
  const handleAddSubmit = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("inventory")
        .insert([
          {
            ingredient_name: formData.ingredient_name,
            unit: formData.unit,
            current_stock: Number(formData.current_stock)
          }
        ]);

      if (error) throw error;

      setShowAddModal(false);
      setFormData({ ingredient_name: "", unit: "", current_stock: "" });
      fetchInventory();
    } catch (err) {
      alert("Error adding ingredient");
    }
  };

  // 🔥 ADJUST STOCK
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();

    try {
      const newStock =
        Number(selectedItem.current_stock) + Number(adjustAmount);

      const { error } = await supabase
        .from("inventory")
        .update({ current_stock: newStock })
        .eq("ingredient_id", selectedItem.ingredient_id);

      if (error) throw error;

      setShowAdjustModal(false);
      setAdjustAmount("");
      setSelectedItem(null);
      fetchInventory();
    } catch (err) {
      alert("Error adjusting stock");
    }
  };

  const filteredInventory = inventory.filter((i) =>
    i.ingredient_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Inventory Management
        </h1>

        <div className="flex space-x-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center space-x-2 transition-colors shadow-md shadow-blue-200"
          >
            <Plus size={20} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-bold text-gray-600">ID</th>
              <th className="p-4 font-bold text-gray-600">
                Ingredient Name
              </th>
              <th className="p-4 font-bold text-gray-600">
                Current Stock
              </th>
              <th className="p-4 font-bold text-gray-600">Unit</th>
              <th className="p-4 font-bold text-gray-600 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredInventory.map((item) => (
              <tr
                key={item.ingredient_id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="p-4 font-medium text-gray-800">
                  #{item.ingredient_id}
                </td>
                <td className="p-4 font-medium text-gray-800">
                  {item.ingredient_name}
                </td>
                <td className="p-4">
                  <span
                    className={`font-bold ${
                      item.current_stock <= 10
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {item.current_stock}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{item.unit}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setShowAdjustModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center"
                  >
                    <Edit2 size={20} />
                  </button>
                </td>
              </tr>
            ))}

            {filteredInventory.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No ingredients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-2xl font-bold">Add Ingredient</h2>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <input
                required
                placeholder="Name"
                value={formData.ingredient_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ingredient_name: e.target.value
                  })
                }
                className="w-full p-3 border rounded-xl"
              />

              <input
                required
                placeholder="Unit"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full p-3 border rounded-xl"
              />

              <input
                required
                type="number"
                placeholder="Stock"
                value={formData.current_stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    current_stock: e.target.value
                  })
                }
                className="w-full p-3 border rounded-xl"
              />

              <button className="w-full bg-blue-600 text-white py-3 rounded-xl">
                Save
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST MODAL */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-2xl font-bold">
                Adjust Stock
              </h2>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <input
                required
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full p-3 border rounded-xl"
                placeholder="e.g. +10 or -5"
              />

              <button className="w-full bg-blue-600 text-white py-3 rounded-xl">
                Update
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;