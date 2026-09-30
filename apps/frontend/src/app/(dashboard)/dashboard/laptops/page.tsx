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
        {/* Re‑use the existing registration component; it already supports laptops via the deviceCategory enum */}
        <RegisterPhonePage />
      </div>
    </section>
  );
}
