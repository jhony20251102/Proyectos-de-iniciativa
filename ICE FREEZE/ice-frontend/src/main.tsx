/*
 * Copyright (c) 2026 RICKY SEDANO REYES. Todos los derechos reservados.
 * Código compartido de buena fe exclusivamente para revisión y evaluación.
 * Su implementación o uso requiere un acuerdo previo con el autor.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
