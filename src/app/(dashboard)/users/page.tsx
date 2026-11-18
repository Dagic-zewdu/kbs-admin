import type { Metadata } from "next";
import { Suspense } from "react";
import { UsersView } from "@/components/users/users-view";

export const metadata: Metadata = { title: "Users" };

export default function UsersPage() {
  // UsersView reads ?tab= from the URL, which needs a Suspense boundary
  return (
    <Suspense>
      <UsersView />
    </Suspense>
  );
}
