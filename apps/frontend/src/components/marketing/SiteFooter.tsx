import React from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { WhatsAppIcon, InstagramIcon, XIcon, TikTokIcon } from './SocialIcons';

/**
 * Footer shared by every public page.
 *
 * Fill in CONTACT below with NoxGuarda's real details. Anything left empty is
 * simply not shown, so a visitor never lands on a wrong number or a dead page.
 * The "Contact us" form always shows: its messages are emailed to the inbox set
 * on the server (CONTACT_INBOX_EMAIL, or the alert email in Admin → Settings).
 */
export const BUSINESS_NAME = 'NoxGuarda';

export const CONTACT: {
  address?: string;
  phone?: string;
  email?: string;
  whatsapp?: string; // digits only, international format, e.g. 2348012345678
  instagram?: string; // full link, e.g. https://www.instagram.com/noxguarda
  x?: string; // full link, e.g. https://x.com/noxguarda
  tiktok?: string; // full link, e.g. https://www.tiktok.com/@noxguarda
} = {
  whatsapp: '2348140724619', // 0814 072 4619
};

/** Link that opens a WhatsApp chat with NoxGuarda, or null if no number is set. */
export function whatsappChatUrl(text = 'Hello NoxGuarda, I have a question.'): string | null {
  const digits = (CONTACT.whatsapp || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
}

const linkClass = 'hover:text-teal-600 transition';

export function SiteFooter({ className = '' }: { className?: string }) {
  const chatUrl = whatsappChatUrl();
  const socials = [
    { label: 'Instagram', href: CONTACT.instagram, Icon: InstagramIcon },
    { label: 'X', href: CONTACT.x, Icon: XIcon },
    { label: 'TikTok', href: CONTACT.tiktok, Icon: TikTokIcon },
  ].filter((s) => s.href);

  return (
    <footer className={`bg-slate-50 text-slate-700 text-sm py-12 px-6 border-t border-slate-200 ${className}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
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

        <div className="space-y-3 col-span-2 md:col-span-1">
          <div className="font-extrabold text-slate-900 text-base">Talk to us</div>
          <div className="flex flex-col gap-2 max-w-xs">
            {chatUrl && (
              <a
                href={chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold text-sm shadow-sm transition"
              >
                <WhatsAppIcon className="w-4 h-4" /> Chat with us on WhatsApp
              </a>
            )}
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-teal-600 hover:text-teal-700 text-slate-800 font-bold text-sm transition"
            >
              <Mail className="w-4 h-4" /> Contact us
            </Link>
          </div>

          {(CONTACT.address || CONTACT.phone || CONTACT.email) && (
            <ul className="space-y-1.5 font-medium pt-1">
              {CONTACT.address && <li>{CONTACT.address}</li>}
              {CONTACT.phone && (
                <li><a href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`} className={linkClass}>{CONTACT.phone}</a></li>
              )}
              {CONTACT.email && (
                <li><a href={`mailto:${CONTACT.email}`} className={linkClass}>{CONTACT.email}</a></li>
              )}
            </ul>
          )}

          {socials.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${BUSINESS_NAME} on ${label}`}
                  title={label}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-white hover:bg-slate-900 hover:border-slate-900 flex items-center justify-center transition"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200 text-xs font-semibold text-slate-600 text-center sm:text-left">
        © {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.
      </div>
    </footer>
  );
}

export default SiteFooter;
