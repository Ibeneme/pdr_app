// utils/date.ts

export const formatDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return "N/A";
  
    try {
      const date = new Date(dateString);
  
      // If invalid date
      if (isNaN(date.getTime())) return "Invalid Date";
  
      // Format: 22 Jul 2026
      return date.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };
  
  export const formatTime = (timeString: string | undefined | null): string => {
    if (!timeString) return "N/A";
  
    try {
      // If time is already in HH:mm format
      if (/^\d{1,2}:\d{2}$/.test(timeString)) return timeString;
  
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString;
  
      return date.toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return timeString || "N/A";
    }
  };
  
  export const formatDateTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return "N/A";
  
    const date = formatDate(dateString);
    const time = formatTime(dateString);
  
    return `${date} • ${time}`;
  };
  
  // Optional: Full format with weekday
  export const formatFullDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return "N/A";
  
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
  
      return date.toLocaleDateString("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };