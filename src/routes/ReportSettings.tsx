import { Outlet } from 'react-router-dom'
import ReportSettingsSidebar from '@/components/report-settings/ReportSettingsSidebar'

export default function ReportSettings() {
  return (
    <div className="mx-auto flex max-w-6xl gap-12 px-6 py-10">
      <ReportSettingsSidebar />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
