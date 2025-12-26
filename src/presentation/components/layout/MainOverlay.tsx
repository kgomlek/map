/**
 * 🟪 COUCHE PRÉSENTATION - Main Overlay Layout
 * Floating UI tasarım sistemi - Ana layout wrapper
 */

'use client';

import { TopNav } from '../ui/TopNav';
import { ActionSheet } from './ActionSheet';

export function MainOverlay() {
  return (
    <>
      {/* Z-Index 10: Floating Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-10 pointer-events-none">
        <TopNav />
      </div>

      {/* Z-Index 20: Bottom Action Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <ActionSheet />
      </div>
    </>
  );
}


