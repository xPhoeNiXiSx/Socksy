import { Hero } from "../ui/hero";
import { SetupScreen, missingConfig } from "../ui/setup";
import { TopBar } from "../ui/topbar";
import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  const missing = missingConfig();
  if (missing.length > 0) return <SetupScreen missing={missing} />;

  return (
    <main className="page">
      <TopBar />
      <Hero kicker="Bienvenue" title="Ta liste" />
      <p className="lead">Pour t&apos;inscrire, il te faut le code famille : demande-le à la personne qui t&apos;a envoyé le lien.</p>
      <SignupForm />
    </main>
  );
}
