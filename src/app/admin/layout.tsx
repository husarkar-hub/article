"use client";

// Assuming AdminNavbar is correctly imported and functions as before
import AdminNavbar from "@/components/AdminNavbar";
import React, { Suspense } from "react";
import NextAuthSessionProvider from "@/components/NextAuthSessionProvider";

import CurrentDateTime from "@/components/healperComp/CurrentDateTime";

const WeatherDisplay = () => {
  const weatherData = {
    temperature: "25°C",
    description: "Sunny",
    city: "Your City",
  };
  return (
    <div className="hidden md:flex lg:flex items-center gap-2 text-sm">
      <span>{weatherData.city}:</span>
      <span>{weatherData.temperature}</span>
      <span>{weatherData.description}</span>
    </div>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextAuthSessionProvider>
      <div className="lg:py-10  min-h-screen">
        <header className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <AdminNavbar />
            <div className="flex items-center space-x-4">
              <Suspense fallback={<div>Loading weather...</div>}>
                <CurrentDateTime />
                <WeatherDisplay />
              </Suspense>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </NextAuthSessionProvider>
  );
};

export default AdminLayout;
