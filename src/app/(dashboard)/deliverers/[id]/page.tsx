"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { DelivererView } from "@/components/deliverers/deliverer-view";

export default function DelivererPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense>
      <DelivererView key={id} id={id} />
    </Suspense>
  );
}
