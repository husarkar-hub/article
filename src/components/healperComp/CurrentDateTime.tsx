"use client";

import React, { useState, useEffect } from "react";

const CurrentDateTime = () => {
  const [currentDateTime, setCurrentDateTime] = useState<string | null>(null);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const optionsDate = {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      };
      const optionsTime = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };

      // Format the date and time
      const formattedDate = now.toLocaleDateString(
        undefined,
        optionsDate as Intl.DateTimeFormatOptions
      );
      const formattedTime = now.toLocaleTimeString(
        undefined,
        optionsTime as Intl.DateTimeFormatOptions
      );

      setCurrentDateTime(`${formattedDate}, ${formattedTime}`);
    };

    // Update immediately
    updateDateTime();

    // Update every minute
    const interval = setInterval(updateDateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm text-muted-foreground font-medium">
      {currentDateTime ? currentDateTime : "Loading..."}
    </div>
  );
};

export default CurrentDateTime;
