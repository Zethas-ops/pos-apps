import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import supabase from "../supabase";

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

  // 🔹 FETCH DATA
  const fetchProfile = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("store_profile")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("Fetch error:", error);
    }

    if (data) {
      setProfile({
        store_name: data.store_name || "",
        address: data.address || "",
        phone: data.phone || "",
      });
    }

    setLoading(false);
  };

  // 🔹 SAVE DATA (UPSERT)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("store_profile").upsert(
      {
        id: 1, // wajib karena constraint DB
        ...profile,
        // updated_at: new Date(), // aktifkan kalau kolom ada
      },
      { onConflict: "id" }
    );

    setLoading(false);

    if (error) {
      console.error("Save error:", error);
      alert("Error updating profile");
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
          {/* Store Name */}
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

          {/* Address */}
          <textarea
            required
            placeholder="Address"
            value={profile.address}
            onChange={(e) =>
              setProfile({ ...profile, address: e.target.value })
            }
            className="w-full p-3 rounded-xl border"
          />

          {/* Phone */}
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

          {/* Button */}
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