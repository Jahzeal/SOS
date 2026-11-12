import React from 'react';
import Link from 'next/link';

/**
 * Footer shared by every public page.
 *
 * Contact details: the owner has not supplied an address, phone, email,
 * WhatsApp number or social links yet. Add them to CONTACT below and they
 * will appear on every public page. Nothing is shown for empty values.
 */
export const BUSINESS_NAME = 'NoxGuarda';

export const CONTACT: {
  address?: string;
  phone?: string;
  email?: string;
  whatsapp?: string; // digits only, international format, e.g. 2348012345678
  socials?: { label: string; href: string }[];
} = {};

const linkClass = 'hover:text-teal-600 transition';

export function SiteFooter({ className = '' }: { className?: string }) {
  const hasContact = Boolean(
    CONTACT.address || CONTACT.phone || CONTACT.email || CONTACT.whatsapp || CONTACT.socials?.length,
  );

  return (
    <footer className={`bg-slate-50 text-slate-700 text-sm py-12 px-6 border-t border-slate-200 ${className}`}>
      <div className={`max-w-7xl mx-auto grid grid-cols-2 ${hasContact ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-8 mb-10`}>
        <div className="space-y-3">
          <div className="font-extrabold text-slate-900 text-base">Product</div>
          <ul className="space-y-2.5 font-medium">
            <li><Link href="/features" className={linkClass}>Features</Link></li>
            <li><Link href="/laptops" className={linkClass}>Laptops</Link></li>
            <li><Link href="/pricing" className={linkClass}>Pricing &amp; Plans</Link></li>
            <li><Link href="/#verify-widget" className={linkClass}>Verify a device</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="font-extrabold text-slate-900 text-base">Help</div>
          <ul className="space-y-2.5 font-medium">
            <li><Link href="/report-stolen" className="text-rose-600 hover:text-rose-700 font-bold transition">Report a stolen device</Link></li>
            <li><Link href="/#faq" className={linkClass}>Questions &amp; answers</Link></li>
            <li><Link href="/login" className={linkClass}>Store sign in</Link></li>
            <li><Link href="/onboarding" className={linkClass}>Create a store account</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="font-extrabold text-slate-900 text-base">Legal</div>
          <ul className="space-y-2.5 font-medium">
            <li><Link href="/privacy" className={linkClass}>Privacy Policy</Link></li>
            <li><Link href="/terms" className={linkClass}>Terms of Service</Link></li>
          </ul>
        </div>

        {hasContact && (
          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-base">Contact</div>
            <ul className="space-y-2.5 font-medium">
              {CONTACT.address && <li>{CONTACT.address}</li>}
              {CONTACT.phone && (
                <li><a href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`} className={linkClass}>{CONTACT.phone}</a></li>
              )}
              {CONTACT.email && (
                <li><a href={`mailto:${CONTACT.email}`} className={linkClass}>{CONTACT.email}</a></li>
              )}
              {CONTACT.whatsapp && (
                <li>
                  <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    WhatsApp
                  </a>
                </li>
              )}
              {CONTACT.socials?.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className={linkClass}>{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200 text-xs font-semibold text-slate-600 text-center sm:text-left">
        © {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.
      </div>
    </footer>
  );
}

export default SiteFooter;
