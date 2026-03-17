import { useEffect, useState } from "react";
import { Plus, Search, Edit2 } from "lucide-react";
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
  const fetchInventory = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/inventory", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setInventory(data);
  };
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed to add");
      setShowAddModal(false);
      setFormData({ ingredient_name: "", unit: "", current_stock: "" });
      fetchInventory();
    } catch (err) {
      alert("Error adding ingredient");
    }
  };
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/inventory/${selectedItem.ingredient_id}/adjust`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: adjustAmount })
      });
      if (!res.ok) throw new Error("Failed to adjust");
      setShowAdjustModal(false);
      setAdjustAmount("");
      setSelectedItem(null);
      fetchInventory();
    } catch (err) {
      alert("Error adjusting stock");
    }
  };
  const filteredInventory = inventory.filter(
    (i) => i.ingredient_name.toLowerCase().includes(search.toLowerCase())
  );
  return <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
              <th className="p-4 font-bold text-gray-600">Ingredient Name</th>
              <th className="p-4 font-bold text-gray-600">Current Stock</th>
              <th className="p-4 font-bold text-gray-600">Unit</th>
              <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item) => <tr key={item.ingredient_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-800">#{item.ingredient_id}</td>
                <td className="p-4 font-medium text-gray-800">{item.ingredient_name}</td>
                <td className="p-4">
                  <span className={`font-bold ${item.current_stock <= 10 ? "text-red-600" : "text-green-600"}`}>
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
    title="Adjust Stock"
  >
                    <Edit2 size={20} />
                  </button>
                </td>
              </tr>)}
            {filteredInventory.length === 0 && <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No ingredients found.
                </td>
              </tr>}
          </tbody>
        </table>
      </div>

      {
    /* Add Modal */
  }
      {showAddModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-800">Add Ingredient</h2>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Name *</label>
                <input
    required
    type="text"
    value={formData.ingredient_name}
    onChange={(e) => setFormData({ ...formData, ingredient_name: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Unit (e.g., kg, ml, pcs) *</label>
                <input
    required
    type="text"
    value={formData.unit}
    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Initial Stock *</label>
                <input
    required
    type="number"
    value={formData.current_stock}
    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
    type="button"
    onClick={() => setShowAddModal(false)}
    className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
  >
                  Cancel
                </button>
                <button
    type="submit"
    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-200"
  >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>}

      {
    /* Adjust Modal */
  }
      {showAdjustModal && selectedItem && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-800">Adjust Stock: {selectedItem.ingredient_name}</h2>
            </div>
            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Adjustment Amount (can be negative) *</label>
                <div className="relative">
                  <input
    required
    type="number"
    value={adjustAmount}
    onChange={(e) => setAdjustAmount(e.target.value)}
    className="w-full p-3 pr-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g., 10 or -5"
  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    {selectedItem.unit}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Current Stock: <span className="font-bold">{selectedItem.current_stock} {selectedItem.unit}</span>
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
    type="button"
    onClick={() => {
      setShowAdjustModal(false);
      setAdjustAmount("");
    }}
    className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
  >
                  Cancel
                </button>
                <button
    type="submit"
    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-200"
  >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>}
    </div>;
}
export {
  Inventory as default
};
