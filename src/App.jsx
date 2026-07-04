import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import EventPage from './pages/EventPage'
import NotFound from './pages/NotFound'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminEvents from './pages/admin/AdminEvents'
import AdminEventDetail from './pages/admin/AdminEventDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/s/:slug" element={<EventPage />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminEvents />} />
        <Route path="eventos/:slug" element={<AdminEventDetail />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
