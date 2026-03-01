import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Search, UserCog, BookMarked, Users, CreditCard, MessageSquare, Video, FileText } from "lucide-react";
import { FAQAccordion, type FAQItem } from "@/components/features/faq/FAQAccordion";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FAQ — Book Circle",
  description: "Find answers to common questions about Book Circle. Get help with account settings, reading tracker, social features, and more.",
};

const accountFAQs: FAQItem[] = [
  {
    question: "How do I change my profile picture?",
    answer: "To change your profile picture, navigate to 'Settings' by clicking on your avatar in the top right corner. Select 'Edit Profile' and then click on your current photo to upload a new one from your device. We support JPG, PNG, and GIF formats up to 5MB.",
  },
  {
    question: "Can I make my reading list private?",
    answer: "Yes, privacy is a priority at Book Circle. Go to Settings > Privacy and you can toggle your account to 'Private'. This will ensure only approved friends can see your reading progress and lists.",
  },
  {
    question: "How do I reset my password?",
    answer: "Book Circle uses OAuth authentication (Google/Apple Sign-In), so you don't need a password. If you're having trouble accessing your account, make sure you're using the same sign-in method you originally used to create your account.",
  },
  {
    question: "What happens if I delete my account?",
    answer: "Deleting your account is permanent. All your reading history, reviews, and community connections will be removed. We recommend exporting your data first if you wish to keep a record of your books.",
  },
];

const readingTrackerFAQs: FAQItem[] = [
  {
    question: "How do I log my reading sessions?",
    answer: "Simply navigate to your current book and click 'Start Reading'. Book Circle will track your session time automatically. When you're done, click 'Stop Reading' to save your progress and build your daily streak.",
  },
  {
    question: "Can I track multiple books at once?",
    answer: "Absolutely! You can have multiple books in your 'Currently Reading' list. Switch between them anytime, and each will maintain its own progress tracking and reading history.",
  },
  {
    question: "How do reading streaks work?",
    answer: "Reading streaks count consecutive days where you've logged at least one reading session. Maintaining your streak helps build a consistent reading habit. You'll get reminders to help you keep your streak alive!",
  },
  {
    question: "Can I edit or delete past reading sessions?",
    answer: "Yes, you can edit or remove reading sessions from your reading history. Go to your profile, find the session you want to modify, and click the menu icon to make changes.",
  },
];

const socialFeaturesFAQs: FAQItem[] = [
  {
    question: "What are reading rooms?",
    answer: "Reading rooms are virtual spaces where you can read alongside friends in real-time. You'll see ambient presence indicators showing when others are actively reading, creating a shared reading experience even when you're apart.",
  },
  {
    question: "How do I give kudos to other readers?",
    answer: "When you see a friend's reading activity in your feed, simply click the kudos button (thumbs up icon) to encourage them. It's a simple way to support fellow readers and build community.",
  },
  {
    question: "Can I follow my favorite authors?",
    answer: "Yes! Search for authors in the app and click 'Follow' on their profile. You'll receive notifications about their new books and can experience ambient author presence when they're active on the platform.",
  },
  {
    question: "How does buddy reading work?",
    answer: "Buddy reads let you read the same book with friends at the same pace. Create a buddy read, invite friends, set a schedule, and discuss as you go. It's perfect for book clubs and reading partners.",
  },
];

const subscriptionFAQs: FAQItem[] = [
  {
    question: "Is Book Circle free to use?",
    answer: "Yes! Book Circle offers a free tier with core features including reading tracking, basic social features, and limited reading rooms. Premium subscriptions unlock unlimited rooms, advanced analytics, and exclusive author content.",
  },
  {
    question: "What's included in the Premium subscription?",
    answer: "Premium members get unlimited reading rooms, detailed reading analytics, priority author presence notifications, custom reading goals, and ad-free experience. Plus, you support the development of new features!",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Absolutely. You can cancel your subscription at any time from Settings > Subscription. You'll continue to have Premium access until the end of your current billing period.",
  },
  {
    question: "Do you offer student or educator discounts?",
    answer: "Yes! We offer 50% off Premium subscriptions for students and educators. Verify your status through our education verification partner to unlock your discount.",
  },
];

