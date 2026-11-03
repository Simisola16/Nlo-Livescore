import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Globe2,
  Lock,
  Radio,
  ShieldCheck,
  Smartphone,
  Trophy,
} from 'lucide-react';
import {
  NFF_OFFICIAL_CREST_URL,
  NLO_OFFICIAL_LOGO_URL,
  OFFICIAL_FIXTURE_SHEETS,
} from '@nlo-cup/package';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero */}
      <div className="rounded-2xl bg-nlo-navy text-white p-6 sm:p-10 border-b-4 border-emerald-500">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Official Competition Platform
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              About Nationwide League One (NLO) Cup Live
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              NLO Cup Live is the official real-time live score, referee match-day management, and
              competition administration platform for Nigeria&apos;s Nationwide League One (NLO)
              Cup. Built for production reliability, it connects football fans, accredited match
              referees, and the NLO Secretariat on a single unified platform.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <img
              src={NLO_OFFICIAL_LOGO_URL}
              alt="Official NLO Logo"
              className="w-20 h-20 rounded-2xl bg-white p-2 object-contain shadow-lg"
            />
            <img
              src={NFF_OFFICIAL_CREST_URL}
              alt="Official NFA/NFF Crest"
              className="w-20 h-20 rounded-full bg-white p-1.5 object-contain shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Three Platform Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">1. Public Live Score Hub</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Fans follow simultaneous live matches with zero-refresh WebSocket updates, verified
            match timelines, 252 playable fixtures, 10 explicit weekly BYE schedules, 46 club
            profiles, and automatic standings tables across all 7 Centres.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">
            2. Mobile-First Referee Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Referees register under their official Competition Group/Centre, undergo Super Admin
            verification, claim exclusive transactional match locks (`SELECT ... FOR UPDATE`), and
            record goals, cards, substitutions, and stoppage time directly from the touchline—with
            offline queue recovery.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">
            3. Super Admin Command Centre
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Administrators manage Parent Zones, Competition Centres, Clubs, Fixtures, Referees,
            Media Assets (logos, photos, videos), Season Tie-Breaker Rules, Simultaneous Live Match
            Locks, and the Historical Match Entry Studio with immutable audit logging.
          </p>
        </div>
      </div>

      {/* Data Integrity Guarantees */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900">
          Competition Data Integrity & Source Verification
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>252 Playable Fixtures + 10 Explicit BYEs:</strong> Every match is verified
              against the 18 official NLO Secretariat fixture sheets (`WA0042`–`WA0059`).
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Strict Separation of Past Unconfirmed Fixtures:</strong> Past fixtures without
              confirmed scores are marked <code>RESULT_PENDING</code>—never fabricated or disguised
              as future matches.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Globe2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <strong>Honest Kickoff Time Handling (`TBC`):</strong> The 12 cropped North Central
              Zone fixtures (Weeks 16–18, M/NO 61–72) are marked <code>TBC</code> until updated by
              the Super Admin.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Trophy className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Transparent Club Crest Policy:</strong> Clubs without uploaded official logos
              use a clearly marked neutral shield badge until an administrator uploads the official
              club crest.
            </div>
          </div>
        </div>
      </div>

      {/* Reference Sheets Index */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">
            18 Verified NLO Secretariat Fixture Reference Sheets
          </h2>
          <Link to="/regions" className="text-xs font-bold text-emerald-700 hover:underline">
            Inspect by Region →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {OFFICIAL_FIXTURE_SHEETS.map((fileName) => (
            <a
              key={fileName}
              href={`/content/images/references/${fileName}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-200 hover:border-emerald-600 p-2 bg-slate-50 text-center group transition-all"
            >
              <img
                src={`/content/images/references/${fileName}`}
                alt={fileName}
                className="w-full h-24 object-cover rounded border border-slate-200 mb-1.5"
                loading="lazy"
              />
              <span className="text-[11px] font-mono font-bold text-slate-700 group-hover:text-emerald-700 block truncate">
                {fileName.replace('IMG-20261103-', '')}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

