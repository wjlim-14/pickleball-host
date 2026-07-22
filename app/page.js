import HostApp from "@/components/HostApp";

// Access is enforced by middleware.js (access-code cookie gate).
export default function Page() {
  return <HostApp />;
}
