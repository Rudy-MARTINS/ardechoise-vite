import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Site from './Site.jsx'
import './site.css'

createRoot(document.getElementById('root')).render(<StrictMode><Site /></StrictMode>)
