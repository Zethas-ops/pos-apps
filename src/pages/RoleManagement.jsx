import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Shield } from "lucide-react";
function RoleManagement() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "USER"
  });
  const [error, setError] = useState("");
  useEffect(() => {
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error2) {
      console.error("Error fetching users:", error2);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("token");
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setIsModalOpen(false);
        fetchUsers();
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save user");
      }
    } catch (error2) {
      setError("An error occurred while saving");
    }
  };
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error2) {
      console.error("Error deleting user:", error2);
    }
  };
  const openModal = (user) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || "",
        username: user.username,
        password: "",
        // Don't populate password
        role: user.role
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
      role: "USER"
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
    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
  >
                  <option value="USER">User (Cashier)</option>
                  <option value="ADMIN">Admin</option>
                </select>
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
