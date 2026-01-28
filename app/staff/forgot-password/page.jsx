import { Suspense } from "react";
import Forgot from "./Forgot";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading dashboard…</div>}>
      <Forgot />
    </Suspense>
  );
}
