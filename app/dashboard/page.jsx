import { Suspense } from "react";
import Dashboard from "./Dashboard";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading dashboard…</div>}>
      <Dashboard />
    </Suspense>
  );
}
