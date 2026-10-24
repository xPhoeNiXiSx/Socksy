import { Hero } from "../ui/hero";
import { SetupScreen, missingConfig } from "../ui/setup";
import { TopBar } from "../ui/topbar";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const missing = missingConfig();
  if (missing.length > 0) return <SetupScreen missing={missing} />;

  const { next } = await searchParams;

  return (
    <main className="page">
      <TopBar />
      <Hero kicker="Content de te revoir" title="Connexion" />
      <LoginForm next={next ?? ""} />
    </main>
  );
}
