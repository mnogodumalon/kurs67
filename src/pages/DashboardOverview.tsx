import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Kurse, Anmeldungen } from '@/types/app';
import { GraduationCap, DoorOpen, Users, BookOpen, ClipboardList, TrendingUp, CheckCircle, Clock, Euro } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface Stats {
  dozenten: number;
  raeume: number;
  teilnehmer: number;
  kurse: number;
  anmeldungen: number;
  bezahlt: number;
  unbezahlt: number;
  activeKurse: Kurse[];
  upcomingKurse: Kurse[];
  recentAnmeldungen: Anmeldungen[];
  umsatz: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [dozentenData, raeumeData, teilnehmerData, kurseData, anmeldungenData] = await Promise.all([
          LivingAppsService.getDozenten(),
          LivingAppsService.getRaeume(),
          LivingAppsService.getTeilnehmer(),
          LivingAppsService.getKurse(),
          LivingAppsService.getAnmeldungen(),
        ]);

        const today = new Date();
        const in30Days = addDays(today, 30);

        const activeKurse = kurseData.filter(k => {
          if (!k.fields.startdatum) return false;
          const start = parseISO(k.fields.startdatum);
          const end = k.fields.enddatum ? parseISO(k.fields.enddatum) : null;
          return isBefore(start, today) && (!end || isAfter(end, today));
        });

        const upcomingKurse = kurseData.filter(k => {
          if (!k.fields.startdatum) return false;
          const start = parseISO(k.fields.startdatum);
          return isAfter(start, today) && isBefore(start, in30Days);
        }).slice(0, 5);

        const bezahlt = anmeldungenData.filter(a => a.fields.bezahlt).length;
        const unbezahlt = anmeldungenData.filter(a => !a.fields.bezahlt).length;

        const umsatz = anmeldungenData.reduce((sum, a) => {
          if (!a.fields.bezahlt || !a.fields.kurs) return sum;
          const kursId = a.fields.kurs.match(/([a-f0-9]{24})$/i)?.[1];
          const kurs = kurseData.find(k => k.record_id === kursId);
          return sum + (kurs?.fields.preis || 0);
        }, 0);

        const recentAnmeldungen = [...anmeldungenData]
          .sort((a, b) => {
            const da = a.fields.anmeldedatum || '';
            const db = b.fields.anmeldedatum || '';
            return db.localeCompare(da);
          })
          .slice(0, 5);

        setStats({
          dozenten: dozentenData.length,
          raeume: raeumeData.length,
          teilnehmer: teilnehmerData.length,
          kurse: kurseData.length,
          anmeldungen: anmeldungenData.length,
          bezahlt,
          unbezahlt,
          activeKurse,
          upcomingKurse,
          recentAnmeldungen,
          umsatz,
        });
      } catch (e) {
        console.error('Failed to load stats:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const kpiCards = [
    { label: 'Dozenten', value: stats?.dozenten ?? 0, icon: GraduationCap, gradient: 'gradient-card-indigo', description: 'Lehrende' },
    { label: 'Räume', value: stats?.raeume ?? 0, icon: DoorOpen, gradient: 'gradient-card-teal', description: 'Verfügbar' },
    { label: 'Teilnehmer', value: stats?.teilnehmer ?? 0, icon: Users, gradient: 'gradient-card-amber', description: 'Registriert' },
    { label: 'Kurse', value: stats?.kurse ?? 0, icon: BookOpen, gradient: 'gradient-card-rose', description: 'Gesamt' },
    { label: 'Anmeldungen', value: stats?.anmeldungen ?? 0, icon: ClipboardList, gradient: 'gradient-card-violet', description: 'Insgesamt' },
  ];

  const barData = stats ? [
    { name: 'Bezahlt', value: stats.bezahlt, color: 'oklch(0.6 0.14 196)' },
    { name: 'Ausstehend', value: stats.unbezahlt, color: 'oklch(0.72 0.18 60)' },
  ] : [];

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl gradient-hero shadow-hero p-8 text-primary-foreground">
        <div className="relative z-10">
          <p className="text-sm font-medium tracking-widest uppercase opacity-70 mb-2">Kursverwaltungssystem</p>
          <h1 className="text-4xl font-bold tracking-tight mb-1">Willkommen zurück</h1>
          <p className="text-lg opacity-75 font-light">
            {loading ? 'Lade Daten...' : `${stats?.kurse ?? 0} Kurse · ${stats?.teilnehmer ?? 0} Teilnehmer · ${stats?.anmeldungen ?? 0} Anmeldungen`}
          </p>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10" style={{ background: 'oklch(1 0 0)' }} />
        <div className="absolute -right-4 -bottom-20 w-48 h-48 rounded-full opacity-5" style={{ background: 'oklch(1 0 0)' }} />
        <div className="absolute right-32 top-4 w-24 h-24 rounded-full opacity-8" style={{ background: 'oklch(1 0 0)' }} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, gradient, description }) => (
          <div
            key={label}
            className={`${gradient} rounded-xl p-5 text-primary-foreground shadow-card transition-smooth hover:scale-[1.02] hover:shadow-lg`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-white/20">
                <Icon className="w-4 h-4" />
              </div>
              <TrendingUp className="w-3 h-3 opacity-60" />
            </div>
            <div className="text-3xl font-bold tracking-tight mb-0.5">
              {loading ? '—' : value}
            </div>
            <div className="text-sm font-semibold opacity-90">{label}</div>
            <div className="text-xs opacity-60 mt-0.5">{description}</div>
          </div>
        ))}
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Umsatz Hero Card */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg" style={{ background: 'oklch(0.95 0.025 264)' }}>
                <Euro className="w-4 h-4" style={{ color: 'oklch(0.42 0.18 264)' }} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Umsatz (bezahlt)</span>
            </div>
            <div className="text-5xl font-bold tracking-tight mt-4" style={{ color: 'oklch(0.42 0.18 264)' }}>
              {loading ? '—' : `${stats?.umsatz.toLocaleString('de-DE')} €`}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Aus {stats?.bezahlt ?? 0} abgeschlossenen Zahlungen</p>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Zahlungsstatus</span>
              <span>{stats?.bezahlt ?? 0} / {stats?.anmeldungen ?? 0}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-smooth"
                style={{
                  width: stats && stats.anmeldungen > 0 ? `${(stats.bezahlt / stats.anmeldungen) * 100}%` : '0%',
                  background: 'var(--gradient-card-teal)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Payment Chart */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Zahlungsstatus</h3>
          </div>
          {loading ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Lade...</div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={barData} barSize={48}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'IBM Plex Sans' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ fontFamily: 'IBM Plex Sans', fontSize: 12, border: 'none', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'oklch(0.95 0.005 247)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Upcoming Courses */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Nächste Kurse (30 Tage)</h3>
          </div>
          {loading ? (
            <div className="text-muted-foreground text-sm">Lade...</div>
          ) : stats?.upcomingKurse.length === 0 ? (
            <div className="text-muted-foreground text-sm py-4 text-center">Keine bevorstehenden Kurse</div>
          ) : (
            <div className="space-y-3">
              {stats?.upcomingKurse.map(kurs => (
                <div key={kurs.record_id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium">{kurs.fields.titel}</div>
                    <div className="text-xs text-muted-foreground">
                      {kurs.fields.startdatum
                        ? format(parseISO(kurs.fields.startdatum), 'dd. MMM yyyy', { locale: de })
                        : '—'}
                    </div>
                  </div>
                  {kurs.fields.preis != null && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ background: 'oklch(0.93 0.025 264)', color: 'oklch(0.42 0.18 264)' }}>
                      {kurs.fields.preis} €
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active courses + recent registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Courses */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Laufende Kurse</h3>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'oklch(0.93 0.025 264)', color: 'oklch(0.42 0.18 264)' }}>
              {stats?.activeKurse.length ?? 0} aktiv
            </span>
          </div>
          {loading ? (
            <div className="text-muted-foreground text-sm">Lade...</div>
          ) : stats?.activeKurse.length === 0 ? (
            <div className="text-muted-foreground text-sm py-4 text-center">Keine laufenden Kurse</div>
          ) : (
            <div className="space-y-2">
              {stats?.activeKurse.slice(0, 6).map(kurs => (
                <div key={kurs.record_id} className="flex items-center gap-3 p-3 rounded-lg transition-smooth hover:bg-muted/50">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'oklch(0.6 0.14 196)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{kurs.fields.titel}</div>
                    <div className="text-xs text-muted-foreground">
                      bis {kurs.fields.enddatum ? format(parseISO(kurs.fields.enddatum), 'dd.MM.yyyy') : '—'}
                    </div>
                  </div>
                  {kurs.fields.max_teilnehmer && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">max. {kurs.fields.max_teilnehmer}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Registrations */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Letzte Anmeldungen</h3>
          </div>
          {loading ? (
            <div className="text-muted-foreground text-sm">Lade...</div>
          ) : stats?.recentAnmeldungen.length === 0 ? (
            <div className="text-muted-foreground text-sm py-4 text-center">Keine Anmeldungen vorhanden</div>
          ) : (
            <div className="space-y-2">
              {stats?.recentAnmeldungen.map(a => (
                <div key={a.record_id} className="flex items-center gap-3 p-3 rounded-lg transition-smooth hover:bg-muted/50">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-foreground" style={{ background: 'var(--gradient-card-indigo)' }}>
                    {a.record_id.slice(-2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">
                      {a.fields.anmeldedatum
                        ? format(parseISO(a.fields.anmeldedatum), 'dd. MMM yyyy', { locale: de })
                        : '—'}
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={a.fields.bezahlt
                      ? { background: 'oklch(0.93 0.05 148)', color: 'oklch(0.38 0.12 148)' }
                      : { background: 'oklch(0.96 0.04 60)', color: 'oklch(0.52 0.14 60)' }
                    }
                  >
                    {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
