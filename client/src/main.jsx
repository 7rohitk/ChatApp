import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import { ChatProvider } from '../context/ChatContext.jsx'
// starting point of your chat app.

createRoot(document.getElementById('root')).render(
  <BrowserRouter>  
    <AuthProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </AuthProvider>
  </BrowserRouter>
) 

// browserRouter -  // Lets you use URLs for navigation (like /login, /chat) without reloading.