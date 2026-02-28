import { Routes, Route } from 'react-router-dom'
import LaudoList from './routes/LaudoList'
import LaudoEditor from './routes/LaudoEditor'
import PatientList from './routes/PatientList'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LaudoList />} />
      <Route path="/laudo/:id" element={<LaudoEditor />} />
      <Route path="/pacientes" element={<PatientList />} />
    </Routes>
  )
}
