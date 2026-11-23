import { redirect } from "next/navigation";

/** The reviewer desk lives at /reviewer; this keeps the natural /admin/reviewer address working. */
export default function Page() {
  redirect("/reviewer");
}
