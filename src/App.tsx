import { Routes, Route, Link } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Login from '@/routes/Login'
import Register from '@/routes/Register'
import ReportList from '@/routes/ReportList'
import ReportEditor from '@/routes/ReportEditor'
import CustomerList from '@/routes/CustomerList'
import CustomerProfile from '@/routes/CustomerProfile'
import FormList from '@/routes/FormList'
import FormBuilder from '@/routes/FormBuilder'
import FormFill from '@/routes/FormFill'
import FormResponseList from '@/routes/FormResponseList'
import FormulaGuide from '@/routes/FormulaGuide'
import PublicFormFill from '@/routes/PublicFormFill'
import Calendar from '@/routes/Calendar'
import TemplateEditor from '@/routes/TemplateEditor'

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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/public/forms/:token" element={<PublicFormFill />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<ReportList />} />
          <Route path="/reports/:id" element={<ReportEditor />} />
          <Route path="/templates/new" element={<TemplateEditor />} />
          <Route path="/templates/:id" element={<TemplateEditor />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerProfile />} />
          <Route path="/forms" element={<FormList />} />
          <Route path="/forms/:id/edit" element={<FormBuilder />} />
          <Route path="/forms/:id/fill" element={<FormFill />} />
          <Route path="/forms/:id/responses" element={<FormResponseList />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/guides" element={<FormulaGuide />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
