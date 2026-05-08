import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import EditorPageHeader from '@/components/editor/EditorPageHeader'
import SegmentedControl from '@/components/ui/SegmentedControl'

const TABS = [
  { value: 'library', label: 'Biblioteca' },
  { value: 'appearance', label: 'Aparência' },
] as const

type Tab = typeof TABS[number]['value']

function resolveActiveTab(pathname: string): Tab {
  if (pathname.startsWith('/reports/settings/appearance')) return 'appearance'
  return 'library'
}

export default function ReportSettings() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeTab = resolveActiveTab(location.pathname)

  return (
    <>
      <EditorPageHeader
        onBack={() => navigate('/reports')}
        showSaveStatus={false}
        center={
          <SegmentedControl
            options={[...TABS]}
            value={activeTab}
            onChange={(v) => navigate(`/reports/settings/${v}`)}
            size="sm"
          />
        }
      />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </>
  )
}
