'use client';
import React from 'react';
import { formatHoursLine, DAY_ABBR, normalizeDayName } from '@/lib/hours';
import { isStudioOpen } from '@/lib/utils';

/** Visit Us card — hours, live status, and closed days on separate lines.
 *  `showStatus={false}` suppresses the OPEN/CLOSED NOW pill for surfaces that
 *  already show live status elsewhere (the mobile drawer header), so the same
 *  fact is not repeated twice in one panel. */
export function VisitHoursBlock({ settings, showStatus = true }) {
  const isOpen = isStudioOpen(settings);
  const closedDays = (settings?.closedDays || []).filter(Boolean);

  return (
    <div className="visit-hours-block">
      <div className="visit-hours-row">
        <span className="visit-hours-line">{formatHoursLine(settings)}</span>
        {showStatus && (
          <span className={'visit-hours-status' + (isOpen ? ' is-open' : ' is-closed')}>
            <span className="visit-hours-dot" aria-hidden="true" />
            {isOpen ? 'OPEN NOW' : 'CLOSED NOW'}
          </span>
        )}
      </div>
      {closedDays.length > 0 && (
        <div className="visit-hours-closed-list">
          {closedDays.map((day) => {
            const full = normalizeDayName(day);
            const abbr = DAY_ABBR[full] || String(day).slice(0, 3);
            return (
              <div key={day} className="visit-hours-closed-item">
                <span className="visit-hours-line">{abbr}</span>
                <span className="visit-hours-sep" aria-hidden="true">·</span>
                <span className="hours-closed">CLOSED</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Inline hours with closed days (nav, footer dropdown) */
export function HoursText({ settings, className, style }) {
  const main = formatHoursLine(settings);
  const closedDays = (settings?.closedDays || []).filter(Boolean);

  if (!closedDays.length) {
    return <span className={className} style={style}>{main}</span>;
  }

  return (
    <span className={className} style={style}>
      {main}
      {' · '}
      {closedDays.map((day, i) => {
        const full = normalizeDayName(day);
        const abbr = DAY_ABBR[full] || String(day).slice(0, 3);
        return (
          <React.Fragment key={day}>
            {i > 0 && ' · '}
            <span className="visit-hours-line">{abbr}</span>
            <span className="visit-hours-sep"> · </span>
            <span className="hours-closed">CLOSED</span>
          </React.Fragment>
        );
      })}
    </span>
  );
}
