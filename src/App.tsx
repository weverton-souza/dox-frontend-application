import { lazy, Suspense } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import SettingsPlaceholder from '@/components/settings/SettingsPlaceholder'

const Login = lazy(() => import('@/routes/Login'))
const Register = lazy(() => import('@/routes/Register'))
const ReportList = lazy(() => import('@/routes/ReportList'))
const ReportEditor = lazy(() => import('@/routes/ReportEditor'))
const CustomerList = lazy(() => import('@/routes/CustomerList'))
const CustomerProfile = lazy(() => import('@/routes/CustomerProfile'))
const FormComparisonView = lazy(() => import('@/routes/FormComparisonView'))
const FormList = lazy(() => import('@/routes/FormList'))
const FormBuilder = lazy(() => import('@/routes/FormBuilder'))
const FormResponseList = lazy(() => import('@/routes/FormResponseList'))
const FormulaGuide = lazy(() => import('@/routes/FormulaGuide'))
const PublicFormFill = lazy(() => import('@/routes/PublicFormFill'))
const VerifyDocument = lazy(() => import('@/routes/VerifyDocument'))
const Calendar = lazy(() => import('@/routes/Calendar'))
const TemplateEditor = lazy(() => import('@/routes/TemplateEditor'))
const Settings = lazy(() => import('@/routes/Settings'))
const SettingsAccount = lazy(() => import('@/routes/SettingsAccount'))
const SettingsBilling = lazy(() => import('@/routes/SettingsBilling'))
const SettingsGeneral = lazy(() => import('@/routes/SettingsGeneral'))

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <h1 className="text-6xl font-bold text-gray-200">404</h1>
      <p className="text-gray-500 mt-2">Página não encontrada</p>
      <Link to="/" className="mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium">
        Voltar ao início
      </Link>
    </div>
  )
}

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-32">
      <svg className="animate-spin h-6 w-6 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/public/forms/:token" element={<PublicFormFill />} />
        <Route path="/v/:code" element={<VerifyDocument />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<ReportList />} />
            <Route path="/reports/:id" element={<ReportEditor />} />
            <Route path="/templates/new" element={<TemplateEditor />} />
            <Route path="/templates/:id" element={<TemplateEditor />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerProfile />} />
            <Route path="/customers/:customerId/forms/:formId/comparison" element={<FormComparisonView />} />
            <Route path="/forms" element={<FormList />} />
            <Route path="/forms/:id/edit" element={<FormBuilder />} />
            <Route path="/forms/:id/responses" element={<FormResponseList />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/guides" element={<FormulaGuide />} />
            <Route path="/settings" element={<Settings />}>
              <Route index element={<Navigate to="account" replace />} />
              <Route path="general" element={<SettingsGeneral />} />
              <Route path="account" element={<SettingsAccount />} />
              <Route
                path="privacy"
                element={
                  <SettingsPlaceholder
                    title="Privacidade"
                    description="LGPD, exportação e exclusão de dados."
                  />
                }
              />
              <Route path="billing" element={<SettingsBilling />} />
              <Route
                path="usage"
                element={
                  <SettingsPlaceholder
                    title="Uso"
                    description="Estatísticas de uso da plataforma."
                  />
                }
              />
              <Route
                path="notifications"
                element={
                  <SettingsPlaceholder
                    title="Notificações"
                    description="Como você recebe avisos do sistema."
                  />
                }
              />
              <Route
                path="security"
                element={
                  <SettingsPlaceholder
                    title="Segurança"
                    description="Sessões ativas e autenticação em dois fatores."
                  />
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
