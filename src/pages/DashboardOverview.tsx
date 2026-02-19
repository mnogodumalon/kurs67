import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Kurse, Anmeldungen, Teilnehmer, Dozenten, Raeume } from '@/types/app';
import { BookOpen, Users, GraduationCap, DoorOpen, ClipboardList, TrendingUp, CheckCircle2, Clock, XCircle, Euro } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, parseISO, isAfter, isBefore, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';

interface Stats {
  kurse: Kurse[];
  anmeldungen: Anmeldungen[];
  teilnehmer: Teilnehmer[];
  dozenten: Dozenten[];
  raeume: Raeume[];
}

const PIE_COLORS = [
  'oklch(0.52 0.22 264)',
  'oklch(0.65 0.18 160)',
  'oklch(0.80 0.16 72)',
  'oklch(0.60 0.22 25)',
];

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      LivingAppsService.getKurse(),
      LivingAppsService.getAnmeldungen(),
      LivingAppsService.getTeilnehmer(),
      LivingAppsService.getDozenten(),
      LivingAppsService.getRaeume(),
    ]).then(([kurse, anmeldungen, teilnehmer, dozenten, raeume]) => {
      setStats({ kurse, anmeldungen, teilnehmer, dozenten, raeume });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const aktiveKurse = stats?.kurse.filter(k => k.fields.status === 'aktiv').length ?? 0;
  const geplanteKurse = stats?.kurse.filter(k => k.fields.status === 'geplant').length ?? 0;
  const bezahlteAnmeldungen = stats?.anmeldungen.filter(a => a.fields.bezahlt).length ?? 0;
  const offeneAnmeldungen = stats?.anmeldungen.filter(a => !a.fields.bezahlt).length ?? 0;

  const gesamtUmsatz = stats?.anmeldungen
    .filter(a => a.fields.bezahlt && a.fields.kurs)
    .reduce((sum, a) => {
      const kursId = a.fields.kurs?.split('/').pop();
      const kurs = stats.kurse.find(k => k.record_id === kursId);
      return sum + (kurs?.fields.preis ?? 0);
    }, 0) ?? 0;

  const statusData = [
    { name: 'Geplant', value: stats?.kurse.filter(k => k.fields.status === 'geplant').length ?? 0 },
    { name: 'Aktiv', value: stats?.kurse.filter(k => k.fields.status === 'aktiv').length ?? 0 },
    { name: 'Abgeschlossen', value: stats?.kurse.filter(k => k.fields.status === 'abgeschlossen').length ?? 0 },
    { name: 'Abgesagt', value: stats?.kurse.filter(k => k.fields.status === 'abgesagt').length ?? 0 },
  ].filter(d => d.value > 0);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(today, 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const count = stats?.anmeldungen.filter(a => {
      if (!a.fields.anmeldedatum) return false;
      const d = parseISO(a.fields.anmeldedatum);
      return !isBefore(d, start) && !isAfter(d, end);
    }).length ?? 0;
    return { monat: format(date, 'MMM', { locale: de }), anmeldungen: count };
  });

  const upcomingKurse = stats?.kurse
    .filter(k => k.fields.startdatum && isAfter(parseISO(k.fields.startdatum), today))
    .sort((a, b) => {
      const da = a.fields.startdatum ? parseISO(a.fields.startdatum).getTime() : 0;
      const db = b.fields.startdatum ? parseISO(b.fields.startdatum).getTime() : 0;
      return da - db;
    })
    .slice(0, 5) ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm font-medium animate-pulse">Lade Dashboard…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.80 0.16 72)' }}>
              Kursverwaltungssystem
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1" style={{ color: 'oklch(1 0 0)' }}>
            Willkommen zurück
          </h1>
          <p className="text-sm" style={{ color: 'oklch(0.80 0.02 264)' }}>
            {format(today, "EEEE, d. MMMM yyyy", { locale: de })} · Alle Daten im Überblick
          </p>
          <div className="flex flex-wrap gap-5 mt-5">
            <HeroStat icon={<BookOpen size={14} />} value={aktiveKurse} label="aktive Kurse" />
            <HeroStat icon={<Euro size={14} />} value={gesamtUmsatz.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} label="Umsatz (bezahlt)" />
            <HeroStat icon={<Users size={14} />} value={stats?.teilnehmer.length ?? 0} label="Teilnehmer" />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard icon={<BookOpen size={18} />} orbClass="icon-orb-primary" label="Kurse gesamt" value={stats?.kurse.length ?? 0} sub={`${geplanteKurse} geplant`} />
        <KpiCard icon={<GraduationCap size={18} />} orbClass="icon-orb-amber" label="Dozenten" value={stats?.dozenten.length ?? 0} sub="im System" />
        <KpiCard icon={<Users size={18} />} orbClass="icon-orb-emerald" label="Teilnehmer" value={stats?.teilnehmer.length ?? 0} sub="registriert" />
        <KpiCard icon={<DoorOpen size={18} />} orbClass="icon-orb-violet" label="Räume" value={stats?.raeume.length ?? 0} sub="verfügbar" />
        <KpiCard icon={<ClipboardList size={18} />} orbClass="icon-orb-rose" label="Anmeldungen" value={stats?.anmeldungen.length ?? 0} sub={`${bezahlteAnmeldungen} bezahlt`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="chart-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Anmeldungen pro Monat</h3>
              <p className="text-xs text-muted-foreground">Letzte 6 Monate</p>
            </div>
            <div className="icon-orb icon-orb-primary" style={{ width: '2rem', height: '2rem', borderRadius: '0.625rem' }}>
              <TrendingUp size={14} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barSize={28} margin={{ left: -16 }}>
              <XAxis dataKey="monat" tick={{ fontSize: 12, fill: 'oklch(0.52 0.02 264)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'oklch(0.52 0.02 264)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.008 264)', borderRadius: '0.5rem', fontSize: 12, boxShadow: 'var(--shadow-card)' }}
                cursor={{ fill: 'oklch(0.52 0.22 264 / 0.06)' }}
                formatter={(v: number) => [v, 'Anmeldungen']}
              />
              <Bar dataKey="anmeldungen" fill="oklch(0.52 0.22 264)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="mb-3">
            <h3 className="font-semibold text-foreground text-sm">Kursstatus</h3>
            <p className="text-xs text-muted-foreground">Verteilung</p>
          </div>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="45%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: 'oklch(0.42 0.02 264)' }}>{v}</span>} />
                <Tooltip contentStyle={{ background: 'oklch(1 0 0)', border: '1px solid oklch(0.90 0.008 264)', borderRadius: '0.5rem', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-44 text-xs text-muted-foreground">Noch keine Kurse angelegt</div>
          )}
        </div>
      </div>

      {/* Upcoming Courses */}
      <div className="chart-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Nächste Kurse</h3>
            <p className="text-xs text-muted-foreground">Demnächst startende Kurse</p>
          </div>
          <div className="icon-orb icon-orb-amber" style={{ width: '2rem', height: '2rem', borderRadius: '0.625rem' }}>
            <Clock size={14} />
          </div>
        </div>
        {upcomingKurse.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Keine bevorstehenden Kurse</p>
        ) : (
          <div className="space-y-1">
            {upcomingKurse.map(kurs => {
              const anmeldungenCount = stats?.anmeldungen.filter(a => a.fields.kurs?.endsWith(kurs.record_id)).length ?? 0;
              const statusClass = `badge-${kurs.fields.status ?? 'geplant'}`;
              return (
                <div key={kurs.record_id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="icon-orb icon-orb-primary" style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', flexShrink: 0 }}>
                      <BookOpen size={13} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{kurs.fields.titel}</p>
                      <p className="text-xs text-muted-foreground">
                        {kurs.fields.startdatum ? format(parseISO(kurs.fields.startdatum), 'dd.MM.yyyy') : '–'}
                        {kurs.fields.preis ? ` · ${kurs.fields.preis} €` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">{anmeldungenCount} Anm.</span>
                    <span className={`${statusClass} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                      {kurs.fields.status ?? 'geplant'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Status Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="chart-card flex items-center gap-4">
          <div className="icon-orb icon-orb-emerald">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{bezahlteAnmeldungen}</div>
            <div className="text-sm text-muted-foreground">Bezahlte Anmeldungen</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm font-bold" style={{ color: 'oklch(0.45 0.18 155)' }}>
              {stats?.anmeldungen.length ? Math.round((bezahlteAnmeldungen / stats.anmeldungen.length) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Quote</div>
          </div>
        </div>
        <div className="chart-card flex items-center gap-4">
          <div className="icon-orb icon-orb-rose">
            <XCircle size={18} />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{offeneAnmeldungen}</div>
            <div className="text-sm text-muted-foreground">Offene Zahlungen</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm font-bold" style={{ color: 'oklch(0.50 0.22 22)' }}>
              {stats?.anmeldungen.length ? Math.round((offeneAnmeldungen / stats.anmeldungen.length) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Quote</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroStat({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="icon-orb icon-orb-white" style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem' }}>
        {icon}
      </div>
      <div>
        <div className="text-base font-bold leading-tight" style={{ color: 'oklch(1 0 0)' }}>{value}</div>
        <div className="text-xs leading-tight" style={{ color: 'oklch(0.72 0.02 264)' }}>{label}</div>
      </div>
    </div>
  );
}

function KpiCard({ icon, orbClass, label, value, sub }: {
  icon: React.ReactNode; orbClass: string; label: string; value: number | string; sub?: string;
}) {
  return (
    <div className="stat-card-default rounded-xl p-4 flex flex-col gap-3">
      <div className={`icon-orb ${orbClass}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-foreground leading-none">{value}</div>
        <div className="text-xs font-medium text-foreground/70 mt-1">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
