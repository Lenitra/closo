import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import GroupPage from './pages/Group'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import AdminGroup from './pages/AdminGroup'
import CGU from './pages/CGU'
import PolitiqueConfidentialite from './pages/PolitiqueConfidentialite'
import MentionsLegales from './pages/MentionsLegales'
import NotFound from './pages/NotFound'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/group/:id" element={<GroupPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/groups/:groupId" element={<AdminGroup />} />
          <Route path="/cgu" element={<CGU />} />
          <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
