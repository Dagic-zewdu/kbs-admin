import type { Metadata } from "next";
import { Suspense } from "react";
import { DeliverersView } from "@/components/deliverers/deliverers-view";

export const metadata: Metadata = { title: "Deliverers" };

export default function DeliverersPage() {
  // Reads ?deleted= from the URL, which needs a Suspense boundary
  return (
    <Suspense>
      <DeliverersView />
    </Suspense>
  );
}
