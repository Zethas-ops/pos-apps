import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Check } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function PaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({ name: "", is_active: true });

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('id');
      if (error && error.code !== '42P01') throw error; // limit error if table not yet migrated
      if (data) setMethods(data);
    } catch (err) {
      console.error("Error fetching payment methods:", err);
    }
  };

  const handleOpenModal = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({ name: method.name, is_active: method.is_active });
    } else {
      setEditingMethod(null);
      setFormData({ name: "", is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Check for uniqueness
      const existing = methods.find(
        (m) => m.name.toLowerCase() === formData.name.trim().toLowerCase() && 
        (!editingMethod || m.id !== editingMethod.id)
      );
      if (existing) {
        alert("Nama metode pembayaran sudah terpakai.");
        return;
      }

      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update({ ...formData, name: formData.name.trim() })
          .eq('id', editingMethod.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert([{ ...formData, name: formData.name.trim() }]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchMethods();
    } catch (err) {
      if (err.message === "Failed to fetch" || (err.message && err.message.includes("fetch"))) {
        alert("Error saving payment method: Failed to connect to database. Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correctly set.");
      } else {
        alert("Error saving payment method: " + err.message);
      }
    }
  };

    const [deleteId, setDeleteId] = useState(null);

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', deleteId);
      if (error) throw error;
      fetchMethods();
      setDeleteId(null);
    } catch (err) {
      alert("Error deleting payment method: " + err.message);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      fetchMethods();
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Payment Methods</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center space-x-2 transition-colors shadow-md shadow-blue-200"
        >
          <Plus size={20} />
          <span>Tambah Metode Pembayaran</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-200 border-b border-gray-200 dark:bg-gray-600">
              <th className="p-4 font-bold text-gray-700 dark:text-gray-300">Name</th>
              <th className="p-4 font-bold text-gray-700 dark:text-gray-300 text-center">Status</th>
              <th className="p-4 font-bold text-gray-700 dark:text-gray-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {methods.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-gray-500">
                  No payment methods configured. (Did you run the SQL migration?)
                </td>
              </tr>
            ) : (
              methods.map((method) => (
                <tr key={method.id} className="border-b border-gray-100 hover:bg-gray-200 dark:hover:bg-gray-900 transition-colors">
                  <td className="p-4 font-semibold text-gray-800 dark:text-gray-300">{method.name}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleStatus(method.id, method.is_active)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        method.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {method.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(method)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(method.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                {editingMethod ? "Edit Method" : "Add Method"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Method Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., GoPay, OVO, Cash"
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center space-x-3">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${formData.is_active ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.is_active ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-gray-700 font-bold">Active</div>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-600 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-m shadow-blue-200"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
            
      {deleteId && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gray-50 dark:bg-gray-900">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Confirm Deletion</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300">Are you sure you want to delete this payment method? This action cannot be undone.</p>
            </div>
            <div className="p-6 border-t bg-gray-50 dark:bg-gray-900 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-6 py-3 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-600 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>}

    </div>
  );
}
