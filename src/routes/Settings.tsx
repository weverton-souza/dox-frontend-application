import { Outlet } from 'react-router-dom'
import SettingsSidebar from '@/components/settings/SettingsSidebar'

export default function Settings() {
  return (
    <div className="mx-auto flex max-w-6xl gap-12 px-6 py-10">
      <SettingsSidebar />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
