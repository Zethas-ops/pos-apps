import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { supabase } from "../src/supabase";

function Settings() {
  const [profile, setProfile] = useState({
    store_name: "",
    address: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error(error);
    }

    if (data) {
      setProfile(data);
    }

    setLoading(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setLoading(true);

    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .limit(1)
      .single();

    let error;

    if (existing) {
      // UPDATE
      const res = await supabase
        .from("settings")
        .update({
          ...profile,
          updated_at: new Date(),
        })
        .eq("id", existing.id);

      error = res.error;
    } else {
      // INSERT (first time)
      const res = await supabase.from("settings").insert([
        {
          ...profile,
          updated_at: new Date(),
        },
      ]);

      error = res.error;
    }

    setLoading(false);

    if (error) {
      alert("Error updating profile");
      console.error(error);
    } else {
      alert("Store profile updated successfully");
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Store Profile</h2>
          <p className="text-sm text-gray-500 mt-1">
            This information will appear on printed receipts.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
          <input
            required
            type="text"
            placeholder="Store Name"
            value={profile.store_name}
            onChange={(e) =>
              setProfile({ ...profile, store_name: e.target.value })
            }
            className="w-full p-3 rounded-xl border"
          />

          <textarea
            required
            placeholder="Address"
            value={profile.address}
            onChange={(e) =>
              setProfile({ ...profile, address: e.target.value })
            }
            className="w-full p-3 rounded-xl border"
          />

          <input
            required
            type="text"
            placeholder="Phone"
            value={profile.phone}
            onChange={(e) =>
              setProfile({ ...profile, phone: e.target.value })
            }
            className="w-full p-3 rounded-xl border"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;