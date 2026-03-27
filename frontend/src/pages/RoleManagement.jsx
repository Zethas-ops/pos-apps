import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Shield, CheckSquare, Square } from "lucide-react";
import { supabase } from "../lib/supabase";
import bcrypt from "bcryptjs";

const AVAILABLE_FEATURES = [
  { id: 'pos', label: 'New Order (POS)' },
  { id: 'open-bills', label: 'Open Bills' },
  { id: 'history', label: 'History' },
  { id: 'menu', label: 'Menu Management' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'promo', label: 'Promotions' },
  { id: 'roles', label: 'Role Management' },
  { id: 'settings', label: 'Settings' }
];

function RoleManagement() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "USER",
    permissions: []
  });
  const [error, setError] = useState("");
  useEffect(() => {
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('id, name, username, role, permissions');
      if (error) throw error;
      setUsers(data || []);
    } catch (error2) {
      console.error("Error fetching users:", error2);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...formData };
      
      if (payload.password) {
        payload.password = bcrypt.hashSync(payload.password, 10);
      } else {
        delete payload.password;
      }

      let error;
      if (editingUser) {
        const { error: updateError } = await supabase
          .from('users')
          .update(payload)
          .eq('id', editingUser.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('users')
          .insert([payload]);
        error = insertError;
      }

      if (error) {
        setError(error.message || "Failed to save user");
      } else {
        setIsModalOpen(false);
        fetchUsers();
        resetForm();
      }
    } catch (error2) {
      setError("An error occurred while saving");
    }
  };
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        alert(error.message || "Failed to delete user");
      } else {
        fetchUsers();
      }
    } catch (error2) {
      console.error("Error deleting user:", error2);
    }
  };
  const openModal = (user) => {
    if (user) {
      setEditingUser(user);
      let perms = [];
      if (user.permissions) {
        if (typeof user.permissions === 'string') {
          try {
            perms = JSON.parse(user.permissions);
          } catch (e) {
            perms = user.permissions.split(',').map(s => s.trim());
          }
        } else if (Array.isArray(user.permissions)) {
          perms = user.permissions;
        }
      } else if (user.role === 'ADMIN') {
        perms = AVAILABLE_FEATURES.map(f => f.id);
      }
      setFormData({
        name: user.name || "",
        username: user.username,
        password: "",
        role: user.role,
        permissions: perms
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
      role: "USER",
      permissions: []
    });
  };
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
        <button
    onClick={() => openModal()}
    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
  >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name || "-"}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"}`}>
                    {user.role === "ADMIN" && <Shield className="w-3 h-3 mr-1" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
    onClick={() => openModal(user)}
    className="text-indigo-600 hover:text-indigo-900 mr-4"
  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
    onClick={() => handleDelete(user.id)}
    className="text-red-600 hover:text-red-900"
  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>

      {isModalOpen && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? "Edit User" : "Add New User"}
            </h2>
            
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
    type="text"
    required
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
    placeholder="Full Name"
  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
    type="text"
    required
    value={formData.username}
    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser && <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>}
                </label>
                <input
    type="password"
    required={!editingUser}
    value={formData.password}
    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
    value={formData.role}
    onChange={(e) => {
      const newRole = e.target.value;
      setFormData({ 
        ...formData, 
        role: newRole,
        permissions: newRole === 'ADMIN' ? AVAILABLE_FEATURES.map(f => f.id) : []
      });
    }}
    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
  >
                  <option value="USER">User (Cashier)</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feature Access</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_FEATURES.map((feature) => {
                    const currentPerms = Array.isArray(formData.permissions) ? formData.permissions : [];
                    const isChecked = currentPerms.includes(feature.id);
                    return (
                      <div 
                        key={feature.id}
                        className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200"
                        onClick={() => {
                          const newPerms = isChecked 
                            ? currentPerms.filter(p => p !== feature.id)
                            : [...currentPerms, feature.id];
                          setFormData({ ...formData, permissions: newPerms });
                        }}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-700">{feature.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
    type="button"
    onClick={() => setIsModalOpen(false)}
    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
  >
                  Cancel
                </button>
                <button
    type="submit"
    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
  >
                  {editingUser ? "Save Changes" : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>}
    </div>;
}
export {
  RoleManagement as default
};
