import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import ProfessionalModal from '@/components/ProfessionalModal'
import { useSidebar } from '@/hooks/useSidebar'

export default function AppLayout() {
  const { isCollapsed, toggle } = useSidebar()
  const [showProfessionalModal, setShowProfessionalModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={toggle}
        onOpenProfessionalModal={() => setShowProfessionalModal(true)}
      />

      <div
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <Outlet />
      </div>

      <ProfessionalModal
        isOpen={showProfessionalModal}
        onClose={() => setShowProfessionalModal(false)}
      />
    </div>
  )
}
