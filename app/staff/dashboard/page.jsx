import { Suspense } from "react";
import Dashboard from '../Dashboard'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading staff dashboard…</div>}>
      <Dashboard />
    </Suspense>
  );
}
