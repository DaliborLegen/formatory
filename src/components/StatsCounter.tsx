"use client";
import { useEffect, useState } from "react";

export default function StatsCounter() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setTotal(data.total))
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-3 gap-6 mb-16 max-w-lg mx-auto">
      <div className="text-center">
        <p className="text-3xl font-bold text-txt">100%</p>
        <p className="text-xs text-txt2 mt-1">zasebno</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-txt">0</p>
        <p className="text-xs text-txt2 mt-1">nalaganj na strežnik</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-txt">
          {total !== null ? total.toLocaleString() : "—"}
        </p>
        <p className="text-xs text-txt2 mt-1">pretvorb</p>
      </div>
    </div>
  );
}
