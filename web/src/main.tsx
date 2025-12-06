import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './modules/App'
import { ToastProvider } from './components/Toast'
import './styles/theme.css'

createRoot(document.getElementById('root')!).render(
	<ToastProvider>
		<App />
	</ToastProvider>
)