import { Suspense } from "react";
import Reset from "./Reset";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <Reset />
    </Suspense>
  );
}
