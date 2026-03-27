import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { supabase } from "../lib/supabase";

function Settings() {
  const [profile, setProfile] = useState({
    id: 1,
    store_name: "",
    address: "",
    phone: ""
  });
  useEffect(() => {
    fetchProfile();
  }, []);
  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('store_profile')
        .select('*')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      if (data) setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('store_profile')
        .upsert({
          id: profile.id || 1,
          store_name: profile.store_name,
          address: profile.address,
          phone: profile.phone
        }, { onConflict: 'id' });
        
      if (error) throw error;
      alert("Store profile updated successfully");
    } catch (err) {
      alert("Error updating profile: " + err.message);
    }
  };
  return <div className="p-8 space-y-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Store Profile</h2>
          <p className="text-sm text-gray-500 mt-1">This information will appear on printed receipts.</p>
        </div>
        <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Store Name *</label>
            <input
    required
    type="text"
    value={profile.store_name}
    onChange={(e) => setProfile({ ...profile, store_name: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Address *</label>
            <textarea
    required
    rows={3}
    value={profile.address}
    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
  />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
            <input
    required
    type="text"
    value={profile.phone}
    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
  />
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
    type="submit"
    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center space-x-2 transition-colors shadow-md shadow-blue-200"
  >
              <Save size={20} />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>;
}
export {
  Settings as default
};
