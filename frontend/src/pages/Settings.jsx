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
  const [ppnSetting, setPpnSetting] = useState({
    value: "11",
    isActive: true
  });

  useEffect(() => {
    fetchProfile();
    fetchPpnSetting();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('store_profile')
        .select('*')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchPpnSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('setting_key', 'PPN')
        .single();
        
      if (!error && data) {
        setPpnSetting({
          value: data.setting_value,
          isActive: data.is_active
        });
      }
    } catch (err) {
      console.error("Error fetching PPN setting:", err);
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
        
      const { error: ppnError } = await supabase
        .from('settings')
        .upsert({
          setting_key: 'PPN',
          setting_value: ppnSetting.value,
          is_active: ppnSetting.isActive
        }, { onConflict: 'setting_key' });
        
      if (error) throw error;
      if (ppnError) throw ppnError;
      alert("Settings updated successfully");
    } catch (err) {
      if (err.message === "Failed to fetch" || (err.message && err.message.includes("fetch"))) {
        alert("Error updating settings: Failed to connect to database. Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correctly set.");
      } else {
        alert("Error updating settings: " + err.message);
      }
    }
  };
  return <div className="p-8 space-y-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>

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
          
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Tax Settings</h3>
            <div className="flex items-center space-x-6">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={ppnSetting.isActive}
                    onChange={(e) => setPpnSetting({ ...ppnSetting, isActive: e.target.checked })}
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${ppnSetting.isActive ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${ppnSetting.isActive ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div className="ml-3 text-gray-700 font-medium">Enable PPN</div>
              </label>
              
              {ppnSetting.isActive && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-bold text-gray-700">PPN Rate (%)</label>
                  <input
                    type="number"
                    value={ppnSetting.value}
                    onChange={(e) => setPpnSetting({ ...ppnSetting, value: e.target.value })}
                    className="w-20 p-2 text-center rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}
            </div>
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
