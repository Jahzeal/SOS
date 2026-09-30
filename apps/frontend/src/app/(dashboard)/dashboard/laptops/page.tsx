'use client';

import RegisterPhonePage from '@/app/(dashboard)/dashboard/register/page';

export default function LaptopRegistrationPage() {
  return (
    <section className="py-8 sm:py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 text-center">
          Laptop Registration & Management
        </h1>
        <p className="text-center text-slate-600 mb-8">
          Seamlessly register, track, and service laptops – from serial numbers to warranty periods, inventory specs, and on‑demand diagnostics.
        </p>
        <a href="/features#laptops" className="inline-flex items-center gap-2 text-sky-600 hover:underline font-medium mb-6 mx-auto block text-center">
          Learn More about Laptop Features
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
        {/* Re‑use the existing registration component; it already supports laptops via the deviceCategory enum */}
        <RegisterPhonePage defaultDeviceCategory="LAPTOP" />
      </div>
    </section>
  );
}
