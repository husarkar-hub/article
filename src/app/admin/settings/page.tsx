// app/admin/settings/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // For navigation

// Import Shadcn UI components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // If roles needed

// --- Dummy Data ---
const dummyAdmins = [
  {
    id: "admin-1",
    username: "alice_admin",
    email: "alice@example.com",
    role: "Super Admin",
    status: "Active",
  },
  {
    id: "admin-2",
    username: "bob_editor",
    email: "bob@example.com",
    role: "Editor",
    status: "Active",
  },
  {
    id: "admin-3",
    username: "charlie_viewer",
    email: "charlie@example.com",
    role: "Viewer",
    status: "Inactive",
  },
];

const dummyCurrentUser = {
  id: "admin-1",
  username: "alice_admin",
  email: "alice@example.com",
  role: "Super Admin",
};

// --- Add New Admin Form Component ---
const AddAdminForm = ({ onAdminAdded }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Editor"); // Default role

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match."); // Using alert as a fallback
      return;
    }
    if (!username || !email || !password || !role) {
      alert("All fields are required."); // Using alert as fallback
      return;
    }

    const newAdminData = { username, email, password, role };
    console.log("Adding new admin:", newAdminData);

    try {
      // --- Replace with your API call ---
      const addedAdmin = {
        ...newAdminData,
        id: `admin-${Date.now()}`,
        status: "Active",
      };
      alert(`Admin "${username}" added successfully.`); // Using alert as a fallback

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("Editor"); // Reset role
      onAdminAdded(addedAdmin); // Callback to refresh list in parent
    } catch (error: any) {
      console.error("Error adding admin:", error);
      alert(error.message || "Could not add admin."); // Using alert as fallback
    }
  };

  return (
    <Card className="mb-8 shadow-sm">
      <CardHeader>
        <CardTitle>Add New Admin</CardTitle>
        <CardDescription>
          Enter details for the new administrator account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <Label htmlFor="admin-username">Username</Label>
            <Input
              id="admin-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="admin-confirm-password">Confirm Password</Label>
            <Input
              id="admin-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="admin-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Super Admin">Super Admin</SelectItem>
                <SelectItem value="Editor">Editor</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Add Admin</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// --- Admin List Table Component ---
const AdminListTable = ({ admins, onAdminStatusChange }) => {
  const handleDelete = (adminId: string, username: string) => {
    if (
      confirm(
        `Are you sure you want to delete admin "${username}"? This action cannot be undone.`
      )
    ) {
      console.log(`Deleting admin ${adminId}`);
      alert(`Admin "${username}" has been removed.`); // Using alert as fallback
      onAdminStatusChange(); // Trigger parent to refresh list
    }
  };

  const handleStatusToggle = (adminId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    console.log(`Toggling status for admin ${adminId} to ${newStatus}`);
    alert(`Admin status for ${adminId} changed to ${newStatus}.`); // Using alert as fallback
    onAdminStatusChange(); // Trigger parent to refresh list
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Existing Admins</CardTitle>
        <CardDescription>Manage administrator accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>List of all administrator accounts.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">{admin.username}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{admin.role}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusToggle(admin.id, admin.status)}
                    className={`hover:bg-transparent ${
                      admin.status === "Active"
                        ? "text-green-500 hover:text-green-600"
                        : "text-red-500 hover:text-red-600"
                    }`}
                  >
                    {admin.status}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(admin.id, admin.username)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// --- Change Own Password Form Component ---
const ChangePasswordForm = ({ currentUser }: { currentUser: any }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert("All fields are required."); // Using alert as fallback
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert("New passwords do not match."); // Using alert as fallback
      return;
    }
    if (newPassword.length < 6) {
      // Basic password strength check
      alert("Password must be at least 6 characters long."); // Using alert as fallback
      return;
    }

    const passwordChangeData = {
      userId: currentUser.id,
      currentPassword,
      newPassword,
    };
    console.log(
      "Changing password for:",
      currentUser.username,
      passwordChangeData
    );

    try {
      // --- Replace with your API call ---
      alert(`Your password has been updated.`); // Using alert as fallback
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      alert(error.message || "Could not change password."); // Using alert as fallback
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Change Your Password</CardTitle>
        <CardDescription>
          Update your account security settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="confirm-new-password">Confirm New Password</Label>
            <Input
              id="confirm-new-password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Update Password</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// --- Settings Page Component ---
const SettingsPage = () => {
  const [admins, setAdmins] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // In a real app, fetch from your backend API
    setAdmins(dummyAdmins);
    setCurrentUser(dummyCurrentUser);
  }, []);

  const handleAdminAdded = (newAdmin) => {
    setAdmins((prevAdmins) => [...prevAdmins, newAdmin]);
  };

  const handleAdminStatusChange = () => {
    console.log("Refreshing admin list...");
    setAdmins(dummyAdmins); // Simulate refresh
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="admin-management" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="admin-management">Admin Management</TabsTrigger>
          <TabsTrigger value="security">Security & Profile</TabsTrigger>
        </TabsList>{" "}
        {/* <-- This was the corrected placement */}
        <TabsContent value="admin-management">
          <AddAdminForm onAdminAdded={handleAdminAdded} />
          <AdminListTable
            admins={admins}
            onAdminStatusChange={handleAdminStatusChange}
          />
        </TabsContent>
        <TabsContent value="security">
          {currentUser && <ChangePasswordForm currentUser={currentUser} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
