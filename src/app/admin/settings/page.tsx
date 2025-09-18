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
const ChangePasswordForm = ({ currentUser }:any) => {
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