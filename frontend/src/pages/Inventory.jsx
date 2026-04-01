import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, Settings2 } from "lucide-react";
import { supabase } from "../lib/supabase";

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
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
    const { data, error } = await supabase.from('ingredients').select('*').order('ingredient_id', { ascending: true });
    if (!error && data) {
      setInventory(data);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ingredient_name: formData.ingredient_name,
        unit: formData.unit,
        current_stock: parseFloat(formData.current_stock) || 0
      };
      
      let error;
      if (isEditing && selectedItem) {
        const { error: updateError } = await supabase
          .from('ingredients')
          .update(payload)
          .eq('ingredient_id', selectedItem.ingredient_id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('ingredients').insert([payload]);
        error = insertError;
      }
      
      if (error) throw error;
      setShowModal(false);
      setFormData({ ingredient_name: "", unit: "", current_stock: "" });
      setIsEditing(false);
      setSelectedItem(null);
      fetchInventory();
    } catch (err) {
      alert("Error saving ingredient: " + err.message);
    }
  };
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this ingredient?")) return;
    try {
      const { error } = await supabase.from('ingredients').delete().eq('ingredient_id', id);
      if (error) throw error;
      fetchInventory();
    } catch (err) {
      alert("Error deleting ingredient: " + err.message);
    }
  };
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      const newStock = Math.max(0, parseFloat(selectedItem.current_stock) + parseFloat(adjustAmount));
      
      const { error } = await supabase
        .from('ingredients')
        .update({ current_stock: newStock })
        .eq('ingredient_id', selectedItem.ingredient_id);
        
      if (error) throw error;
      setShowAdjustModal(false);
      setAdjustAmount("");
      setSelectedItem(null);
      fetchInventory();
    } catch (err) {
      alert("Error adjusting stock: " + err.message);
    }
  };
  const filteredInventory = inventory.filter(
    (i) => i.ingredient_name.toLowerCase().includes(search.toLowerCase())
  );
  return <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
    type="text"
    placeholder="Search ingredients..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none sm:w-64"
  />
          </div>
          <button
    onClick={() => {
      setIsEditing(false);
      setSelectedItem(null);
      setFormData({ ingredient_name: "", unit: "", current_stock: "" });
      setShowModal(true);
    }}
    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-md shadow-blue-200 w-full sm:w-auto whitespace-nowrap"
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
                    {Number(item.current_stock || 0).toLocaleString()}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{item.unit}</td>
                <td className="p-4 text-right space-x-2">
                  <button
    onClick={() => {
      setSelectedItem(item);
      setShowAdjustModal(true);
    }}
    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-flex items-center"
    title="Adjust Stock"
  >
                    <Settings2 size={20} />
                  </button>
                  <button
    onClick={() => {
      setSelectedItem(item);
      setIsEditing(true);
      setFormData({
        ingredient_name: item.ingredient_name,
        unit: item.unit,
        current_stock: item.current_stock
      });
      setShowModal(true);
    }}
    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center"
    title="Edit Detail"
  >
                    <Edit2 size={20} />
                  </button>
                  <button
    onClick={() => handleDelete(item.ingredient_id)}
    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center"
    title="Delete"
  >
                    <Trash2 size={20} />
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
    /* Add/Edit Modal */
  }
      {showModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-800">{isEditing ? "Edit Ingredient" : "Add Ingredient"}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
    onClick={() => {
      setShowModal(false);
      setIsEditing(false);
      setSelectedItem(null);
    }}
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
                  Current Stock: <span className="font-bold">{Number(selectedItem.current_stock || 0).toLocaleString()} {selectedItem.unit}</span>
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
