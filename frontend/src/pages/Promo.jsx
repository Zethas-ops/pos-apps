import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Power } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";

function Promo() {
  const [promos, setPromos] = useState([]);
  const [menu, setMenu] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "DISCOUNT",
    discount_percent: "",
    discount_amount: "",
    min_buy_qty: "",
    free_qty: "",
    min_buy_menu_id: "",
    free_menu_id: "",
    min_nominal: "",
    promo_rule: "",
    start_date: "",
    end_date: "",
    day_filter: "All Days",
    time_filter: "All Day",
    custom_start_time: "",
    custom_end_time: ""
  });
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const [promoRes, menuRes] = await Promise.all([
        supabase.from('promos').select('*').order('promo_id', { ascending: false }),
        supabase.from('menu').select('*')
      ]);
      
      if (promoRes.error) throw promoRes.error;
      if (menuRes.error) throw menuRes.error;
      
      setPromos(promoRes.data || []);
      setMenu(menuRes.data || []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.time_filter === "Custom Time") {
        if (!payload.custom_start_time || !payload.custom_end_time) {
          alert("Please specify both start and end time for Custom Time filter.");
          return;
        }
        payload.time_filter = `Custom Time (${payload.custom_start_time} - ${payload.custom_end_time})`;
      }
      
      // Clean up empty strings to null for numeric fields
      const numericFields = ['discount_percent', 'discount_amount', 'min_buy_qty', 'free_qty', 'min_buy_menu_id', 'free_menu_id', 'min_nominal'];
      numericFields.forEach(field => {
        if (payload[field] === "") {
          payload[field] = null;
        }
      });
      
      // Remove custom time fields as they are not in the database schema
      delete payload.custom_start_time;
      delete payload.custom_end_time;

      if (editId) {
        const { error } = await supabase
          .from('promos')
          .update(payload)
          .eq('promo_id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promos')
          .insert([payload]);
        if (error) throw error;
      }
      
      setShowModal(false);
      setEditId(null);
      setFormData({
        title: "",
        type: "DISCOUNT",
        discount_percent: "",
        discount_amount: "",
        min_buy_qty: "",
        free_qty: "",
        min_buy_menu_id: "",
        free_menu_id: "",
        min_nominal: "",
        promo_rule: "",
        start_date: "",
        end_date: "",
        day_filter: "All Days",
        time_filter: "All Day",
        custom_start_time: "",
        custom_end_time: ""
      });
      fetchData();
    } catch (err) {
      alert("Error saving promo: " + err.message);
    }
  };
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from('promos')
        .delete()
        .eq('promo_id', deleteId);
      if (error) throw error;
      setDeleteId(null);
      fetchData();
    } catch (err) {
      alert("Error deleting promo: " + err.message);
    }
  };
  const handleToggle = async (id) => {
    try {
      const promo = promos.find(p => p.promo_id === id);
      if (!promo) return;
      
      const { error } = await supabase
        .from('promos')
        .update({ is_active: promo.is_active === 1 ? 0 : 1 })
        .eq('promo_id', id);
        
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Error toggling promo: " + err.message);
    }
  };
  const handleEdit = (promo) => {
    setEditId(promo.promo_id);
    const isCustomTime = promo.time_filter?.startsWith("Custom Time");
    let customStart = "";
    let customEnd = "";
    if (isCustomTime) {
      const match = promo.time_filter.match(/Custom Time \((\d{2}:\d{2}) - (\d{2}:\d{2})\)/);
      if (match) {
        customStart = match[1];
        customEnd = match[2];
      }
    }
    setFormData({
      title: promo.title,
      type: promo.type,
      discount_percent: promo.discount_percent || "",
      discount_amount: promo.discount_amount || "",
      min_buy_qty: promo.min_buy_qty || "",
      free_qty: promo.free_qty || "",
      min_buy_menu_id: promo.min_buy_menu_id || "",
      free_menu_id: promo.free_menu_id || "",
      min_nominal: promo.min_nominal || "",
      promo_rule: promo.promo_rule || "",
      start_date: promo.start_date,
      end_date: promo.end_date,
      day_filter: promo.day_filter || "All Days",
      time_filter: isCustomTime ? "Custom Time" : promo.time_filter || "All Day",
      custom_start_time: customStart,
      custom_end_time: customEnd
    });
    setShowModal(true);
  };
  return <div className="p-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Promo & Discounts</h1>
        <button
    onClick={() => {
      setEditId(null);
      setFormData({
        title: "",
        type: "DISCOUNT",
        discount_percent: "",
        discount_amount: "",
        min_buy_qty: "",
        free_qty: "",
        min_buy_menu_id: "",
        free_menu_id: "",
        min_nominal: "",
        promo_rule: "",
        start_date: "",
        end_date: "",
        day_filter: "All Days",
        time_filter: "All Day"
      });
      setShowModal(true);
    }}
    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-md shadow-blue-200 w-full sm:w-auto"
  >
          <Plus size={20} />
          <span>Create Promo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promos.map((promo) => <div key={promo.promo_id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative ${!promo.is_active ? "opacity-60" : ""}`}>
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${promo.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                {promo.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-bold text-gray-800 text-xl mb-2 pr-24">{promo.title}</h3>
              <p className="text-sm font-bold text-blue-600 mb-4">{promo.type.replace(/_/g, " ")}</p>
              
              <div className="space-y-3 mt-4 flex-1">
                {promo.type === "DISCOUNT" ? <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-sm text-gray-500 font-medium block mb-1">Discount</span>
                    <span className="text-2xl font-black text-green-600">{promo.discount_percent}% OFF</span>
                  </div> : promo.type === "MIN_BUY_FREE" ? <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-sm text-gray-500 font-medium block mb-1">Buy X Get Y Free</span>
                    <span className="font-bold text-gray-800">
                      Buy {promo.min_buy_qty} {menu.find((m) => m.menu_id === promo.min_buy_menu_id)?.name || "Item"}, 
                      Get {promo.free_qty} {menu.find((m) => m.menu_id === promo.free_menu_id)?.name || "Item"} Free
                    </span>
                  </div> : promo.type === "MIN_BUY_DISCOUNT" ? <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-sm text-gray-500 font-medium block mb-1">Buy X Get Discount</span>
                    <span className="font-bold text-gray-800">Buy {promo.min_buy_qty}, Get Rp {promo.discount_amount?.toLocaleString()} OFF</span>
                  </div> : promo.type === "MIN_NOMINAL_FREE" ? <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-sm text-gray-500 font-medium block mb-1">Min. Nominal Get Free/Discount</span>
                    <span className="font-bold text-gray-800">
                      Min. Rp {promo.min_nominal?.toLocaleString()}, 
                      Get {promo.free_menu_id ? `Free ${menu.find((m) => m.menu_id === promo.free_menu_id)?.name}` : promo.discount_percent ? `${promo.discount_percent}% OFF` : `Rp ${promo.discount_amount?.toLocaleString()} OFF`}
                    </span>
                  </div> : <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-sm text-gray-500 font-medium block mb-1">Rule</span>
                    <span className="font-bold text-gray-800">{promo.promo_rule}</span>
                  </div>}

                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Valid:</span> {format(new Date(promo.start_date), "dd MMM yyyy")} - {format(new Date(promo.end_date), "dd MMM yyyy")}</p>
                  {promo.day_filter && <p><span className="font-medium">Days:</span> {promo.day_filter}</p>}
                  {promo.time_filter && <p><span className="font-medium">Time:</span> {promo.time_filter}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 mt-4">
                <button
    onClick={() => handleToggle(promo.promo_id)}
    className={`p-2 rounded-lg transition-colors ${promo.is_active ? "text-orange-500 hover:bg-orange-50" : "text-green-500 hover:bg-green-50"}`}
    title={promo.is_active ? "Deactivate" : "Activate"}
  >
                  <Power size={20} />
                </button>
                <button
    onClick={() => handleEdit(promo)}
    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
    title="Edit"
  >
                  <Edit size={20} />
                </button>
                <button
    onClick={() => setDeleteId(promo.promo_id)}
    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
    title="Delete"
  >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>)}
      </div>

      {
    /* Add Modal */
  }
      {showModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-800">Create Promotion</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Title *</label>
                  <input
    required
    type="text"
    value={formData.title}
    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g., Weekend Special"
  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Type *</label>
                  <select
    required
    value={formData.type}
    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  >
                    <option value="DISCOUNT">Discount Percentage</option>
                    <option value="MIN_BUY_FREE">Minimum Buy X Free Y</option>
                    <option value="MIN_BUY_DISCOUNT">Minimum Buy X Discount Y</option>
                    <option value="MIN_NOMINAL_FREE">Minimum Nominal Free/Discount</option>
                    <option value="PROMO">Custom Rule (e.g., Buy 1 Get 1)</option>
                  </select>
                </div>
              </div>

              {formData.type === "DISCOUNT" ? <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Discount Percentage (%) *</label>
                  <input
    required
    type="number"
    min="1"
    max="100"
    value={formData.discount_percent}
    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g., 15"
  />
                </div> : formData.type === "MIN_BUY_FREE" ? <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Buy Menu *</label>
                    <select
    required
    value={formData.min_buy_menu_id}
    onChange={(e) => setFormData({ ...formData, min_buy_menu_id: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  >
                      <option value="">Select Menu</option>
                      {menu.map((m) => <option key={m.menu_id} value={m.menu_id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Buy Qty *</label>
                    <input
    required
    type="number"
    min="1"
    value={formData.min_buy_qty}
    onChange={(e) => setFormData({ ...formData, min_buy_qty: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g., 2"
  />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Free Menu *</label>
                    <select
    required
    value={formData.free_menu_id}
    onChange={(e) => setFormData({ ...formData, free_menu_id: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  >
                      <option value="">Select Menu</option>
                      {menu.map((m) => <option key={m.menu_id} value={m.menu_id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Free Qty *</label>
                    <input
    required
    type="number"
    min="1"
    value={formData.free_qty}
    onChange={(e) => setFormData({ ...formData, free_qty: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g., 1"
  />
                  </div>
                </div> : formData.type === "MIN_BUY_DISCOUNT" ? <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Minimum Buy Qty *</label>
                    <input
    required
    type="number"
    min="1"
    value={formData.min_buy_qty}
    onChange={(e) => setFormData({ ...formData, min_buy_qty: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g., 2"
  />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Discount Amount (Rp) *</label>
                    <input
    required
    type="number"
    min="1"
    value={formData.discount_amount}
    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g., 10000"
  />
                  </div>
                </div> : formData.type === "MIN_NOMINAL_FREE" ? <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Minimum Nominal (Rp) *</label>
                    <input
    required
    type="number"
    min="1"
    value={formData.min_nominal}
    onChange={(e) => setFormData({ ...formData, min_nominal: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g., 50000"
  />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Free Menu (Optional)</label>
                    <select
    value={formData.free_menu_id}
    onChange={(e) => setFormData({ ...formData, free_menu_id: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  >
                      <option value="">None</option>
                      {menu.map((m) => <option key={m.menu_id} value={m.menu_id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">OR Discount Amount (Optional)</label>
                    <input
    type="number"
    min="1"
    value={formData.discount_amount}
    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value, discount_percent: "" })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g., 10000"
  />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">OR Discount Percentage (%)</label>
                    <input
    type="number"
    min="1"
    max="100"
    value={formData.discount_percent}
    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value, discount_amount: "" })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g., 15"
  />
                  </div>
                </div> : <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Promotion Rule *</label>
                  <input
    required
    type="text"
    value={formData.promo_rule}
    onChange={(e) => setFormData({ ...formData, promo_rule: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="e.g., Buy 1 Get 1 Free Kopi Susu"
  />
                </div>}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Start Date *</label>
                  <input
    required
    type="date"
    value={formData.start_date}
    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">End Date *</label>
                  <input
    required
    type="date"
    value={formData.end_date}
    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Day Filter</label>
                  <select
    value={formData.day_filter}
    onChange={(e) => setFormData({ ...formData, day_filter: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  >
                    <option value="All Days">All Days</option>
                    <option value="Weekdays">Weekdays</option>
                    <option value="Weekends">Weekends</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Time Filter</label>
                  <select
    value={formData.time_filter}
    onChange={(e) => setFormData({ ...formData, time_filter: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  >
                    <option value="All Day">All Day</option>
                    <option value="Morning (06:00 - 12:00)">Morning (06:00 - 12:00)</option>
                    <option value="Afternoon (12:00 - 18:00)">Afternoon (12:00 - 18:00)</option>
                    <option value="Evening (18:00 - 24:00)">Evening (18:00 - 24:00)</option>
                    <option value="Custom Time">Custom Time</option>
                  </select>
                </div>
              </div>

              {formData.time_filter === "Custom Time" && <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Time *</label>
                    <input
    required
    type="time"
    value={formData.custom_start_time}
    onChange={(e) => setFormData({ ...formData, custom_start_time: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">End Time *</label>
                    <input
    required
    type="time"
    value={formData.custom_end_time}
    onChange={(e) => setFormData({ ...formData, custom_end_time: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  />
                  </div>
                </div>}

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
    type="button"
    onClick={() => setShowModal(false)}
    className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
  >
                  Cancel
                </button>
                <button
    type="submit"
    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-200"
  >
                  Save Promotion
                </button>
              </div>
            </form>
          </div>
        </div>}

      {
    /* Delete Confirmation Modal */
  }
      {deleteId && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-800">Confirm Deletion</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600">Are you sure you want to delete this promotion? This action cannot be undone.</p>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
    onClick={() => setDeleteId(null)}
    className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
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
    </div>;
}
export {
  Promo as default
};
