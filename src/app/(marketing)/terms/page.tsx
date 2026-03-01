import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Info, ArrowRight, AlertTriangle, HelpCircle } from "lucide-react";
import { DarkModeToggle } from "@/components/layout/DarkModeToggle";

export const metadata: Metadata = {
  title: "Terms of Service — Book Circle",
  description: "Read the terms and conditions for using Book Circle's social reading platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-warm-cream dark:bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-stone-200/50 bg-warm-cream/80 backdrop-blur-xl dark:border-stone-800/50 dark:bg-background/80">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-20">
          <Link href="/" className="flex items-center gap-3 text-primary">
            <BookOpen className="size-8" />
            <h2 className="font-display text-xl font-bold tracking-tight">Book Circle</h2>
          </Link>
          <div className="flex items-center gap-4">
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-6 py-12">
        <div className="flex max-w-[840px] flex-1 flex-col">
          {/* Breadcrumbs */}
          <div className="mb-8 flex items-center gap-2">
            <Link href="/" className="text-sm font-medium text-primary/70 hover:text-primary">
              Home
            </Link>
            <span className="text-xs text-primary/40">›</span>
            <span className="text-sm font-medium">Terms of Service</span>
          </div>

          {/* Page Header */}
          <div className="mb-12 flex flex-col gap-4 border-b border-primary/10 pb-10">
            <h1 className="font-display text-5xl font-black leading-tight tracking-tight">Terms of Service</h1>
            <div className="flex items-center gap-4 text-primary/60">
              <span className="text-base">📅</span>
              <p className="text-base font-normal italic">Last Updated: October 26, 2023</p>
            </div>
          </div>

          {/* Introduction Summary Box */}
          <div className="mb-12">
            <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-primary/20 bg-primary/5 p-8 md:flex-row md:items-center">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary">
                  <Info className="size-5" />
                  <p className="text-lg font-bold leading-tight">Summary of Key Terms</p>
                </div>
                <p className="mt-2 text-lg leading-relaxed italic text-stone-700 dark:text-stone-300">
                  By using Book Circle, you agree to our rules regarding content sharing, community conduct, and data privacy. This summary helps you understand the full legal text below.
                </p>
              </div>
              <Link
                href="/privacy"
                className="flex items-center gap-2 whitespace-nowrap text-sm font-bold leading-normal text-primary hover:underline"
              >
                Privacy Policy
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Content Sections */}
          <article className="text-lg">
            {/* Section 1 */}
            <section className="mb-16">
              <h2 className="mb-6 flex items-center gap-3 font-display text-3xl font-bold leading-tight tracking-tight">
                <span className="text-primary">01.</span> Acceptance of Terms
              </h2>
              <div className="mb-8 rounded-r-lg border-l-4 border-primary bg-white p-6 dark:bg-white/5">
                <p className="mb-0 font-bold text-stone-800 dark:text-stone-200">In simple terms:</p>
                <p className="mb-0 text-stone-600 dark:text-stone-400">
                  By creating an account or using our reading app, you&apos;re agreeing to follow these rules. If you don&apos;t like them, please don&apos;t use the service.
                </p>
              </div>
              <p className="mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you and Book Circle Inc. ("Book Circle," "we," "us," or "our") governing your access to and use of the Book Circle website, mobile application, and any related services (collectively, the "Services").
              </p>
              <p>
                Please read these Terms carefully before using the Services. Your access to and use of the Services is conditioned upon your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who wish to access or use the Services.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-16">
              <h2 className="mb-6 flex items-center gap-3 font-display text-3xl font-bold leading-tight tracking-tight">
                <span className="text-primary">02.</span> User Conduct & Content
              </h2>
              <div className="mb-8 rounded-r-lg border-l-4 border-primary bg-white p-6 dark:bg-white/5">
                <p className="mb-0 font-bold text-stone-800 dark:text-stone-200">In simple terms:</p>
                <p className="mb-0 text-stone-600 dark:text-stone-400">
                  Be nice to other readers. Don&apos;t post spoilers without tags, don&apos;t spam, and don&apos;t upload pirated books. You own your reviews, but we have permission to show them to the world.
                </p>
              </div>
              <p className="mb-4">
                Our Services allow you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Services, including its legality, reliability, and appropriateness.
              </p>
              <p className="mb-4">
                By posting Content on or through the Services, you represent and warrant that: (i) the Content is yours (you own it) and/or you have the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) that the posting of your Content on or through the Services does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity.
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex gap-4 rounded-lg border border-stone-200 bg-stone-100 p-4 dark:border-stone-700 dark:bg-stone-800/50">
                  <AlertTriangle className="size-6 flex-shrink-0 text-primary" />
                  <div>
                    <p className="mb-1 font-bold">Prohibited Activities</p>
                    <ul className="list-disc space-y-2 pl-5 text-stone-700 dark:text-stone-300">
                      <li>Harassing, threatening, or impersonating other members of the circle.</li>
                      <li>Distributing malware or viruses.</li>
                      <li>Extracting data through automated scrapers or bots without written consent.</li>
                      <li>Posting sexually explicit or gratuitously violent content.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-16">
              <h2 className="mb-6 flex items-center gap-3 font-display text-3xl font-bold leading-tight tracking-tight">
                <span className="text-primary">03.</span> Intellectual Property
              </h2>
              <div className="mb-8 rounded-r-lg border-l-4 border-primary bg-white p-6 dark:bg-white/5">
                <p className="mb-0 font-bold text-stone-800 dark:text-stone-200">In simple terms:</p>
                <p className="mb-0 text-stone-600 dark:text-stone-400">
                  The app&apos;s design, code, and logo belong to us. The book covers and metadata belong to their respective publishers.
                </p>
              </div>
              <p className="mb-4">
                The Services and their original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Book Circle and its licensors. The Services are protected by copyright, trademark, and other laws of both the United States and foreign countries.
              </p>
              <p>Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Book Circle.</p>
            </section>

            {/* Section 4 */}
            <section className="mb-16">
              <h2 className="mb-6 flex items-center gap-3 font-display text-3xl font-bold leading-tight tracking-tight">
                <span className="text-primary">04.</span> Termination
              </h2>
              <div className="mb-8 rounded-r-lg border-l-4 border-primary bg-white p-6 dark:bg-white/5">
                <p className="mb-0 font-bold text-stone-800 dark:text-stone-200">In simple terms:</p>
                <p className="mb-0 text-stone-600 dark:text-stone-400">
                  If you break these rules, we can close your account. You can also delete your account at any time if you wish to leave the circle.
                </p>
              </div>
              <p className="mb-4">
                We may terminate or suspend your account and bar access to the Services immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
              <p>If you wish to terminate your account, you may simply discontinue using the Services or use the "Delete Account" feature within your profile settings.</p>
            </section>
          </article>

          {/* Footer Navigation */}
          <footer className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-primary/10 pt-10 md:flex-row">
            <div className="text-sm text-stone-500">© 2024 Book Circle Inc. All rights reserved.</div>
            <div className="flex gap-8">
              <Link href="/privacy" className="text-sm font-bold text-primary hover:underline">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-sm font-bold text-primary hover:underline">
                Contact Us
              </Link>
            </div>
          </footer>

          {/* CTA Help */}
          <div className="mt-20 flex flex-col items-center gap-6 rounded-2xl bg-stone-900 p-10 text-center dark:bg-primary/10">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/20 text-primary">
              <HelpCircle className="size-8" />
            </div>
            <div className="max-w-md">
              <h3 className="mb-2 text-2xl font-bold text-white dark:text-stone-100">Still have questions?</h3>
              <p className="text-stone-400">Our legal team is here to help clarify any part of these terms. Reach out to us for more information.</p>
            </div>
            <Link
              href="/contact"
              className="rounded-lg bg-primary px-8 py-3 font-bold text-white transition-all hover:bg-primary/90"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
