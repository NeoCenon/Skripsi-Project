import { Suspense } from "react";
import EditSupplierPage from "@/component/editsupplier";

export default function EditSupplier() {
  return(
  <Suspense fallback={<div>Loading...</div>}>
    <EditSupplierPage />
  </Suspense>
  );
}
