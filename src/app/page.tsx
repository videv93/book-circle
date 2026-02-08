import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { BookOpen, Users, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Flappy Bird — Read Together. Never Alone.",
  description:
    "Track your reading habits, read alongside friends, and experience ambient author presence. Build streaks, give kudos, and never read alone again.",
  openGraph: {
    title: "Flappy Bird — Read Together. Never Alone.",
    description:
      "Track your reading habits, read alongside friends, and experience ambient author presence.",
    type: "website",
  },
};

const valueProps = [
  {
    icon: BookOpen,
    title: "Track Your Reading",
    description:
      "Build daily streaks, set reading goals, and watch your habits grow with every session.",
  },
  {
    icon: Users,
    title: "Read with Friends",
    description:
      "Give kudos, follow readers, and join reading rooms where you can feel others reading alongside you.",
  },
  {
    icon: Sparkles,
    title: "Meet Your Authors",
    description:
      "Experience the magic of ambient author presence — know when your favorite author inhabits the same space.",
  },
];

export default async function Home() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const isAuthenticated = !!session?.user;

  const ctaText = isAuthenticated ? "Go to Home" : "Get Started";
  const ctaHref = isAuthenticated ? "/home" : "/login";

  return (
    <div className="min-h-screen bg-warm-cream dark:bg-background">
      <main className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16 md:py-24">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold tracking-tight text-warm-text dark:text-foreground md:text-5xl">
            Flappy Bird
          </h1>
          <p className="mt-4 max-w-md text-lg text-warm-text-muted dark:text-muted-foreground">
            Read together. Never alone.
          </p>
          <Button asChild size="lg" className="mt-8 min-h-[44px] min-w-[160px]">
            <Link href={ctaHref}>{ctaText}</Link>
          </Button>
        </section>

        {/* Value Propositions */}
        <section className="mt-20 w-full">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {valueProps.map((prop) => (
              <Card key={prop.title} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <prop.icon className="size-6 text-primary" />
                  </div>
                  <CardTitle>
                    <h2 className="text-xl font-semibold">{prop.title}</h2>
                  </CardTitle>
                  <CardDescription>{prop.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mt-20 flex flex-col items-center text-center">
          <p className="max-w-sm text-warm-text-muted dark:text-muted-foreground">
            Join readers who are building habits and discovering the joy of reading together.
          </p>
          <Button asChild size="lg" className="mt-6 min-h-[44px] min-w-[160px]">
            <Link href={ctaHref}>{ctaText}</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
