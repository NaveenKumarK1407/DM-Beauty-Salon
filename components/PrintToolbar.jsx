'use client';
// Sticky toolbar for the Design Document — triggers the browser print/save-as-PDF
// dialog. Hidden in the printed output via @media print.
import { IconArrow } from '@/lib/data';

export function PrintToolbar() {
  return (
    <div className="ds-toolbar">
      <div className="t">DM Beauty Parlour<small>Design Document · v1.0</small></div>
      <button className="btn btn-primary" onClick={() => window.print()}>
        Save as PDF <IconArrow size={12} />
      </button>
    </div>
  );
}
