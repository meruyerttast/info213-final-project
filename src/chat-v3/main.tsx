import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initFootprints } from '@/shared/footprints'
import './index.css'

initFootprints('chat-v3')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
