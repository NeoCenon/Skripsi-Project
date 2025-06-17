import { Suspense } from "react";
import EditInstockPage from "@/component/editstock";

export default function EditStock() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditInstockPage />
    </Suspense>
  );
}
