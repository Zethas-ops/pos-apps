import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Shield, CheckSquare, Square } from "lucide-react";
import supabase from "../supabase";

const AVAILABLE_FEATURES = [
  { id: "pos", label: "New Order (POS)" },
  { id: "open-bills", label: "Open Bills" },
  { id: "history", label: "History" },
  { id: "menu", label: "Menu Management" },
  { id: "inventory", label: "Inventory" },
  { id: "promo", label: "Promotions" },
  { id: "roles", label: "Role Management" },
  { id: "settings", label: "Settings" },
];

function RoleManagement() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "user",
    permissions: ["pos", "open-bills", "history"],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ GET USERS (SUPABASE)
  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      console.error(error);
      return;
    }

    setUsers(data);
  };

  // ✅ ADD / UPDATE USER
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (editingUser) {
        // UPDATE
        const { error } = await supabase
          .from("users")
          .update({
            name: formData.name,
            username: formData.username,
            role: formData.role.toLowerCase(),
            permissions: formData.permissions,
            ...(formData.password && { password: formData.password }),
          })
          .eq("id", editingUser.id);

        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase.from("users").insert([
          {
            name: formData.name,
            username: formData.username,
            password: formData.password,
            role: formData.role.toLowerCase(),
            permissions: formData.permissions,
          },
        ]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchUsers();
      resetForm();
    } catch (err) {
      setError(err.message || "Gagal menyimpan user");
    }
  };

  // ✅ DELETE
  const handleDelete = async (id) => {
    if (!confirm("Yakin hapus user?")) return;

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchUsers();
  };

  const openModal = (user) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || "",
        username: user.username,
        password: "",
        role: user.role,
        permissions:
          user.permissions ||
          (user.role === "admin"
            ? AVAILABLE_FEATURES.map((f) => f.id)
            : ["pos", "open-bills", "history"]),
      });
    } else {
      resetForm();
    }

    setError("");
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      username: "",
      password: "",
      role: "user",
      permissions: ["pos", "open-bills", "history"],
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex gap-2"
        >
          <Plus size={18} /> Add User
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th>Username</th>
              <th>Role</th>
              <th className="text-right pr-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const isAdmin = user.role === "admin";

              return (
                <tr key={user.id} className="border-t">
                  <td className="p-3">{user.name || "-"}</td>
                  <td>{user.username}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        isAdmin
                          ? "bg-purple-100 text-purple-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {isAdmin && <Shield size={12} className="inline mr-1" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="text-right pr-4">
                    <button
                      onClick={() => openModal(user)}
                      className="mr-3 text-indigo-600"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              {editingUser ? "Edit User" : "Add User"}
            </h2>

            {error && (
              <div className="bg-red-100 text-red-600 p-2 mb-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                placeholder="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              <input
                placeholder="Username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full border p-2 rounded"
              />

              <select
                value={formData.role}
                onChange={(e) => {
                  const role = e.target.value;
                  setFormData({
                    ...formData,
                    role,
                    permissions:
                      role === "admin"
                        ? AVAILABLE_FEATURES.map((f) => f.id)
                        : ["pos", "open-bills", "history"],
                  });
                }}
                className="w-full border p-2 rounded"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              {/* PERMISSIONS */}
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_FEATURES.map((f) => {
                  const checked = formData.permissions.includes(f.id);

                  return (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => {
                        const newPerms = checked
                          ? formData.permissions.filter((p) => p !== f.id)
                          : [...formData.permissions, f.id];

                        setFormData({ ...formData, permissions: newPerms });
                      }}
                    >
                      {checked ? (
                        <CheckSquare size={18} />
                      ) : (
                        <Square size={18} />
                      )}
                      <span>{f.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button className="bg-indigo-600 text-white px-3 py-1 rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleManagement;