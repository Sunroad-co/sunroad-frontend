import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

// Force static generation with no revalidation
export const dynamic = "force-static";
export const revalidate = false;

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Privacy Policy – Sun Road Co.",
  description: "How Sun Road Co. collects, uses, and protects your data.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy – Sun Road Co.",
    description: "How Sun Road Co. collects, uses, and protects your data.",
    url: "/privacy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy – Sun Road Co.",
    description: "How Sun Road Co. collects, uses, and protects your data.",
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-sunroad-brown-900 mb-6">
          Privacy Policy
        </h1>
        
        <div className="text-sm text-sunroad-brown-600 mb-8 space-y-1">
          <p><strong>Effective Date:</strong> February 4, 2026</p>
          <p><strong>Last Updated:</strong> February 4, 2026</p>
        </div>

        <div className="prose prose-sunroad max-w-none text-sunroad-brown-700 space-y-6">
          <p>
            Sun Road Co. (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates sunroad.io, a SaaS search platform that allows users to perform searches, access results, and use related features (the &quot;Service&quot;).
          </p>
          
          <p>
            We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service, website, or related applications. By accessing or using the Service, you agree to the practices described in this policy. If you do not agree, please do not use the Service.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            1. Information We Collect
          </h2>
          <p>We collect information in the following categories:</p>
          
          <h3 className="text-xl font-display font-semibold text-sunroad-brown-900 mt-6 mb-3">
            a. Information You Provide Directly
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account registration: name, email address, password, and any profile details you add.</li>
            <li>Payment information (handled by third-party processors — we do not store full card details).</li>
            <li>Communications: messages sent to support, feedback, or other voluntary submissions.</li>
            <li>Search queries (if you are logged in and have opted in to personalized features).</li>
          </ul>

          <h3 className="text-xl font-display font-semibold text-sunroad-brown-900 mt-6 mb-3">
            b. Information Collected Automatically
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Usage data: search queries (anonymized where possible), clicked results, timestamps, session duration, and feature interactions.</li>
            <li>Device and log data: IP address, browser type/version, operating system, device identifiers, referring pages, and pages visited.</li>
            <li>Cookies and similar technologies: We use cookies, pixels, and similar tools for functionality, analytics, and (if applicable) limited advertising. See our [Cookie Policy] section below for details.</li>
          </ul>

          <h3 className="text-xl font-display font-semibold text-sunroad-brown-900 mt-6 mb-3">
            c. Search-Specific Data
          </h3>
          <p>
            As a search service, we process your search queries to deliver results. We aim to minimize personal data retention:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Anonymous searches (not logged in): We do not link queries to identifiable users and delete logs after a short period (e.g., 30 days for abuse prevention and service improvement).</li>
            <li>Logged-in / personalized searches: Queries may be stored to provide features like search history, recommendations, or saved searches (you can delete or disable this).</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your search history or queries to third parties for advertising purposes.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            2. How We Use Your Information
          </h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve the Service (e.g., deliver relevant search results, fix bugs, develop new features).</li>
            <li>Process subscriptions, payments, and account management.</li>
            <li>Communicate with you (e.g., service announcements, support responses, optional newsletters).</li>
            <li>Detect, prevent, and address fraud, abuse, security issues, or technical problems.</li>
            <li>Comply with legal obligations, enforce our Terms of Service, and protect our rights.</li>
            <li>Conduct aggregated/anonymized analytics and research (no personal identifiers).</li>
          </ul>
          <p>
            We do not use your personal data for targeted advertising based on your search behavior unless you explicitly opt in.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            3. Sharing and Disclosure of Information
          </h2>
          <p>
            We do <strong>not</strong> sell your personal information. We may share data only in limited cases:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>With service providers (e.g., cloud hosting, analytics tools like Google Analytics [anonymized], payment processors like Stripe, email services) under strict confidentiality agreements.</li>
            <li>To comply with legal requirements (court orders, subpoenas, regulatory requests).</li>
            <li>In connection with a merger, acquisition, or sale of assets (with notice where required).</li>
            <li>To protect the safety, rights, or property of our users, the public, or our company.</li>
          </ul>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            4. Data Retention
          </h2>
          <p>
            We retain personal data only as long as necessary for the purposes outlined here or as required by law:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account data: retained while your account is active + a reasonable period after closure (for backups/legal reasons).</li>
            <li>Search logs: anonymized short-term retention (days to months); personal linked data deletable by you.</li>
          </ul>
          <p>
            You can request deletion of your account and associated data (subject to legal retention obligations).
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            5. Your Privacy Rights
          </h2>
          <p>
            Depending on your location, you may have rights such as:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access, correction, or deletion of your personal data.</li>
            <li>Opt-out of certain processing (e.g., personalized features).</li>
            <li>Object to or restrict processing.</li>
            <li>Data portability.</li>
            <li>Withdraw consent (where processing is consent-based).</li>
          </ul>
          <p>
            To exercise rights, contact us at <a href="mailto:support@sunroad.io" className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline">support@sunroad.io</a>. We respond within legally required timeframes (e.g., 30–45 days).
          </p>
          <p>
            For California residents (CCPA/CPRA): We provide additional disclosures [link to CCPA section if needed]. We do not &quot;sell&quot; personal information as defined under CCPA.
          </p>
          <p>
            For EU/EEA/UK residents (GDPR/UK GDPR): Our legal bases include contract performance, legitimate interests, consent, and legal obligations. We use EU-approved safeguards for international transfers (e.g., Standard Contractual Clauses).
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            6. Security
          </h2>
          <p>
            We implement reasonable technical and organizational measures to protect your data (encryption in transit/rest, access controls, regular security reviews). However, no system is 100% secure — we cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            7. Cookies and Tracking Technologies
          </h2>
          <p>
            We use necessary cookies for core functionality. Optional analytics cookies help improve the Service. You can manage preferences via your browser or our cookie banner. Third-party partners (e.g., analytics providers) may set cookies — see their policies.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            8. Children&apos;s Privacy
          </h2>
          <p>
            Our Service is not directed to children under 13 (or 16 in some jurisdictions). We do not knowingly collect personal data from children. If we learn we have, we will delete it. Contact us if you believe a child has provided us data.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            9. International Transfers
          </h2>
          <p>
            If you are outside the United States, your data may be transferred to and processed in other countries with different privacy laws. We use appropriate safeguards.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            10. Changes to This Policy
          </h2>
          <p>
            We may update this policy. We will post the revised version here with an updated effective date. For material changes, we may notify you via email or in-app notice.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            11. Contact Us
          </h2>
          <p>For questions or concerns:</p>
          <p>
            Sun Road Co.<br />
            Email: <a href="mailto:support@sunroad.io" className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline">support@sunroad.io</a>
          </p>
          <p className="mt-6">
            Thank you for trusting us with your searches.
          </p>
        </div>
      </article>
    </main>
  );
}
