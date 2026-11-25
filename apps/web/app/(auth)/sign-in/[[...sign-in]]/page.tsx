import { isSafeRelativePath } from "@servyn/domain-identity";
import { AuthShell } from "@/components/auth/AuthShell";
import { CustomSignInForm } from "@/components/auth/CustomSignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;
  const redirectUrl = isSafeRelativePath(params.redirect_url)
    ? params.redirect_url
    : "/dashboard";

  return (
    <AuthShell
      badge="Welcome back"
      badgeTone="gold"
      title="Sign in to Servyn"
      subtitle="One account for booking trusted local services, shopping the African market, and managing your business."
      quote="The enhanced checks badge gave me the confidence to book childcare."
      quoteAuthor="Priya S. · Salford"
    >
      <CustomSignInForm redirectUrl={redirectUrl} />
    </AuthShell>
  );
}
