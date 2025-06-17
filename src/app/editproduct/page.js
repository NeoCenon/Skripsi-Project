import { Suspense } from "react";
import EditProductPage from "@/component/editproduct";

export default function EditProduct() {
  return (
      <Suspense fallback={<div>Loading...</div>}>
        <EditProductPage />
      </Suspense>
    ); 
}
