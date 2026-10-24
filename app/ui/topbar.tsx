import Link from "next/link";

import { daysUntilChristmas } from "@/lib/countdown";

export function TopBar() {
  const days = daysUntilChristmas();
  return (
    <header className="topbar">
      <Link href="/" className="logo">
        socksy
      </Link>
      <span className="chip">{days === 0 ? "C'est Noël !" : `J-${days}`}</span>
    </header>
  );
}
