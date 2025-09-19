import React, { useState, useEffect } from "react";

const CurrentDateTime = () => {
  const [currentDateTime, setCurrentDateTime] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const optionsDate = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const optionsTime = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
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

    setCurrentDateTime(`${formattedDate} - ${formattedTime}`);
  }, []); // Empty dependency array ensures this runs only once after mount

  return (
    <div className="text-sm text-muted-foreground">
      {currentDateTime ? currentDateTime : "Loading date and time..."}
    </div>
  );
};

export default CurrentDateTime;
