import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { BookOpen, Users, Sparkles, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/layout/DarkModeToggle";
import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerChildren, StaggerItem } from "@/components/motion/StaggerChildren";
import { ScaleIn } from "@/components/motion/ScaleIn";

export const metadata: Metadata = {
  title: "Book Circle — Read Together. Never Alone.",
  description:
    "Track your reading habits, read alongside friends, and experience ambient author presence. Build streaks, give kudos, and never read alone again.",
  openGraph: {
    title: "Book Circle — Read Together. Never Alone.",
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
      "Build daily streaks, set reading goals, and watch your habits grow with every session. Visual insights into your progress.",
  },
  {
    icon: Users,
    title: "Read with Friends",
    description:
      "Give kudos, follow readers, and join reading rooms where you can feel others reading alongside you in real-time.",
  },
  {
    icon: Sparkles,
    title: "Meet Your Authors",
    description:
      "Experience the magic of ambient author presence — know when your favorite author inhabits the same digital space as you.",
  },
];

export default async function Home() {
  let isAuthenticated = false;
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    isAuthenticated = !!session?.user;
  } catch {
    // Default to unauthenticated if session check fails
  }

  const ctaText = isAuthenticated ? "Go to Home" : "Get Started Free";
  const ctaHref = isAuthenticated ? "/home" : "/login";

  return (
    <div className="min-h-screen bg-warm-cream dark:bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-stone-200/50 bg-warm-cream/80 backdrop-blur-xl dark:border-stone-800/50 dark:bg-background/80">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <BookOpen className="size-8 text-primary" />
            <span className="font-display text-2xl font-bold tracking-tight">Book Circle</span>
          </div>
          <div className="flex items-center gap-8">
            <nav className="hidden items-center gap-8 font-medium md:flex">
              <a href="#features" className="text-stone-700 transition-colors hover:text-primary dark:text-stone-300">
                Features
              </a>
              <a href="#community" className="text-stone-700 transition-colors hover:text-primary dark:text-stone-300">
                Community
              </a>
            </nav>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <Button asChild className="rounded-full px-6">
                <Link href={ctaHref}>Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-warm-cream px-6 pb-24 pt-44 dark:bg-background">
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <FadeIn delay={0.1}>
            <h1 className="mb-8 font-display text-6xl font-bold leading-tight tracking-tight text-stone-900 dark:text-white md:text-8xl">
              Read together. <br />
              <span className="italic text-primary">Never alone.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-stone-600 dark:text-stone-400 md:text-2xl">
              Experience the world&apos;s most intimate social reading platform. Build streaks, join rooms, and connect with authors.
            </p>
          </FadeIn>
          <FadeIn delay={0.5}>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="w-full rounded-full px-10 py-6 text-lg font-semibold shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl sm:w-auto">
                <Link href={ctaHref}>{ctaText}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full rounded-full border-2 px-10 py-6 text-lg font-semibold sm:w-auto">
                <Link href="#features">How it works</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
        <div className="absolute left-1/2 top-1/2 -z-10 size-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"></div>
      </header>

      {/* Features Section */}
      <section id="features" className="bg-warm-surface px-6 py-24 dark:bg-stone-900/30">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-display text-4xl font-bold">A reading experience like no other</h2>
              <p className="text-stone-500 dark:text-stone-400">Everything you need to nurture your reading habit.</p>
            </div>
          </FadeIn>
          <StaggerChildren className="grid gap-8 md:grid-cols-3">
            {valueProps.map((prop) => (
              <StaggerItem key={prop.title}>
                <div className="group rounded-2xl border border-stone-100 bg-white p-10 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-stone-700/50 dark:bg-stone-800">
                  <div className="mb-8 flex size-16 items-center justify-center rounded-2xl bg-amber-50 transition-colors duration-300 group-hover:bg-primary dark:bg-amber-900/20">
                    <prop.icon className="size-8 text-primary transition-colors duration-300 group-hover:text-white" />
                  </div>
                  <h3 className="mb-4 font-display text-2xl font-bold">{prop.title}</h3>
                  <p className="leading-relaxed text-stone-600 dark:text-stone-400">{prop.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="overflow-hidden bg-warm-cream px-6 py-24 dark:bg-background">
        <ScaleIn>
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-stone-900 p-8 dark:bg-stone-800 sm:rounded-3xl md:p-20">
            <div className="relative z-10 grid items-center gap-12 md:grid-cols-2">
              <FadeIn direction="left">
                <div>
                  <h2 className="mb-6 font-display text-4xl font-bold leading-tight text-white md:text-5xl">
                    Join a community of <span className="italic text-primary">passionate</span> readers.
                  </h2>
                  <p className="mb-8 text-lg leading-relaxed text-stone-400">
                    Whether you&apos;re into non-fiction, sci-fi, or the classics, there&apos;s a circle waiting for you. Thousands of readers are building better habits today.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuClAylT5_TZQg0qURJMN_g1wmcXlyFtL8of_AbpyXnjJByKJz-ZdfUKRRwJZ01YgN2zAg6FVCkfWIwyG6obRforeiCbW2xNF-tofLANB2qg604N3Umk9I_DUJdnmw0EyPQRR03KLiv4k8Mk1EVTctI0B25dzcKl9DGX3EBfv-A7eSKzjFz9rsHi35adkjpDlqEAdPT7hf4QuF1UozSrgVxTOauYIaU7LGN815qfNsIBrvi7p2TCNXuilIsuA9OS7nsvXMKHuK5IQks"
                    alt="Reader 1"
                    width={48}
                    height={48}
                    className="size-12 rounded-full border-2 border-stone-900 object-cover"
                  />
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4PefCbtbBWP2xTZ_k2XGCPdG237A9W78mDswqRPhuTUuuiKmuoInLqogz7a4zFWIgDeGj3pXk2_gixsV-6Nxd1etky4ql5l4mnIKuIY4BGQJZpnXyNOhFF5P--eOFsyC9eWaphMzKbMnE1eazLe1yrb_JDMc3P6_19_4mTmAhLTKTOrRfAqqU0d6i4yjaF-blwWtTFqGVcZTEhXZYHm58e2I19OLEWmXuOgoiSNsoKCD_OvL-dtHMDj1899sf7SsG1mRXi1G8jtE"
                    alt="Reader 2"
                    width={48}
                    height={48}
                    className="size-12 rounded-full border-2 border-stone-900 object-cover"
                  />
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT25s3vSZJLktRIbopftEb-QXxOq7QNU2tK_l0X7GusVIMJR3e_pmFMJUcwoGZ5y6ZpKBs14D_JwX7M2Xw3sg2zwDx-sbwdVv9MTXv_KhLg0Sxjn_rKl5bnIuJYebCADTa9jdyZWevuLZDUX7siFebfBAHOU4ebLnJcQwjFeeIUTBEa0BCMQx2FU4Qlv9IT8lj4DllU0qcbFl5M115WtaGK-NPSHAxOo9AVvQeEOKQS6yepD234jKD3rz3hC6ULDGKjgmYul7LqpY"
                    alt="Reader 3"
                    width={48}
                    height={48}
                    className="size-12 rounded-full border-2 border-stone-900 object-cover"
                  />
                  <div className="flex size-12 items-center justify-center rounded-full border-2 border-stone-900 bg-stone-700 text-xs font-bold text-white">+2k</div>
                </div>
                <p className="text-sm text-stone-400">Join 2,000+ readers online now</p>
              </div>
            </div>
              </FadeIn>
              <FadeIn direction="right" delay={0.2}>
                <div className="relative">
                  <div className="transform rounded-2xl shadow-2xl transition-transform duration-500 md:rotate-3 md:hover:rotate-0">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_8tEs4ntvWPnOA2XoozBwA1KNL4ueGKC9btN5SDx1bC7mNfPVZgdO1v0rDJ0q31dSQIPOM1-qAfs1CVhb2T8WcaxrRiBteddJzWgcBAI6__mEmOaOTT3_UdzMcL2LRs_BZuobkDJ5taoCJW0FcnvT1nfif-V5MnplWC4pZ4r84PkR44Gl5SDFR93R-WMGyymzbOYNyEq-AR0yyo-W-nOWcHXJd_3OdhcFJA63Hx84GhCELmPb3_j58xThv5lbdxC8yeLy0XICAIk"
                      alt="Books and coffee on a table"
                      width={600}
                      height={450}
                      className="rounded-2xl object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-6 -left-6 flex animate-bounce items-center gap-3 rounded-xl bg-white p-4 shadow-xl dark:bg-stone-700">
                    <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
                      <TrendingUp className="size-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-stone-500 dark:text-stone-400">Reading Streak</p>
                      <p className="font-bold text-stone-900 dark:text-white">12 Days Active</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
            <div className="absolute -right-24 -top-24 size-64 rounded-full bg-primary/20 blur-3xl"></div>
          </div>
        </ScaleIn>
      </section>

      {/* Bottom CTA */}
      <section className="bg-warm-surface px-6 py-24 text-center dark:bg-stone-900/30">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <h2 className="mb-8 font-display text-4xl font-bold md:text-5xl">Ready to start your next chapter?</h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mb-12 text-xl text-stone-600 dark:text-stone-400">
              Join readers who are building habits and discovering the joy of reading together.
            </p>
          </FadeIn>
          <FadeIn delay={0.4}>
            <div className="flex flex-col items-center gap-6">
              <Button asChild size="lg" className="rounded-full px-12 py-6 text-xl font-bold shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl">
                <Link href={ctaHref}>Get Started Now</Link>
              </Button>
              <p className="text-sm text-stone-400">Join readers building lasting habits together.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-warm-cream px-6 py-12 dark:border-stone-800 dark:bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-2">
            <BookOpen className="size-6 text-primary" />
            <span className="font-display text-xl font-bold tracking-tight">Book Circle</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-stone-500 dark:text-stone-400">
            <Link href="/privacy" className="transition-colors hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-primary">Terms of Service</Link>
            <Link href="/contact" className="transition-colors hover:text-primary">Contact Us</Link>
          </div>
          <p className="text-sm text-stone-400">© 2024 Book Circle. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
