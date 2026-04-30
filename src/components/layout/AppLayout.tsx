import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import GlobalTopBar from '@/components/layout/GlobalTopBar'
import { useSidebar } from '@/lib/hooks/use-sidebar'

export default function AppLayout() {
  const { isCollapsed, toggle, isMobile, isMobileOpen, openMobile, closeMobile } = useSidebar()

  const sidebarWidth = isMobile ? '0px' : isCollapsed ? '4rem' : '15rem'

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={toggle}
        isMobile={isMobile}
        isMobileOpen={isMobileOpen}
        onCloseMobile={closeMobile}
      />

      <GlobalTopBar
        sidebarWidth={sidebarWidth}
        isMobile={isMobile}
        onOpenMenu={openMobile}
      />

      <div
        className={`transition-all duration-300 ease-in-out pt-12 ${
          isMobile ? 'ml-0' : isCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <Outlet />
      </div>
    </div>
  )
}
