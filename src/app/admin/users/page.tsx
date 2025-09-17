// app/admin/users/activities/page.tsx

"use client"; // This page will likely need client-side interactivity

import React, { useState, useEffect } from "react";

// Import Shadcn UI components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button"; // For download button
import { Label } from "@/components/ui/label"; // For download options if needed
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // For download format selection
import { Search } from "lucide-react"; // For search icon
import { Input } from "@/components/ui/input"; // For search input

// --- Dummy Data ---
// In a real app, fetch this from your backend API
const dummyUserActivities = [
  {
    id: 1,
    user: "Alice",
    userId: "u-101",
    action: "Viewed Article",
    target: "Intro to React",
    timestamp: "2023-10-27 10:30:00",
    ip: "192.168.1.10",
  },
  {
    id: 2,
    user: "Bob",
    action: "Visited Page",
    target: "/dashboard",
    timestamp: "2023-10-27 10:35:15",
    ip: "10.0.0.5",
  },
  {
    id: 3,
    user: "Alice",
    action: "Read Article",
    target: "Advanced CSS",
    timestamp: "2023-10-27 10:40:00",
    ip: "192.168.1.10",
  },
  {
    id: 4,
    user: "Charlie",
    action: "Login",
    target: "System",
    timestamp: "2023-10-27 11:00:00",
    ip: "172.16.0.20",
  },
  {
    id: 5,
    user: "Bob",
    action: "Viewed Article",
    target: "Node.js Basics",
    timestamp: "2023-10-27 11:15:00",
    ip: "10.0.0.5",
  },
  // Add more data...
];

// --- Activity Table Component ---
const ActivityTable = ({ data }) => {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No activity found for this filter.
      </p>
    );
  }

  return (
    <Table>
      <TableCaption>A list of recent user activities.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Timestamp</TableHead>
          <TableHead>IP Address</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((activity) => (
          <TableRow key={activity.id}>
            <TableCell className="font-medium">{activity.user}</TableCell>
            <TableCell>{activity.action}</TableCell>
            <TableCell>{activity.target}</TableCell>
            <TableCell>{activity.timestamp}</TableCell>
            <TableCell>{activity.ip}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// --- Main Page Component ---
const UserActivitiesPage = () => {
  // State for activities, filtered activities, search term, and download format
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadFormat, setDownloadFormat] = useState("csv");
  const [selectedTab, setSelectedTab] = useState("all"); // To manage tab state

  // Simulate fetching data on mount
  useEffect(() => {
    // In a real app, replace this with your API call
    setActivities(dummyUserActivities);
    setFilteredActivities(dummyUserActivities); // Initialize filtered activities
  }, []);

  // Effect to filter activities when search term or tab changes
  useEffect(() => {
    let currentFiltered = activities;

    // Apply tab filter
    if (selectedTab !== "all") {
      currentFiltered = activities.filter((activity) => {
        if (selectedTab === "page-visits")
          return activity.action === "Visited Page";
        if (selectedTab === "article-reads")
          return activity.action === "Read Article";
        if (selectedTab === "logins") return activity.action === "Login";
        // Add more conditions for other tabs
        return true; // Default to show if tab doesn't match specific filter
      });
    }

    // Apply search filter
    if (searchTerm) {
      currentFiltered = currentFiltered.filter(
        (activity) =>
          activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.target.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredActivities(currentFiltered);
  }, [searchTerm, selectedTab, activities]); // Recalculate when these change

  const handleDownload = () => {
    console.log(`Downloading activities in format: ${downloadFormat}`);
    // --- Implement download logic here ---
    // This would involve formatting the 'filteredActivities' data
    // into the selected format (CSV, JSON, etc.) and triggering a download.
    // Example for CSV:
    if (downloadFormat === "csv") {
      const csvRows = [
        ["User", "Action", "Target", "Timestamp", "IP Address"], // Header
        ...filteredActivities.map((activity) => [
          activity.user,
          activity.action,
          activity.target,
          activity.timestamp,
          activity.ip,
        ]),
      ];
      const csvString = csvRows.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute(
        "download",
        `user_activities_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } else if (downloadFormat === "json") {
      const jsonString = JSON.stringify(filteredActivities, null, 2);
      const blob = new Blob([jsonString], {
        type: "application/json;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute(
        "download",
        `user_activities_${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    }
    // Add logic for other formats like Excel if needed
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle>User Activity Log</CardTitle>
          <CardDescription>
            View and manage all user interactions across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls Section: Search, Filter Tabs, Download */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            {/* Search Bar */}
            <div className="w-full md:max-w-md relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search activities (user, action, target)..."
                className="pl-8 max-w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Download Options */}
            <div className="flex items-center space-x-4">
              <Select value={downloadFormat} onValueChange={setDownloadFormat}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  {/* Add more formats if desired */}
                </SelectContent>
              </Select>
              <Button
                onClick={handleDownload}
                disabled={filteredActivities.length === 0}
              >
                Download ({filteredActivities.length})
              </Button>
            </div>
          </div>

          {/* Tabs for Activity Filtering */}
          <Tabs
            defaultValue="all"
            className="w-full"
            onValueChange={(value) => setSelectedTab(value)}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="page-visits">Page Visits</TabsTrigger>
              <TabsTrigger value="article-reads">Article Reads</TabsTrigger>
              <TabsTrigger value="logins">Logins</TabsTrigger>
              {/* Add more triggers as needed */}
            </TabsList>
            {/* TabsContent components will dynamically render the ActivityTable based on selectedTab and searchTerm */}
            {/* We render the table directly within the layout and use useEffect for filtering */}
            {/* Alternatively, you could have specific TabsContent for each tab, which might be cleaner */}
          </Tabs>

          {/* Render the Activity Table with filtered data */}
          <ActivityTable data={filteredActivities} />
        </CardContent>
      </Card>
    </div>
  );
};

// You might want to add a layout wrapper if this page needs the AdminNavbar etc.
// For now, assuming this is a standalone page within the admin section.
export default UserActivitiesPage;
