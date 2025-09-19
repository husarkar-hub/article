// app/admin/settings/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
} from "@/components/ui/select";
import { AlertCircle, Trash2, Edit, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- Interfaces ---
interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: "SUPER_ADMIN" | "EDITOR";
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

interface CurrentUser {
  id: string;
  username: string;
  email: string;
  role: "SUPER_ADMIN" | "EDITOR";
}

// --- Add New Admin Form Component ---
const AddAdminForm = ({
  onAdminAdded,
  currentUserRole,
}: {
  onAdminAdded: (admin: AdminUser) => void;
  currentUserRole: string;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<AdminUser["role"]>("EDITOR");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only Super Admin can add users
  if (currentUserRole !== "SUPER_ADMIN") {
    return (
      <Card className="mb-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-orange-600">Access Restricted</CardTitle>
          <CardDescription>
            Only Super Administrators can add new users to the system.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (typeof window !== "undefined") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!email || !password || !role) {
        setError("Email, password, and role are required.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    } else {
      return;
    }

    setIsSubmitting(true);
    const newAdminData = { email, password, role };

    try {
      // API Call to create new admin user
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdminData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to add admin (HTTP ${response.status})`
        );
      }

      const addedAdmin: AdminUser = await response.json();

      // Reset form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("EDITOR");

      onAdminAdded(addedAdmin);

      if (typeof window !== "undefined") {
        alert(`Admin "${email}" added successfully!`);
      }
    } catch (err: any) {
      console.error("Error adding admin:", err);
      setError(err.message || "Failed to add admin. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-8 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlus className="h-5 w-5 mr-2" />
          Add New Admin User
        </CardTitle>
        <CardDescription>
          Create a new administrator account with specific role permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="Enter email address"
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
              placeholder="Enter password (min 6 chars)"
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
              placeholder="Confirm password"
            />
          </div>
          <div>
            <Label htmlFor="admin-role">Role</Label>
            <Select
              value={role}
              onValueChange={(value: AdminUser["role"]) => setRole(value)}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="EDITOR">Editor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <div className="md:col-span-2 text-red-500 text-sm flex items-center bg-red-50 p-3 rounded">
              <AlertCircle className="h-4 w-4 mr-2" /> {error}
            </div>
          )}
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Admin"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// --- Admin List Table Component ---
const AdminListTable = ({
  admins,
  onAdminStatusChange,
  onAdminDeleted,
  currentUserRole,
  currentUserId,
}: {
  admins: AdminUser[];
  onAdminStatusChange: () => void;
  onAdminDeleted: () => void;
  currentUserRole: string;
  currentUserId: string;
}) => {
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AdminUser["role"]>("EDITOR");

  const handleDelete = async (adminId: string, username: string) => {
    // Only Super Admin can delete users
    if (currentUserRole !== "SUPER_ADMIN") {
      if (typeof window !== "undefined") {
        alert("Only Super Administrators can delete users.");
      }
      return;
    }

    // Prevent self-deletion
    if (adminId === currentUserId) {
      if (typeof window !== "undefined") {
        alert("You cannot delete your own account.");
      }
      return;
    }

    if (typeof window !== "undefined") {
      if (
        !confirm(
          `Are you sure you want to delete admin "${username}"? This action cannot be undone.`
        )
      ) {
        return;
      }
    }

    try {
      const response = await fetch(`/api/admin/users/${adminId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to delete admin (HTTP ${response.status})`
        );
      }

      if (typeof window !== "undefined") {
        alert(`Admin "${username}" deleted successfully.`);
      }
      onAdminDeleted();
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      if (typeof window !== "undefined") {
        alert(error.message || "Could not delete admin.");
      }
    }
  };

  const handleStatusToggle = async (
    adminId: string,
    currentStatus: AdminUser["status"]
  ) => {
    // Only Super Admin can change status
    if (currentUserRole !== "SUPER_ADMIN") {
      if (typeof window !== "undefined") {
        alert("Only Super Administrators can change user status.");
      }
      return;
    }

    // Prevent self-deactivation
    if (adminId === currentUserId && currentStatus === "ACTIVE") {
      if (typeof window !== "undefined") {
        alert("You cannot deactivate your own account.");
      }
      return;
    }

    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      const response = await fetch(`/api/admin/users/${adminId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to update status (HTTP ${response.status})`
        );
      }

      if (typeof window !== "undefined") {
        alert(`Admin status changed to ${newStatus}.`);
      }
      onAdminStatusChange();
    } catch (error: any) {
      console.error("Error toggling admin status:", error);
      if (typeof window !== "undefined") {
        alert(error.message || "Could not update admin status.");
      }
    }
  };

  const handleRoleEdit = async (adminId: string) => {
    if (currentUserRole !== "SUPER_ADMIN") {
      if (typeof window !== "undefined") {
        alert("Only Super Administrators can change user roles.");
      }
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${adminId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to update role (HTTP ${response.status})`
        );
      }

      if (typeof window !== "undefined") {
        alert(`Role updated successfully.`);
      }
      setEditingUser(null);
      onAdminStatusChange();
    } catch (error: any) {
      console.error("Error updating role:", error);
      if (typeof window !== "undefined") {
        alert(error.message || "Could not update role.");
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-100 text-red-800";
      case "ADMIN":
        return "bg-blue-100 text-blue-800";
      case "EDITOR":
        return "bg-green-100 text-green-800";
      case "VIEWER":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Admin Users</CardTitle>
        <CardDescription>
          Manage administrator accounts and their permissions.
        </CardDescription>
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
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No admin users found.
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    {admin.username}
                    {admin.id === currentUserId && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        You
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    {editingUser === admin.id ? (
                      <div className="flex items-center space-x-2">
                        <Select
                          value={editRole}
                          onValueChange={(value: AdminUser["role"]) =>
                            setEditRole(value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SUPER_ADMIN">
                              Super Admin
                            </SelectItem>
                            <SelectItem value="EDITOR">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={() => handleRoleEdit(admin.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUser(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleBadgeColor(admin.role)}>
                          {admin.role.replace("_", " ")}
                        </Badge>
                        {currentUserRole === "SUPER_ADMIN" &&
                          admin.id !== currentUserId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingUser(admin.id);
                                setEditRole(admin.role);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusToggle(admin.id, admin.status)}
                      className={`hover:bg-transparent ${
                        admin.status === "ACTIVE"
                          ? "text-green-500 hover:text-green-600"
                          : "text-red-500 hover:text-red-600"
                      }`}
                      disabled={
                        currentUserRole !== "SUPER_ADMIN" ||
                        (admin.id === currentUserId &&
                          admin.status === "ACTIVE")
                      }
                    >
                      {admin.status}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {admin.createdAt
                      ? new Date(admin.createdAt).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {currentUserRole === "SUPER_ADMIN" &&
                        admin.id !== currentUserId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDelete(admin.id, admin.username)
                            }
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// --- Change Own Password Form Component ---
const ChangePasswordForm = ({
  currentUser,
}: {
  currentUser: CurrentUser | null;
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (typeof window !== "undefined") {
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        setError("All fields are required.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError("New passwords do not match.");
        return;
      }
      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    } else {
      return;
    }

    setIsSubmitting(true);
    const passwordChangeData = {
      currentPassword,
      newPassword,
    };

    try {
      // API Call to change password
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordChangeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to change password (HTTP ${response.status})`
        );
      }

      if (typeof window !== "undefined") {
        alert("Your password has been updated successfully!");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      console.error("Error changing password:", err);
      setError(err.message || "Failed to change password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return <p className="text-muted-foreground">Loading user profile...</p>;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your account password for enhanced security.
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
              placeholder="Enter your current password"
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
              placeholder="Enter new password (min 6 chars)"
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
              placeholder="Confirm new password"
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm flex items-center bg-red-50 p-3 rounded">
              <AlertCircle className="h-4 w-4 mr-2" /> {error}
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// --- Profile Information Component ---
const ProfileInformation = ({
  currentUser,
}: {
  currentUser: CurrentUser | null;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !email) {
      setError("Username and email are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to update profile (HTTP ${response.status})`
        );
      }

      if (typeof window !== "undefined") {
        alert("Profile updated successfully!");
      }
      setIsEditing(false);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return <p className="text-muted-foreground">Loading user profile...</p>;
  }

  return (
    <Card className="shadow-sm mb-6">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          View and update your account information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <Label htmlFor="profile-username">Username</Label>
              <Input
                id="profile-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm flex items-center bg-red-50 p-3 rounded">
                <AlertCircle className="h-4 w-4 mr-2" /> {error}
              </div>
            )}
            <div className="flex space-x-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Username</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {currentUser.username}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {currentUser.email}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Role</Label>
              <div className="mt-1">
                <Badge className={getRoleBadgeColor(currentUser.role)}>
                  {currentUser.role.replace("_", " ")}
                </Badge>
              </div>
            </div>
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function for role badge colors
const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "bg-red-100 text-red-800";
    case "EDITOR":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// --- Settings Page Component ---
const SettingsPage = () => {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // API call functions
  const fetchAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      const data: AdminUser[] = await response.json();
      setAdmins(data);
    } catch (err: any) {
      setError(err.message);
      setAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    setLoadingUser(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      const data: CurrentUser = await response.json();
      setCurrentUser(data);
    } catch (err: any) {
      setError(err.message);
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // Handlers for refreshing lists
  const handleAdminAdded = (newAdmin: AdminUser) => {
    setAdmins((prevAdmins) => [...prevAdmins, newAdmin]);
  };

  const handleAdminStatusChange = useCallback(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAdminDeleted = useCallback(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Fetch initial data
  useEffect(() => {
    if (status === "authenticated") {
      fetchAdmins();
      fetchCurrentUser();
    }
  }, [status, fetchAdmins, fetchCurrentUser]);

  // Loading and error states
  if (status === "loading" || loadingUser) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Loading settings...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  if (error && !currentUser) {
    return (
      <div className="container mx-auto py-8 text-center text-red-500">
        <p>Error loading settings: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        {currentUser && (
          <Badge className={getRoleBadgeColor(currentUser.role)}>
            {currentUser.role.replace("_", " ")}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile & Security</TabsTrigger>
          <TabsTrigger value="admin-management">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-6">
            <ProfileInformation currentUser={currentUser} />
            <ChangePasswordForm currentUser={currentUser} />
          </div>
        </TabsContent>

        <TabsContent value="admin-management">
          <div className="space-y-6">
            {loadingAdmins ? (
              <div className="text-center py-8">
                <p>Loading admin users...</p>
              </div>
            ) : (
              <>
                <AddAdminForm
                  onAdminAdded={handleAdminAdded}
                  currentUserRole={currentUser?.role || ""}
                />
                <AdminListTable
                  admins={admins}
                  onAdminStatusChange={handleAdminStatusChange}
                  onAdminDeleted={handleAdminDeleted}
                  currentUserRole={currentUser?.role || ""}
                  currentUserId={currentUser?.id || ""}
                />
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
// app/admin/settings/page.tsx

// "use client";

// import React, { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";

// // Import Shadcn UI components
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Table,
//   TableBody,
//   TableCaption,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react"; // Icons

// // --- Interfaces ---
// interface AdminUser {
//   id: string;
//   username: string;
//   email: string;
//   role: "Super Admin" | "Editor" | "Viewer"; // Matches schema enums
//   status: "Active" | "Inactive"; // Matches schema enums
//   createdAt?: string; // Optional from API
//   updatedAt?: string; // Optional from API
// }

// interface CurrentUser {
//   id: string;
//   username: string;
//   email: string;
//   role: "Super Admin" | "Editor" | "Viewer";
// }

// // --- Add New Admin Form Component ---
// const AddAdminForm = ({
//   onAdminAdded,
// }: {
//   onAdminAdded: (admin: AdminUser) => void;
// }) => {
//   const [username, setUsername] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [role, setRole] = useState<AdminUser["role"]>("Editor"); // Default role
//   const [error, setError] = useState<string | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     if (password !== confirmPassword) {
//       setError("Passwords do not match.");
//       return;
//     }
//     if (!username || !email || !password || !role) {
//       setError("All fields are required.");
//       return;
//     }

//     setIsSubmitting(true);
//     const newAdminData = { username, email, password, role };

//     try {
//       // --- API Call ---
//       const response = await fetch("/api/admin/users", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newAdminData),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `Failed to add admin (HTTP ${response.status})`);
//       }

//       const addedAdmin: AdminUser = await response.json();
//       setUsername("");
//       setEmail("");
//       setPassword("");
//       setConfirmPassword("");
//       setRole("Editor");
//       onAdminAdded(addedAdmin);
//       alert("Admin added successfully!"); // Or use a toast notification
//     } catch (err: any) {
//       console.error("Error adding admin:", err);
//       setError(err.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <Card className="mb-8 shadow-sm">
//       <CardHeader>
//         <CardTitle>Add New Admin</CardTitle>
//         <CardDescription>Enter details for the new administrator account.</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <Label htmlFor="admin-username">Username</Label>
//             <Input
//               id="admin-username"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               required
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <Label htmlFor="admin-email">Email</Label>
//             <Input
//               id="admin-email"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <Label htmlFor="admin-password">Password</Label>
//             <Input
//               id="admin-password"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <Label htmlFor="admin-confirm-password">Confirm Password</Label>
//             <Input
//               id="admin-confirm-confirm-password"
//               type="password"
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               required
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <Label htmlFor="admin-role">Role</Label>
//             <Select value={role} >
//               <SelectTrigger className="w-full mt-1">
//                 <SelectValue placeholder="Select Role" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="Super Admin">Super Admin</SelectItem>
//                 <SelectItem value="Editor">Editor</SelectItem>
//                 <SelectItem value="Viewer">Viewer</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           {error && (
//             <div className="md:col-span-2 text-red-500 text-sm flex items-center">
//               <AlertCircle className="h-4 w-4 mr-2" /> {error}
//             </div>
//           )}
//           <div className="md:col-span-2 flex justify-end">
//             <Button type="submit" disabled={isSubmitting}>
//               {isSubmitting ? "Adding..." : "Add Admin"}
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   );
// };

// // --- Admin List Table Component ---
// const AdminListTable = ({
//   admins,
//   onAdminStatusChange, // Callback to refresh list
//   onAdminDeleted,     // Callback after deletion
// }: {
//   admins: AdminUser[];
//   onAdminStatusChange: () => void;
//   onAdminDeleted: () => void;
// }) => {

//   const handleDelete = async (adminId: string, username: string) => {
//     if (!confirm(`Are you sure you want to delete admin "${username}"? This action cannot be undone.`)) {
//       return;
//     }
//     try {
//       const response = await fetch(`/api/admin/users/${adminId}`, { // Assumes DELETE /api/admin/users/[id]
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `Failed to delete admin (HTTP ${response.status})`);
//       }
//       alert(`Admin "${username}" deleted successfully.`);
//       onAdminDeleted(); // Signal parent to refresh list
//     } catch (error: any) {
//       console.error("Error deleting admin:", error);
//       alert(error.message || "Could not delete admin.");
//     }
//   };

//   const handleStatusToggle = async (adminId: string, currentStatus: AdminUser["status"]) => {
//     const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
//     try {
//       const response = await fetch(`/api/admin/users/${adminId}/status`, { // Assumes PUT /api/admin/users/[id]/status
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ status: newStatus }),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `Failed to update status (HTTP ${response.status})`);
//       }
//       alert(`Admin status for ${adminId} changed to ${newStatus}.`);
//       onAdminStatusChange(); // Signal parent to refresh list
//     } catch (error: any) {
//       console.error("Error toggling admin status:", error);
//       alert(error.message || "Could not update admin status.");
//     }
//   };

//   return (
//     <Card className="shadow-sm">
//       <CardHeader>
//         <CardTitle>Existing Admins</CardTitle>
//         <CardDescription>Manage administrator accounts.</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <Table>
//           <TableCaption>List of all administrator accounts.</TableCaption>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Username</TableHead>
//               <TableHead>Email</TableHead>
//               <TableHead>Role</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead className="text-right">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {admins.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={5} className="text-center text-muted-foreground">
//                   No admin users found.
//                 </TableCell>
//               </TableRow>
//             ) : (
//               admins.map((admin) => (
//                 <TableRow key={admin.id}>
//                   <TableCell className="font-medium">{admin.username}</TableCell>
//                   <TableCell>{admin.email}</TableCell>
//                   <TableCell>{admin.role}</TableCell>
//                   <TableCell>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleStatusToggle(admin.id, admin.status)}
//                       className={`hover:bg-transparent ${
//                         admin.status === "Active"
//                           ? "text-green-500 hover:text-green-600"
//                           : "text-red-500 hover:text-red-600"
//                       }`}
//                       disabled={admin.role === "Super Admin"} // Super Admin status usually cannot be toggled
//                     >
//                       {admin.status}
//                     </Button>
//                   </TableCell>
//                   <TableCell className="text-right">
//                     <div className="flex items-center justify-end space-x-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => handleDelete(admin.id, admin.username)}
//                         className="text-red-500 hover:text-red-700 hover:bg-red-100"
//                         disabled={admin.role === "Super Admin"} // Prevent deleting Super Admin directly here
//                       >
//                         Delete
//                       </Button>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </CardContent>
//     </Card>
//   );
// };

// // --- Change Own Password Form Component ---
// const ChangePasswordForm = ({ currentUser }: { currentUser: CurrentUser | null }) => {
//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmNewPassword, setConfirmNewPassword] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     if (!currentPassword || !newPassword || !confirmNewPassword) {
//       setError("All fields are required.");
//       return;
//     }
//     if (newPassword !== confirmNewPassword) {
//       setError("New passwords do not match.");
//       return;
//     }
//     if (newPassword.length < 6) {
//       setError("Password must be at least 6 characters long.");
//       return;
//     }

//     setIsSubmitting(true);
//     const passwordChangeData = {
//       currentPassword,
//       newPassword,
//     };

//     try {
//       // --- API Call ---
//       const response = await fetch("/api/auth/change-password", { // Assumes this endpoint exists
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(passwordChangeData),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `Failed to change password (HTTP ${response.status})`);
//       }

//       alert("Your password has been updated successfully!");
//       setCurrentPassword("");
//       setNewPassword("");
//       setConfirmNewPassword("");
//     } catch (err: any) {
//       console.error("Error changing password:", err);
//       setError(err.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (!currentUser) {
//     return <p className="text-muted-foreground">Loading user profile...</p>;
//   }

//   return (
//     <Card className="shadow-sm">
//       <CardHeader>
//         <CardTitle>Change Your Password</CardTitle>
//         <CardDescription>Update your account security settings.</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
//           <div>
//             <Label htmlFor="current-password">Current Password</Label>
//             <Input
//               id="current-password"
//               type="password"
//               value={currentPassword}
//               onChange={(e) => setCurrentPassword(e.target.value)}
//               required
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <Label htmlFor="new-password">New Password</Label>
//             <Input
//               id="new-password"
//               type="password"
//               value={newPassword}
//               onChange={(e) => setNewPassword(e.target.value)}
//               required
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <Label htmlFor="confirm-new-password">Confirm New Password</Label>
//             <Input
//               id="confirm-new-password"
//               type="password"
//               value={confirmNewPassword}
//               onChange={(e) => setConfirmNewPassword(e.target.value)}
//               required
//               className="mt-1"
//             />
//           </div>
//           {error && (
//             <div className="text-red-500 text-sm flex items-center">
//               <AlertCircle className="h-4 w-4 mr-2" /> {error}
//             </div>
//           )}
//           <div className="flex justify-end">
//             <Button type="submit" disabled={isSubmitting}>
//               {isSubmitting ? "Updating..." : "Update Password"}
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   );
// };

// // --- Settings Page Component ---
// const SettingsPage = () => {
//   const [admins, setAdmins] = useState<AdminUser[]>([]);
//   const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
//   const [loadingAdmins, setLoadingAdmins] = useState(true);
//   const [loadingUser, setLoadingUser] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // --- API Call Functions ---
//   const fetchAdmins = useCallback(async () => {
//     setLoadingAdmins(true);
//     setError(null);
//     try {
//       const response = await fetch('/api/admin/users');
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       }
//       const data: AdminUser[] = await response.json();
//       setAdmins(data);
//     } catch (err: any) {
//       setError(err.message);
//       setAdmins([]);
//     } finally {
//       setLoadingAdmins(false);
//     }
//   }, []);

//   const fetchCurrentUser = useCallback(async () => {
//     setLoadingUser(true);
//     setError(null);
//     try {
//       const response = await fetch('/api/auth/me'); // Endpoint for current user info
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       }
//       const data: CurrentUser = await response.json();
//       setCurrentUser(data);
//     } catch (err: any) {
//       setError(err.message);
//       setCurrentUser(null);
//     } finally {
//       setLoadingUser(false);
//     }
//   }, []);

//   // --- Handlers for refreshing lists ---
//   const handleAdminAdded = (newAdmin: AdminUser) => {
//     setAdmins((prevAdmins) => [...prevAdmins, newAdmin]);
//   };

//   const handleAdminStatusChange = useCallback(() => { // Wrap in useCallback
//     fetchAdmins(); // Re-fetch the list to reflect status changes
//   }, [fetchAdmins]);

//   const handleAdminDeleted = useCallback(() => { // Wrap in useCallback
//     fetchAdmins(); // Re-fetch the list after deletion
//   }, [fetchAdmins]);

//   // --- Effect to fetch initial data ---
//   useEffect(() => {
//     fetchAdmins();
//     fetchCurrentUser();
//   }, [fetchAdmins, fetchCurrentUser]);

//   // --- Render Loading/Error States ---
//   if (loadingAdmins || loadingUser) {
//     return <div className="container mx-auto py-8 text-center">Loading settings...</div>;
//   }
//   if (error) {
//     return <div className="container mx-auto py-8 text-center text-red-500">Error: {error}</div>;
//   }

//   return (
//     <div className="container mx-auto py-8">
//       <h1 className="text-3xl font-bold mb-6">Settings</h1>

//       <Tabs defaultValue="admin-management" className="w-full">
//         <TabsList className="mb-6">
//           <TabsTrigger value="admin-management">Admin Management</TabsTrigger>
//           <TabsTrigger value="security">Security & Profile</TabsTrigger>
//         </TabsList>

//         <TabsContent value="admin-management">
//           <AddAdminForm onAdminAdded={handleAdminAdded} />
//           <AdminListTable
//             admins={admins}
//             onAdminStatusChange={handleAdminStatusChange}
//             onAdminDeleted={handleAdminDeleted}
//           />
//         </TabsContent>

//         <TabsContent value="security">
//           {currentUser && <ChangePasswordForm currentUser={currentUser} />}
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// };

// export default SettingsPage;
