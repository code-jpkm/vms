"use client";

import { useSearchParams } from "next/navigation";

export default function StaffDashboardClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";

  return (
    <div>
      <h1>Staff Dashboard</h1>
      <p>Tab: {tab}</p>
    </div>
  );
}
