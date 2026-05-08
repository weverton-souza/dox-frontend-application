import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Report, Customer, CalendarEvent } from '@/types'
import { REPORT_STATUS_LABELS } from '@/types'
import { getReports } from '@/lib/api/report-api'
import { getCustomers } from '@/lib/api/customer-api'
import { getCalendarEvents } from '@/lib/api/calendar-api'
import { getUsageSummary } from '@/lib/api/ai-api'
import { useError } from '@/contexts/ErrorContext'
import { useCustomerLabel } from '@/lib/hooks/useCustomerLabel'
import { formatDateTime } from '@/lib/utils'
import { getAvatarColor, getInitials } from '@/lib/avatar-utils'
import Spinner from '@/components/ui/Spinner'

interface AiUsage {
  used: number
  limit: number
  alertLevel?: string
}

const MS_DAY = 24 * 60 * 60 * 1000

function daysFrom(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / MS_DAY)
}

function isoNow(): string {
  return new Date().toISOString()
}

function isoIn(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * MS_DAY).toISOString()
}

function startOfMonthIso(monthsAgo: number): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  d.setMonth(d.getMonth() - monthsAgo)
  return d.toISOString()
}

function monthLabel(monthsAgo: number): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - monthsAgo)
  return d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}

function eventDateStart(e: CalendarEvent): Date {
  const raw = e.start?.dateTime || e.start?.date
  return raw ? new Date(raw) : new Date()
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { showError } = useError()
  const { plural: customersLabel } = useCustomerLabel()

  const [reports, setReports] = useState<Report[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [aiUsage, setAiUsage] = useState<AiUsage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    Promise.all([
      getReports(0, 100).then((p) => p.content).catch(() => []),
      getCustomers(0, 100).then((p) => p.content).catch(() => []),
      getCalendarEvents(isoNow(), isoIn(30)).catch(() => []),
      getUsageSummary(month, year).then((u) => ({ used: u.used, limit: u.limit, alertLevel: u.alertLevel })).catch(() => null),
    ]).then(([r, c, e, u]) => {
      if (cancelled) return
      setReports(r)
      setCustomers(c)
      setEvents(e)
      setAiUsage(u)
      setLoading(false)
    }).catch((err) => {
      if (!cancelled) {
        showError(err)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [showError])

  const stats = useMemo(() => {
    const startOfMonth = startOfMonthIso(0)
    const inProgress = reports.filter((r) => r.status === 'rascunho' || r.status === 'em_revisao').length
    const newCustomersThisMonth = customers.filter((c) => c.createdAt >= startOfMonth).length
    const upcoming7d = events.filter((e) => {
      const d = eventDateStart(e).getTime()
      return d >= Date.now() && d <= Date.now() + 7 * MS_DAY
    }).length

    return { inProgress, newCustomersThisMonth, upcoming7d }
  }, [reports, customers, events])

  const reportsByMonth = useMemo(() => {
    const buckets: { label: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonthIso(i)
      const end = startOfMonthIso(i - 1)
      const count = reports.filter((r) => r.status === 'finalizado' && (r.finalizedAt || r.updatedAt) >= start && (r.finalizedAt || r.updatedAt) < end).length
      buckets.push({ label: monthLabel(i), count })
    }
    return buckets
  }, [reports])

  const maxBucket = Math.max(1, ...reportsByMonth.map((b) => b.count))

  const recentReports = useMemo(() =>
    [...reports]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5),
    [reports],
  )

  const recentCustomers = useMemo(() =>
    [...customers]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3),
    [customers],
  )

  const upcomingEvents = useMemo(() =>
    [...events]
      .filter((e) => eventDateStart(e).getTime() >= Date.now())
      .sort((a, b) => eventDateStart(a).getTime() - eventDateStart(b).getTime())
      .slice(0, 5),
    [events],
  )

  const alerts = useMemo(() => {
    const list: { kind: 'amber' | 'red'; text: string }[] = []
    if (aiUsage && aiUsage.limit > 0 && aiUsage.used / aiUsage.limit >= 0.8) {
      list.push({ kind: aiUsage.used >= aiUsage.limit ? 'red' : 'amber', text: `Uso de IA em ${Math.round((aiUsage.used / aiUsage.limit) * 100)}% (${aiUsage.used}/${aiUsage.limit} laudos este mês)` })
    }
    const stale = reports.filter((r) => r.status === 'em_revisao' && daysFrom(r.updatedAt) > 7).length
    if (stale > 0) {
      list.push({ kind: 'amber', text: `${stale} ${stale === 1 ? 'relatório em revisão' : 'relatórios em revisão'} há mais de 7 dias` })
    }
    return list
  }, [aiUsage, reports])

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner /></div>
  }

  const aiPercent = aiUsage && aiUsage.limit > 0 ? Math.min(100, Math.round((aiUsage.used / aiUsage.limit) * 100)) : 0

  return (
    <main className="page-container">
      <header className="pt-6 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Início</h1>
        <p className="mt-1 text-sm text-gray-600">Visão geral da sua prática.</p>
      </header>

      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm ${
                a.kind === 'red'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={customersLabel}
          value={customers.length}
          hint={stats.newCustomersThisMonth > 0 ? `+${stats.newCustomersThisMonth} este mês` : 'sem novos este mês'}
          tint="brand"
        />
        <StatCard
          label="Em andamento"
          value={stats.inProgress}
          hint="Rascunho + Em revisão"
          tint="amber"
        />
        <StatCard
          label="Próximas sessões"
          value={stats.upcoming7d}
          hint="próximos 7 dias"
          tint="emerald"
        />
        <StatCard
          label="IA este mês"
          value={aiUsage ? `${aiUsage.used}/${aiUsage.limit}` : '—'}
          hint={aiUsage ? `${aiPercent}% da quota` : 'sem dados'}
          tint={aiPercent >= 80 ? 'red' : 'brand'}
          progress={aiPercent}
        />
      </div>

      {/* Listas */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos relatórios */}
        <Section title="Últimos relatórios" empty={recentReports.length === 0 ? 'Nenhum relatório ainda' : null}>
          {recentReports.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => navigate(`/reports/${r.id}`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{r.customerName || 'Sem nome'}</p>
                <p className="text-xs text-gray-500">{formatDateTime(r.updatedAt)}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                r.status === 'finalizado'
                  ? 'bg-emerald-50 text-emerald-700'
                  : r.status === 'em_revisao'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {REPORT_STATUS_LABELS[r.status]}
              </span>
            </button>
          ))}
        </Section>

        {/* Próximas sessões */}
        <Section title="Próximas sessões" empty={upcomingEvents.length === 0 ? 'Nada agendado' : null}>
          {upcomingEvents.map((e) => {
            const d = eventDateStart(e)
            const isToday = d.toDateString() === new Date().toDateString()
            const isTomorrow = d.toDateString() === new Date(Date.now() + MS_DAY).toDateString()
            const dayLabel = isToday ? 'Hoje' : isTomorrow ? 'Amanhã' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            const time = e.start?.dateTime ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'dia inteiro'
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => navigate('/calendar')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="shrink-0 w-12 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">{dayLabel}</p>
                  <p className="text-xs font-semibold text-gray-700">{time}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{e.summary || '(sem título)'}</p>
                  {e.tagName && (
                    <p className="text-xs text-gray-500 truncate" style={e.tagColor ? { color: e.tagColor } : undefined}>
                      {e.tagName}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </Section>

        {/* Pacientes recentes */}
        <Section title={`${customersLabel} recentes`} empty={recentCustomers.length === 0 ? 'Nenhum cadastro ainda' : null}>
          {recentCustomers.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/customers/${c.id}`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(c.data.name || c.id)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                {getInitials(c.data.name || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{c.data.name || 'Sem nome'}</p>
                <p className="text-xs text-gray-500">Cadastrado {formatDateTime(c.createdAt)}</p>
              </div>
            </button>
          ))}
        </Section>

        {/* Gráfico de relatórios finalizados por mês */}
        <Section title="Relatórios finalizados" empty={null}>
          <div className="px-3 py-2">
            <div className="flex items-end gap-2 h-32">
              {reportsByMonth.map((b) => {
                const heightPct = (b.count / maxBucket) * 100
                return (
                  <div key={b.label} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                    <span className="text-xs font-semibold text-gray-700">{b.count}</span>
                    <div
                      className="w-full bg-brand-500 rounded-t-md transition-all"
                      style={{ height: `${Math.max(2, heightPct)}%` }}
                    />
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">{b.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </Section>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  hint,
  tint,
  progress,
}: {
  label: string
  value: string | number
  hint: string
  tint: 'brand' | 'amber' | 'emerald' | 'red'
  progress?: number
}) {
  const tintMap = {
    brand: 'text-brand-600',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
  }
  const progressBg = {
    brand: 'bg-brand-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-card px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${tintMap[tint]}`}>{value}</p>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className={`h-full ${progressBg[tint]} transition-all`} style={{ width: `${progress}%` }} />
        </div>
      )}
      <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
    </div>
  )
}

function Section({
  title,
  empty,
  children,
}: {
  title: string
  empty: string | null
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold tracking-tight text-gray-900">{title}</h3>
      </div>
      <div className="p-2">
        {empty ? (
          <p className="text-sm text-gray-500 text-center py-6">{empty}</p>
        ) : children}
      </div>
    </div>
  )
}
