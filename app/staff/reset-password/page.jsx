import { Suspense } from "react";
import ResetPasswordClient from "./Staff-Reset";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
