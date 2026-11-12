import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/marketing/LegalPage';
import { BUSINESS_NAME, CONTACT } from '@/components/marketing/SiteFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy — NoxGuarda',
  description:
    'What personal data NoxGuarda collects from stores, their customers and people who report stolen devices, why, who can see it, how long it is kept, and your rights under the Nigeria Data Protection Act 2023.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="12 November 2026">
      <section>
        <h2>1. Who we are</h2>
        <p>
          {BUSINESS_NAME} is an online service for sellers of phones, laptops and accessories in Nigeria. Stores use it
          to record stock, issue receipts, invoices and quotations, track repairs, and let buyers check a device by
          QR code, IMEI or serial number. It also runs a public registry of devices reported stolen.
        </p>
        <p>
          This policy explains how personal data is handled under the Nigeria Data Protection Act 2023 (NDPA).
          [Registered business name, registration number and address of the data controller to be inserted.]
        </p>
      </section>

      <section>
        <h2>2. Our role</h2>
        <ul>
          <li>
            <strong>Store accounts and stolen-device reports:</strong> {BUSINESS_NAME} decides how this data is used
            and is the data controller.
          </li>
          <li>
            <strong>Records a store keeps about its own customers</strong> (names, phone numbers, sales, repairs): the
            store is the data controller and {BUSINESS_NAME} processes that data on the store&apos;s behalf. Buyers
            should contact the store first about those records.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. What we collect</h2>
        <p><strong>From store owners</strong></p>
        <ul>
          <li>Name, email address and password (the password is stored only as a one-way hash).</li>
          <li>Business name, address, phone number, email and logo.</li>
          <li>Optional bank account details and tax ID, if the store adds them to print on invoices and quotations.</li>
          <li>Subscription plan and payment history. Card details are entered with Paystack and are not stored by us.</li>
        </ul>
        <p><strong>Entered by stores about their customers</strong></p>
        <ul>
          <li>Customer name, phone number and, where given, email address, address and notes.</li>
          <li>Sales, invoices, quotations, instalments, payments and repair tickets linked to that customer.</li>
        </ul>
        <p><strong>About devices</strong></p>
        <ul>
          <li>IMEI numbers, serial number, brand, model, colour, storage, condition, prices and warranty period.</li>
        </ul>
        <p><strong>From people who report a stolen or lost device</strong></p>
        <ul>
          <li>Name and email address from the Google account used to sign in.</li>
          <li>A contact phone number, the device&apos;s IMEI or serial number, brand, model and colour.</li>
          <li>Optionally a note, a reward amount and a police case number.</li>
        </ul>
        <p><strong>From anyone who checks a device</strong></p>
        <ul>
          <li>The IMEI or serial number searched, the result, the IP address and the browser type.</li>
        </ul>
        <p><strong>Stored on your device</strong></p>
        <ul>
          <li>
            Sign-in tokens and display preferences are kept in your browser&apos;s local storage so you stay signed in.
            We do not use advertising or tracking cookies. [Confirm no analytics tools are added before launch.]
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Why we use it and our lawful basis</h2>
        <ul>
          <li>To provide the service a store signed up for — performance of a contract.</li>
          <li>To take subscription payments and keep payment records — contract and legal obligation.</li>
          <li>
            To publish stolen-device alerts and show them to stores and buyers — the consent of the person reporting,
            given when the report is submitted.
          </li>
          <li>
            To send service emails: verification codes, password resets, quotations, payment confirmations and
            instalment reminders a store has switched on — contract and legitimate interest.
          </li>
          <li>
            To prevent abuse, limit repeated requests and investigate errors — legitimate interest in keeping the
            service secure.
          </li>
        </ul>
        <p>We do not sell personal data and do not use it for advertising.</p>
      </section>

      <section>
        <h2>5. Who can see it</h2>
        <ul>
          <li><strong>Each store</strong> sees only its own customers, devices, sales and repairs.</li>
          <li>
            <strong>Anyone checking a device</strong> can see whether it is registered, the selling store&apos;s name,
            the device model and its warranty status. Buyer names and contact details are not shown.
          </li>
          <li>
            <strong>Stolen-device reports:</strong> the public sees the brand and model, the owner&apos;s note and a
            partly hidden phone number. The owner&apos;s email address is never shown. Signed-in stores see the full
            phone number so they can contact the owner if the device is brought to them.
          </li>
          <li><strong>{BUSINESS_NAME} staff</strong> who need access to run and support the service.</li>
          <li>
            <strong>Service providers</strong> acting on our instructions: Paystack (payments), Google (sign-in for
            reports), our email delivery provider, and our hosting and database providers. [List providers and the
            countries where data is stored; confirm the basis for any transfer outside Nigeria under the NDPA.]
          </li>
          <li>Law enforcement or regulators, where the law requires it.</li>
        </ul>
      </section>

      <section>
        <h2>6. How long we keep it</h2>
        <ul>
          <li>Store account and business records: while the account is open, then [period to be confirmed] after closure.</li>
          <li>Sales, invoice and payment records: [period to be confirmed, in line with Nigerian tax and accounting rules].</li>
          <li>
            Stolen-device reports: until the owner marks the device as recovered or asks for removal; resolved reports
            are kept for [period to be confirmed].
          </li>
          <li>Device check logs and error logs: [period to be confirmed].</li>
        </ul>
      </section>

      <section>
        <h2>7. Your rights</h2>
        <p>Under the NDPA you can ask to:</p>
        <ul>
          <li>see the personal data held about you and receive a copy;</li>
          <li>have inaccurate data corrected;</li>
          <li>have data deleted where there is no lawful reason to keep it;</li>
          <li>restrict or object to how it is used;</li>
          <li>withdraw consent at any time, for example by marking a stolen-device report as recovered;</li>
          <li>receive your data in a portable format.</li>
        </ul>
        <p>
          You can also complain to the Nigeria Data Protection Commission (NDPC) at{' '}
          <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer">ndpc.gov.ng</a>.
        </p>
      </section>

      <section>
        <h2>8. Security</h2>
        <p>
          Data is sent over encrypted connections, passwords are stored as hashes, each store&apos;s records are kept
          separate from other stores&apos;, and repeated requests are rate limited. No online service can promise
          absolute security; if a breach puts your data at risk we will tell you and the NDPC as the law requires.
        </p>
      </section>

      <section>
        <h2>9. Children</h2>
        <p>The service is meant for businesses and adults. It is not directed at anyone under 18.</p>
      </section>

      <section>
        <h2>10. Contact</h2>
        {CONTACT.email || CONTACT.phone || CONTACT.address ? (
          <ul>
            {CONTACT.email && <li>Email: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>}
            {CONTACT.phone && <li>Phone: {CONTACT.phone}</li>}
            {CONTACT.address && <li>Address: {CONTACT.address}</li>}
          </ul>
        ) : (
          <p>[Contact email, phone number and postal address for privacy requests to be inserted.]</p>
        )}
        <p>[Name and contact of the Data Protection Officer, if one must be appointed.]</p>
      </section>

      <section>
        <h2>11. Changes</h2>
        <p>
          If this policy changes, the new version will be posted on this page with a new date. See also the{' '}
          <Link href="/terms">Terms of Service</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
