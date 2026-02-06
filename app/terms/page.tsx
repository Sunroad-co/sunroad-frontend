import type { Metadata } from "next";
import Link from "next/link";

// Force static generation with no revalidation
export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Terms of Use – Sun Road Co.",
  description: "Terms and conditions for using Sun Road Co. services and platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-sunroad-brown-900 mb-6">
          Terms of Use – Sun Road Co.
        </h1>
        
        <div className="text-sm text-sunroad-brown-600 mb-8 space-y-1">
          <p><strong>Last updated:</strong> February 5, 2026</p>
        </div>

        <div className="prose prose-sunroad max-w-none text-sunroad-brown-700 space-y-6">
          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            1. Who we are
          </h2>
          <p>
            Sun Road Co. (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the website and related services (collectively, the &quot;Services&quot;). We are a search platform for local creatives.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            2. Agreement
          </h2>
          <p>
            By accessing or using the Services, you agree to these Terms of Use. If you do not agree, you must stop using the Services immediately.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            3. Age requirement
          </h2>
          <p>
            You must be at least 13 years old to use the Services. If you are under 18 (or the age of majority in your jurisdiction), you must have permission from a parent or guardian who agrees to these terms.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            4. Changes to terms
          </h2>
          <p>
            We may update these terms. Changes take effect when posted or when we notify you (e.g., via email to <a href="mailto:support@sunroad.io" className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline">support@sunroad.io</a>). Continued use after the effective date means you accept the changes.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            5. Our intellectual property
          </h2>
          <p>
            We own (or license) all content, trademarks, logos, software, designs, text, images, audio, and video on the Services (&quot;Content&quot; and &quot;Marks&quot;).
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You may view and download Content only for your personal, non-commercial use.</li>
            <li>You may not copy, reproduce, distribute, sell, or exploit any Content or Marks for commercial purposes without our prior written permission.</li>
          </ul>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            6. Your submissions and contributions
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Submissions</strong> (e.g., questions, feedback, ideas sent directly to us): You grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, distribute, and display them for operating, improving, and promoting the Services.
            </li>
            <li>
              <strong>User Content Ownership and License:</strong> You retain all ownership rights, title, and interest (including all intellectual property rights) in and to any Contributions (e.g., posts, comments, photos, videos, artwork, reviews, or other materials you upload or share on the Services). By uploading or sharing Contributions, you grant us a limited, non-exclusive, royalty-free, worldwide license to host, store, display, reproduce (including for thumbnails and previews), distribute, and make available your Contributions solely as necessary to provide, operate, promote (in a non-commercial manner, such as featuring your work within the Services), and improve the Services. This license does not include the right to sublicense your Contributions to third parties for their independent commercial use, nor does it allow us to modify your Contributions beyond technical formatting or to use them in external advertising or for any purpose outside operating the Services. The license terminates when you delete the applicable Contribution or your account (subject to any reasonable backup or archival retention periods required for legal or operational reasons). You are solely responsible for your Contributions, including ensuring you have all necessary rights to upload and share them.
            </li>
            <li>You are fully responsible for everything you post/upload. You must have all necessary rights and permissions. You agree to indemnify us for any claims arising from your content.</li>
            <li>We may remove or edit any content at any time if we believe it violates these terms or is harmful.</li>
          </ul>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            7. User representations
          </h2>
          <p>You represent that:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>All information you provide is accurate and current</li>
            <li>You will comply with these terms</li>
            <li>You are not using the Services for any illegal or unauthorized purpose</li>
            <li>Your use does not violate any applicable law</li>
          </ul>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            8. Prohibited activities (summary)
          </h2>
          <p>You may not:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Scrape, copy, or systematically collect data from the Services</li>
            <li>Harass, harm, defraud, or mislead others</li>
            <li>Upload viruses, spam, or malicious content</li>
            <li>Users are not permitted to upload, post, share, or otherwise make available any content that is sexually explicit, pornographic, obscene, or otherwise adult-oriented in nature (including but not limited to nudity, depictions of sexual acts, or graphic erotic material). Violation of this restriction may result in immediate removal of the content, suspension or termination of the user&apos;s account, and/or other enforcement actions at the Company&apos;s sole discretion.</li>
            <li>Circumvent security features or interfere with the Services</li>
            <li>Impersonate others or use fake accounts</li>
            <li>Use automated tools (bots, scrapers) without permission</li>
            <li>Sell or transfer your profile/account</li>
            <li>Use the Services for any commercial purpose not approved by us</li>
          </ul>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            9. Purchases, payments &amp; subscriptions
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We accept major credit cards and PayPal</li>
            <li>All sales are final; subscriptions auto-renew until canceled</li>
            <li>You can cancel anytime via your account (effective at end of current billing period)</li>
            <li>We may change prices with notice as required by law</li>
          </ul>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            10. Privacy
          </h2>
          <p>
            Our <Link href="/privacy" prefetch={false} className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline">Privacy Policy</Link> is part of these terms. By using the Services, you agree to it. Data is processed in the United States.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            11. Disclaimer &amp; limitation of liability
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Services are provided &quot;as is&quot; without warranties.</li>
            <li>We are not liable for indirect, consequential, or punitive damages.</li>
            <li>Our total liability is limited to the amount you paid us in the 6 months before any claim (if any).</li>
          </ul>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            12. Indemnification
          </h2>
          <p>
            You agree to defend and indemnify us against claims arising from your content, your use of the Services, or your breach of these terms.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            13. Termination
          </h2>
          <p>
            We may suspend or terminate your access at any time, for any reason, without notice.
          </p>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            14. Governing law &amp; disputes
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Oklahoma law applies.</li>
            <li>Disputes first go through informal negotiation (30 days).</li>
            <li>Unresolved disputes go to binding arbitration (AAA rules) in Oklahoma, with limited exceptions (e.g., IP claims, injunctive relief).</li>
          </ul>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            15. Miscellaneous
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>These terms are the full agreement.</li>
            <li>If any part is invalid, the rest remains enforceable.</li>
            <li>No waiver of rights unless in writing.</li>
          </ul>

          <h2 className="text-2xl font-display font-semibold text-sunroad-brown-900 mt-8 mb-4">
            16. Contact us
          </h2>
          <p>
            Email: <a href="mailto:support@sunroad.io" className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline">support@sunroad.io</a>
          </p>
        </div>
      </article>
    </main>
  );
}
