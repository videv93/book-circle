import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, HelpCircle, MapPin, Mail, ArrowRight } from "lucide-react";
import { DarkModeToggle } from "@/components/layout/DarkModeToggle";

export const metadata: Metadata = {
  title: "Contact Us — Book Circle",
  description: "Get in touch with the Book Circle team. We're here to help with your reading journey.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-warm-cream dark:bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-stone-200/50 bg-warm-cream/80 backdrop-blur-xl dark:border-stone-800/50 dark:bg-background/80">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-20">
          <Link href="/" className="flex items-center gap-3 text-primary">
            <BookOpen className="size-8" />
            <h2 className="font-display text-xl font-bold tracking-tight">Book Circle</h2>
          </Link>
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <Link
              href="/login"
              className="flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
            >
              Log In
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-12 lg:px-20">
        <section className="mb-12">
          <h1 className="mb-4 font-display text-5xl font-black leading-tight tracking-tight">Get in touch</h1>
          <p className="max-w-2xl text-lg text-stone-600 dark:text-stone-400">
            We&apos;re here to help you with your reading journey. Whether you have a question about your account or just want to talk about books, send us a message!
          </p>
        </section>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          {/* Contact Form */}
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900/40 lg:col-span-7">
            <h3 className="mb-8 text-2xl font-bold">Send us a message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Name</label>
                  <input
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-4 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-stone-700 dark:bg-stone-800/50"
                    placeholder="Your name"
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Email</label>
                  <input
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-4 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-stone-700 dark:bg-stone-800/50"
                    placeholder="your@email.com"
                    type="email"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Subject</label>
                <input
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-4 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-stone-700 dark:bg-stone-800/50"
                  placeholder="What is this about?"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Message</label>
                <textarea
                  className="w-full resize-none rounded-lg border border-stone-200 bg-stone-50 p-4 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-stone-700 dark:bg-stone-800/50"
                  placeholder="How can we help?"
                  rows={5}
                ></textarea>
              </div>
              <button
                className="w-full rounded-lg bg-primary px-10 py-4 font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 md:w-auto"
                type="submit"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-10 lg:col-span-5">
            {/* Image with quote */}
            <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2PQHrA7HgziK6UYgSMY2due4c-_qpIp3FF650npFhdvTTSOGWAFYIW-HGydIkeTQkzHaEtxTWNqxvMnVjbcStp54EdL5o0hp0u5ACaQSTdwXi2izNc7n-M5BxNosn43nQfYGoAE7LGjeuHbg_47e5QOje0PoANto7RrvRCfu9ISxFEOSl_QpKaOoLmc9tbQJYE4okXwBjUERGTx-K3S3puxZDGZoAI5RmGV_6k5wNAxKVE0FdGC-GPuoCkVvSTyulEwjwvHF_hkc"
                alt="Person reading a book comfortably"
                width={600}
                height={450}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-stone-900/60 to-transparent p-8">
                <p className="font-display text-xl font-medium italic text-white">&quot;A reader lives a thousand lives before he dies.&quot;</p>
              </div>
            </div>

            {/* Contact info cards */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <HelpCircle className="size-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Have a question?</h4>
                  <p className="mb-2 text-stone-600 dark:text-stone-400">Check our help center for quick answers.</p>
                  <Link href="#" className="flex items-center gap-1 font-bold text-primary hover:underline">
                    View Common FAQs
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="size-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Visit our office</h4>
                  <p className="text-stone-600 dark:text-stone-400">
                    123 Reader&apos;s Way, Suite 400
                    <br />
                    Literary District, Portland, OR 97201
                  </p>
                  <div className="mt-4 size-full overflow-hidden rounded-xl border border-stone-200 contrast-125 grayscale opacity-80 dark:border-stone-800">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRt-prUgNSgyNFjiKQp-lhqBZyqLf9itQSFZ748QII1mu1ix3sSGcHTPqOq3fGPmNkmak45ARs4DnVtO47k8fqnbg0avQJ5ZPuLmHb9rDrWmd4cpcCKxSbEqecoXoOqcM_N9Q3GqY_mtyCG-1PvMRAsaQBUH2SETx21kowDqaiXwduh72mYqtKDoW8Bnr-tddD421cgICqTUfHLwKWKfwHD98a-llO03ehSjb6poHD5KgbhM3_oBYUIh3afeNAxXv6hXIq1QwatuA"
                      alt="Map of Portland city"
                      width={400}
                      height={128}
                      className="size-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mail className="size-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Partnerships</h4>
                  <p className="text-stone-600 dark:text-stone-400">For publisher inquiries or brand collaborations, email us at:</p>
                  <a href="mailto:partners@bookcircle.com" className="font-bold text-primary hover:underline">
                    partners@bookcircle.com
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/10 bg-white px-6 py-12 dark:bg-background lg:px-20">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-3 text-stone-400">
            <BookOpen className="size-6" />
            <span className="text-sm font-medium">© 2024 Book Circle Inc.</span>
          </div>
          <div className="flex gap-8">
            <Link href="/privacy" className="text-sm text-stone-500 transition-colors hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-stone-500 transition-colors hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
