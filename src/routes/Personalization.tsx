import { Outlet } from 'react-router-dom'
import PersonalizationSidebar from '@/components/personalization/PersonalizationSidebar'

export default function Personalization() {
  return (
    <div className="mx-auto flex max-w-6xl gap-12 px-6 py-10">
      <PersonalizationSidebar />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
