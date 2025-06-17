import EditOpnamePage from "@/component/editopname";
import { Suspense } from "react";

export default function EditOpname() {
  return (
      <Suspense fallback={<div>Loading...</div>}>
        <EditOpnamePage />
      </Suspense>
    ); 
}
