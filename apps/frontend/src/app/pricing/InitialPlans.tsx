'use client';

import React, { createContext, useContext } from 'react';

const InitialPlansContext = createContext<any[] | null>(null);

/** Hands the plans fetched on the server (pricing/layout.tsx) to the client page. */
export function InitialPlansProvider({ plans, children }: { plans: any[] | null; children: React.ReactNode }) {
  return <InitialPlansContext.Provider value={plans}>{children}</InitialPlansContext.Provider>;
}

export function useInitialPlans() {
  return useContext(InitialPlansContext);
}