const categories = [
  { id: "account", icon: UserCog, label: "Account & Profile", faqs: accountFAQs },
  { id: "reading", icon: BookMarked, label: "Reading Tracker", faqs: readingTrackerFAQs },
  { id: "social", icon: Users, label: "Social Features", faqs: socialFeaturesFAQs },
  { id: "subscription", icon: CreditCard, label: "Subscriptions", faqs: subscriptionFAQs },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-warm-cream dark:bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 px-6 py-4 backdrop-blur-xl dark:border-stone-800 dark:bg-background/80 md:px-20">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="flex size-8 items-center justify-center text-primary">
              <BookOpen className="size-8" />
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-tight text-stone-900 dark:text-stone-100">
              Book Circle
            </h2>
          </Link>
          <div className="hidden items-center gap-9 md:flex">
            <nav className="flex items-center gap-9">
              <Link
                href="/#features"
                className="text-sm font-medium text-stone-700 transition-colors hover:text-primary dark:text-stone-300"
              >
                Discover
              </Link>
              <Link
                href="/home"
                className="text-sm font-medium text-stone-700 transition-colors hover:text-primary dark:text-stone-300"
              >
                My Books
              </Link>
              <Link
                href="/#community"
                className="text-sm font-medium text-stone-700 transition-colors hover:text-primary dark:text-stone-300"
              >
                Community
              </Link>
              <Link
                href="/faq"
                className="border-b-2 border-primary text-sm font-bold text-primary"
              >
                Support
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <Button asChild className="h-10 min-w-[84px] rounded-lg px-4">
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 justify-center px-6 py-10 md:px-20">
        <div className="flex w-full max-w-[960px] flex-col">
          {/* Hero Section */}
          <section className="mb-12 text-center md:text-left">
            <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-stone-900 dark:text-stone-100 md:text-5xl">
              How can we help you today?
            </h1>
            <div className="relative w-full max-w-2xl">
              <label className="flex w-full flex-col">
                <div className="flex h-14 w-full items-stretch overflow-hidden rounded-xl border border-stone-200 shadow-sm dark:border-stone-800">
                  <div className="flex items-center justify-center bg-white pl-5 text-stone-400 dark:bg-stone-900">
                    <Search className="size-5" />
                  </div>
                  <input
                    className="form-input flex min-w-0 flex-1 border-none bg-white px-4 text-lg font-normal text-stone-900 placeholder:text-stone-400 focus:ring-0 dark:bg-stone-900 dark:text-stone-100"
                    placeholder="Search for questions, features, or tutorials"
                    type="search"
                  />
                </div>
              </label>
            </div>
          </section>

          {/* Category Navigation */}
          <nav className="mb-10">
            <div className="no-scrollbar flex gap-4 overflow-x-auto border-b border-stone-200 dark:border-stone-800 md:gap-12">
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <a
                    key={category.id}
                    href={`#${category.id}`}
                    className={`group flex min-w-[120px] flex-col items-center justify-center gap-2 border-b-[3px] pb-4 pt-2 transition-all ${
                      index === 0
                        ? "border-primary text-primary"
                        : "border-transparent text-stone-500 hover:border-primary/50 hover:text-primary"
                    }`}
                  >
                    <Icon className="size-6" />
                    <p className="text-sm font-bold tracking-wide">{category.label}</p>
                  </a>
                );
              })}
            </div>
          </nav>

          {/* FAQ Sections */}
          {categories.map((category) => (
            <section key={category.id} id={category.id} className="mb-12 scroll-mt-24">
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                {category.label} FAQs
              </h2>
              <FAQAccordion items={category.faqs} />
            </section>
          ))}

          {/* Still Need Help Section */}
          <section className="mb-20 mt-16 rounded-2xl border border-primary/20 bg-primary/10 p-8 text-center">
            <h3 className="mb-3 text-2xl font-bold text-stone-900 dark:text-stone-100">
              Still need help?
            </h3>
            <p className="mx-auto mb-6 max-w-md text-stone-600 dark:text-stone-400">
              Our support team is available Monday through Friday to assist you with any technical
              issues or account questions.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="min-w-[160px] rounded-lg shadow-md">
                <Link href="/contact">Contact Us</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="min-w-[160px] rounded-lg border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800"
              >
                <a href="mailto:support@bookcircle.app">Email Support</a>
              </Button>
            </div>
          </section>

          {/* Resource Cards */}
          <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center rounded-xl border border-stone-200 bg-white p-6 text-center dark:border-stone-800 dark:bg-stone-900">
              <MessageSquare className="mb-4 size-10 text-primary" />
              <h4 className="mb-2 font-bold">Community Forum</h4>
              <p className="text-sm text-stone-500">
                Ask the community for tips and book recommendations.
              </p>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-stone-200 bg-white p-6 text-center dark:border-stone-800 dark:bg-stone-900">
              <Video className="mb-4 size-10 text-primary" />
              <h4 className="mb-2 font-bold">Video Tutorials</h4>
              <p className="text-sm text-stone-500">
                Visual guides on how to use all the Book Circle features.
              </p>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-stone-200 bg-white p-6 text-center dark:border-stone-800 dark:bg-stone-900">
              <FileText className="mb-4 size-10 text-primary" />
              <h4 className="mb-2 font-bold">Developer API</h4>
              <p className="text-sm text-stone-500">
                Documentation for integrating with the Book Circle platform.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white px-6 py-10 dark:border-stone-800 dark:bg-background md:px-20">
        <div className="mx-auto flex max-w-[960px] flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <BookOpen className="text-primary" />
            <span className="font-bold">Book Circle</span>
            <span className="ml-2 text-sm text-stone-400">© 2024</span>
          </div>
          <div className="flex gap-6 text-sm text-stone-500 dark:text-stone-400">
            <Link href="/privacy" className="hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-primary">
              Cookie Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
