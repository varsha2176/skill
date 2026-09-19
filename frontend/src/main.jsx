import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
        success: { style: { background: '#16a34a' } },
        error: { style: { background: '#dc2626' } },
      }}
    />
  </React.StrictMode>,
)
