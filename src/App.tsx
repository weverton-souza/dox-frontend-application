import { Routes, Route } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import LaudoList from './routes/LaudoList'
import LaudoEditor from './routes/LaudoEditor'
import PatientList from './routes/PatientList'
import PatientProfile from './routes/PatientProfile'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LaudoList />} />
        <Route path="/laudo/:id" element={<LaudoEditor />} />
        <Route path="/pacientes" element={<PatientList />} />
        <Route path="/pacientes/:id" element={<PatientProfile />} />
      </Route>
    </Routes>
  )
}
