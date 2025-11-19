// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Productos from './pages/Producto';
import Cart from './pages/Cart';
import Pedidos from './pages/Pedidos';
import MonitoreoPedidos from './pages/MonitoreoPedidos';
import Dashboard from './pages/Dashboard';
import EditarPerfil from './pages/EditarPerfil';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/productos" element={<Productos />} />
              
              <Route 
                path="/carrito" 
                element={
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/pedidos" 
                element={
                  <ProtectedRoute>
                    <Pedidos />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/monitoreo-pedidos" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <MonitoreoPedidos />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/perfil" 
                element={
                  <ProtectedRoute>
                    <EditarPerfil />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
