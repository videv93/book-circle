import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Database, Shield, Cookie, Mail, Info, Check } from "lucide-react";
import { DarkModeToggle } from "@/components/layout/DarkModeToggle";

export const metadata: Metadata = {
  title: "Privacy Policy — Book Circle",
  description: "Learn how Book Circle collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
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

      <main className="flex-1 px-6 py-10 md:px-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 md:flex-row">
          {/* Sidebar Navigation */}
          <aside className="w-full flex-shrink-0 md:w-64">
            <div className="sticky top-24">
              <div className="mb-8">
                <h3 className="mb-1 font-display text-lg font-bold">Privacy Center</h3>
                <p className="text-xs italic text-stone-500">Last updated: Oct 24, 2023</p>
              </div>
              <nav className="flex flex-col gap-1">
                <a
                  href="#introduction"
                  className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 font-semibold text-primary"
                >
                  <Info className="size-5" />
                  <span className="text-sm">Introduction</span>
                </a>
                <a
                  href="#data-collection"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-stone-600 transition-all hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800/50"
                >
                  <Database className="size-5" />
                  <span className="text-sm">Data Collection</span>
                </a>
                <a
                  href="#usage"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-stone-600 transition-all hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800/50"
                >
                  <Shield className="size-5" />
                  <span className="text-sm">How We Use Data</span>
                </a>
                <a
                  href="#cookies"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-stone-600 transition-all hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800/50"
                >
                  <Cookie className="size-5" />
                  <span className="text-sm">Cookies</span>
                </a>
                <a
                  href="#contact"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-stone-600 transition-all hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800/50"
                >
                  <Mail className="size-5" />
                  <span className="text-sm">Contact Us</span>
                </a>
              </nav>
              <div className="mt-10 rounded-2xl border border-primary/10 bg-primary/5 p-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-500">Need Help?</p>
                <p className="mb-4 text-sm text-stone-700 dark:text-stone-300">Have questions about your data?</p>
                <Link
                  href="/contact"
                  className="block w-full rounded-lg bg-primary py-2 text-center text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="max-w-3xl flex-1">
            <nav className="mb-6 flex items-center gap-2 text-sm text-stone-400">
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
              <span>›</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">Privacy Policy</span>
            </nav>

            <h1 className="mb-6 font-display text-4xl font-black leading-tight md:text-5xl">Privacy Policy</h1>
            <p className="mb-10 text-lg leading-relaxed text-stone-600 dark:text-stone-400">
              At Book Circle, we value your privacy and are committed to protecting your personal data. This policy outlines how we handle your information when you use our social reading platform.
            </p>

            <div className="space-y-12">
              {/* Section 1 */}
              <section id="introduction">
                <h2 className="mb-4 flex items-center gap-3 font-display text-2xl font-bold">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-sm text-primary">1</span>
                  Introduction
                </h2>
                <div className="space-y-4 text-stone-700 dark:text-stone-300">
                  <p>
                    This Privacy Policy explains how Book Circle ("we", "us", or "our") collects, uses, and shares information about you when you use our website, mobile application, and other online products and services.
                  </p>
                  <p>
                    By using Book Circle, you agree to the collection and use of information in accordance with this policy. We recommend that you read this document in its entirety to ensure you are fully informed.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="data-collection">
                <h2 className="mb-4 flex items-center gap-3 font-display text-2xl font-bold">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-sm text-primary">2</span>
                  Data Collection
                </h2>
                <div className="space-y-4 text-stone-700 dark:text-stone-300">
                  <p>We collect information you provide directly to us, such as when you create an account, join a reading group, or post a review. This includes:</p>
                  <ul className="space-y-3 pl-0 list-none">
                    <li className="flex items-start gap-3">
                      <Check className="size-5 mt-1 text-primary flex-shrink-0" />
                      <span>
                        <strong>Account Information:</strong> Name, email address, password, and profile picture.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-5 mt-1 text-primary flex-shrink-0" />
                      <span>
                        <strong>Reading Data:</strong> Books you&apos;ve read, reading progress, reviews, and library organization.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="size-5 mt-1 text-primary flex-shrink-0" />
                      <span>
                        <strong>Social Interactions:</strong> Group memberships, comments, and messages to other readers.
                      </span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 3 */}
              <section id="usage">
                <h2 className="mb-4 flex items-center gap-3 font-display text-2xl font-bold">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-sm text-primary">3</span>
                  How We Use Data
                </h2>
                <div className="space-y-4 text-stone-700 dark:text-stone-300">
                  <p>We use the information we collect to provide, maintain, and improve our services, including to:</p>
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-stone-200 bg-stone-100 p-4 dark:border-stone-800 dark:bg-stone-800/50">
                      <Shield className="mb-2 text-primary" />
                      <h4 className="mb-1 font-bold">Personalization</h4>
                      <p className="text-sm">To suggest new books and groups based on your interests.</p>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-stone-100 p-4 dark:border-stone-800 dark:bg-stone-800/50">
                      <Mail className="mb-2 text-primary" />
                      <h4 className="mb-1 font-bold">Communication</h4>
                      <p className="text-sm">To send you technical notices, updates, and support messages.</p>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-stone-100 p-4 dark:border-stone-800 dark:bg-stone-800/50">
                      <Database className="mb-2 text-primary" />
                      <h4 className="mb-1 font-bold">Analytics</h4>
                      <p className="text-sm">To monitor and analyze trends and usage of the service.</p>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-stone-100 p-4 dark:border-stone-800 dark:bg-stone-800/50">
                      <Shield className="mb-2 text-primary" />
                      <h4 className="mb-1 font-bold">Security</h4>
                      <p className="text-sm">To detect, investigate, and prevent fraudulent transactions.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section id="cookies">
                <h2 className="mb-4 flex items-center gap-3 font-display text-2xl font-bold">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-sm text-primary">4</span>
                  Cookies
                </h2>
                <div className="space-y-4 text-stone-700 dark:text-stone-300">
                  <p>
                    We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section id="contact">
                <h2 className="mb-4 flex items-center gap-3 font-display text-2xl font-bold">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-sm text-primary">5</span>
                  Contact Us
                </h2>
                <div className="space-y-4 text-stone-700 dark:text-stone-300">
                  <p>
                    If you have any questions about this Privacy Policy, please contact us at{" "}
                    <a href="mailto:privacy@bookcircle.com" className="font-bold text-primary hover:underline">
                      privacy@bookcircle.com
                    </a>
                  </p>
                </div>
              </section>

              <div className="my-12 h-px w-full bg-stone-200 dark:bg-stone-800"></div>

              <footer className="flex flex-col items-center justify-between gap-6 pb-20 md:flex-row">
                <p className="text-sm text-stone-500">© 2024 Book Circle. All rights reserved.</p>
                <div className="flex gap-6">
                  <Link href="/terms" className="text-sm text-stone-500 transition-colors hover:text-primary">
                    Terms of Service
                  </Link>
                  <Link href="/contact" className="text-sm text-stone-500 transition-colors hover:text-primary">
                    Contact Us
                  </Link>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
