import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/marketing/LegalPage';
import { BUSINESS_NAME, CONTACT } from '@/components/marketing/SiteFooter';

export const metadata: Metadata = {
  title: 'Terms of Service — NoxGuarda',
  description:
    'The terms for stores using NoxGuarda, for buyers checking a device, and for anyone reporting a stolen phone or laptop.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="12 November 2026">
      <section>
        <h2>1. About these terms</h2>
        <p>
          These terms apply to everyone who uses {BUSINESS_NAME}: stores with an account, buyers who check a device,
          and people who report a device as stolen or lost. By using the service you agree to them.
          [Registered business name and address of the company providing the service to be inserted.]
        </p>
      </section>

      <section>
        <h2>2. Store accounts</h2>
        <ul>
          <li>You must give accurate details about yourself and your business and keep your password private.</li>
          <li>You are responsible for everything done through your account.</li>
          <li>You must be at least 18 and able to enter a contract on behalf of your business.</li>
        </ul>
      </section>

      <section>
        <h2>3. Plans and payment</h2>
        <ul>
          <li>The Free plan costs nothing and is limited to the number of devices shown on the <Link href="/pricing">pricing page</Link>.</li>
          <li>Paid plans are charged in naira, monthly or yearly, through Paystack.</li>
          <li>Prices and plan limits are those shown on the pricing page when you pay.</li>
          <li>[Renewal, cancellation and refund terms to be confirmed.]</li>
        </ul>
      </section>

      <section>
        <h2>4. Your records and your customers</h2>
        <ul>
          <li>The stock, sales, customer and repair records you enter belong to you.</li>
          <li>
            You must only register devices you lawfully hold, and you must have a lawful reason to record your
            customers&apos; personal details. You are the data controller for those details; see the{' '}
            <Link href="/privacy">Privacy Policy</Link>.
          </li>
          <li>Receipts, invoices, quotations and warranties are issued by you, not by {BUSINESS_NAME}. You are responsible for honouring them.</li>
        </ul>
      </section>

      <section>
        <h2>5. Checking a device</h2>
        <p>
          A device check shows what stores and owners have recorded in {BUSINESS_NAME}. It is not a guarantee from a
          manufacturer, a network or the police. &quot;Not found&quot; means only that no {BUSINESS_NAME} store has
          registered the device and no one has reported it stolen here. Use the result as one piece of information
          before you buy.
        </p>
      </section>

      <section>
        <h2>6. Reporting a stolen or lost device</h2>
        <ul>
          <li>Only report a device you own or are authorised to report, and only if it has really been stolen or lost.</li>
          <li>
            By submitting a report you agree that the device brand and model, your note and a partly hidden phone
            number are shown publicly, and that signed-in stores can see your full phone number. Your email address
            is not shown.
          </li>
          <li>Mark the report as recovered when you get the device back.</li>
          <li>False or malicious reports may be removed and the account blocked.</li>
          <li>A report here does not replace a police report and does not block the device on any mobile network.</li>
        </ul>
      </section>

      <section>
        <h2>7. What you must not do</h2>
        <ul>
          <li>Use the service to sell, hide or disguise stolen devices.</li>
          <li>Enter false records, or impersonate another person or business.</li>
          <li>Collect other people&apos;s data from the service in bulk, or try to get around its limits or security.</li>
        </ul>
      </section>

      <section>
        <h2>8. Availability</h2>
        <p>
          We work to keep the service running but do not promise it will always be available or free of errors.
          Features may change. Keep your own copies of important documents.
        </p>
      </section>

      <section>
        <h2>9. Liability</h2>
        <p>
          [Limitation of liability wording to be drafted by a lawyer in line with Nigerian law, including the Federal
          Competition and Consumer Protection Act 2018.]
        </p>
      </section>

      <section>
        <h2>10. Ending an account</h2>
        <p>
          You can stop using the service at any time. We may suspend or close an account that breaks these terms.
          [Notice period and how a store can obtain its records on closure to be confirmed.]
        </p>
      </section>

      <section>
        <h2>11. Governing law</h2>
        <p>These terms are governed by the laws of the Federal Republic of Nigeria. [Courts or dispute process to be confirmed.]</p>
      </section>

      <section>
        <h2>12. Contact</h2>
        {CONTACT.email || CONTACT.phone || CONTACT.address ? (
          <ul>
            {CONTACT.email && <li>Email: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>}
            {CONTACT.phone && <li>Phone: {CONTACT.phone}</li>}
            {CONTACT.address && <li>Address: {CONTACT.address}</li>}
          </ul>
        ) : (
          <p>[Contact email, phone number and address to be inserted.]</p>
        )}
      </section>
    </LegalPage>
  );
}
