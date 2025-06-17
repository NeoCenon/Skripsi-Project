import { Suspense } from "react";
import EditOrderPage from "@/component/editorder";

export default function EditOrder() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditOrderPage />
    </Suspense>
  );
}
