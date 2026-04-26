import { useEffect, useState } from "react";

const PROJECT_URL = "https://www.github.com/Lexiphanic/airscan";

function useCurrentDate() {
  const [date, setDate] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setDate(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return date;
}

export default function Footer() {
  const date = useCurrentDate().toLocaleString("en-GB", {
    minute: "2-digit",
    hour: "2-digit",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <footer className="hidden fixed bottom-0 left-0 right-0 p-4 border-t border-slate-700 text-sm text-slate-400 print:flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span>AirScan, v2.2.0</span>
        <span>•</span>
        <a
          href={PROJECT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-(--nb-accent) hover:underline"
        >
          {PROJECT_URL}
        </a>
      </div>

      <span>Generated: {date}</span>
    </footer>
  );
}
