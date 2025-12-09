
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router"
import './global/index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename='/calendar-tsx'>
    <Routes>
      <Route path="" element={<App />} />
    </Routes>
  </BrowserRouter>,
)
