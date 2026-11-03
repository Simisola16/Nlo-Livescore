import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  ExternalLink,
  FileImage,
  Globe2,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';

export const RegionsPage: React.FC = () => {
  const { zones } = useApp();
  const [previewSheet, setPreviewSheet] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-nlo-navy text-white p-6 sm:p-8 border-b-4 border-emerald-500">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Globe2 className="w-3.5 h-3.5" />
          Official Competition Hierarchy
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          NLO Cup Geopolitical Zones & Official Competition Centres
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
          The Nationwide League One (NLO) Cup 2026/2027 competition is structured across{' '}
          <strong>4 Parent Geopolitical Zones</strong> and{' '}
          <strong>7 Official Competition Groups/Centres</strong>. Approved referees are scoped
          strictly to their assigned Group/Centre.
        </p>
      </div>

      {/* Zones and Groups Hierarchy */}
      <div className="space-y-6">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-xs font-bold">
                    {zone.code}
                  </span>
                  <h2 className="text-lg font-extrabold">{zone.name}</h2>
                </div>
                <p className="text-xs text-slate-300 mt-1">{zone.description}</p>
              </div>
              <span className="text-xs font-semibold text-emerald-400">
                {zone.groups.length} Official Group{zone.groups.length === 1 ? '' : 's'} / Centre
                {zone.groups.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {zone.groups.map((grp) => (
                <div
                  key={grp.id}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded bg-nlo-navy text-white text-xs font-bold">
                        {grp.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">{grp.format}</span>
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900">{grp.name}</h3>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="rounded-lg bg-white p-2.5 border border-slate-200/80 text-xs">
                        <span className="text-slate-500 block">Participating Clubs</span>
                        <strong className="text-base font-mono text-slate-900">
                          {grp.teamsCount ?? 0} Teams
                        </strong>
                      </div>
                      <div className="rounded-lg bg-white p-2.5 border border-slate-200/80 text-xs">
                        <span className="text-slate-500 block">Playable Fixtures</span>
                        <strong className="text-base font-mono text-emerald-700">
                          {grp.playableFixturesCount ?? 0} Matches
                        </strong>
                      </div>
                    </div>

                    {grp.hasByeSlot && (
                      <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-3">
                        Includes 10 explicit weekly BYE scheduling slots (Team 6 = BYE).
                      </p>
                    )}

                    {/* Source Reference Sheets */}
                    {grp.referenceImages && grp.referenceImages.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                          Official NLO Secretariat Source Sheets ({grp.referenceImages.length}):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {grp.referenceImages.map((img) => (
                            <button
                              key={img}
                              type="button"
                              onClick={() =>
                                setPreviewSheet(`/content/images/references/${img}`)
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-emerald-50 border border-slate-300 text-[11px] font-semibold text-slate-700"
                            >
                              <FileImage className="w-3 h-3 text-emerald-700" />
                              {img.replace('IMG-20261103-', '')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                    <Link
                      to={`/fixtures?groupId=${encodeURIComponent(grp.id)}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-nlo-navy text-white text-xs font-bold hover:bg-slate-800"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Fixtures
                    </Link>
                    <Link
                      to={`/standings`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      Standings
                    </Link>
                    <Link
                      to={`/referee/register`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 ml-auto"
                    >
                      Referee Portal <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal for inspecting any of the 18 official reference fixture sheets */}
      {previewSheet && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
          onClick={() => setPreviewSheet(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-nlo-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">
                  Official NLO Secretariat Fixture Reference Sheet ({previewSheet.split('/').pop()})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={previewSheet}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-emerald-300 hover:underline flex items-center gap-1"
                >
                  Open Full Resolution <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewSheet(null)}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto bg-slate-100 flex-1 flex items-center justify-center">
              <img
                src={previewSheet}
                alt="Official NLO Secretariat Fixture Sheet"
                className="max-w-full h-auto rounded-lg shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

