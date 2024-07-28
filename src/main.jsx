import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App.jsx'

if (import.meta.env.PROD) {
  navigator.serviceWorker?.register(`${import.meta.env.BASE_URL}sw.js`, { type: 'module' })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
