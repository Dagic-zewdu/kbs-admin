import { redirect } from "next/navigation";

// The guards decide between /login and the dashboard
export default function Home() {
  redirect("/dashboard");
}
