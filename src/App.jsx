import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { UIProvider } from './context/UIContext';
import { InvoiceProvider } from './context/InvoiceContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { Home } from './pages/Home';
import { CatalogPage } from './pages/catalog/CatalogPage';
import { OrderCreatorPage } from './pages/order/OrderCreatorPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { MyOrdersPage } from './pages/orders/MyOrdersPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { InvoiceDetailPage } from './pages/invoices/InvoiceDetailPage';
import { CreateInvoicePage } from './pages/invoices/CreateInvoicePage';

// Route Guard for Authenticated Users
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Route Guard for Admin Only
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrderProvider>
          <UIProvider>
            <InvoiceProvider>
              <div className="app-wrapper">
                <Navbar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/order-creator" element={<OrderCreatorPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />

                    {/* Protected Buyer Routes */}
                    <Route
                      path="/my-orders"
                      element={
                        <ProtectedRoute>
                          <MyOrdersPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/invoices"
                      element={
                        <ProtectedRoute>
                          <InvoicesPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/invoices/new"
                      element={
                        <ProtectedRoute>
                          <CreateInvoicePage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/invoices/:id"
                      element={
                        <ProtectedRoute>
                          <InvoiceDetailPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/invoices/:id/edit"
                      element={
                        <ProtectedRoute>
                          <CreateInvoicePage isEditMode={true} />
                        </ProtectedRoute>
                      }
                    />

                    {/* Protected Admin Routes */}
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </InvoiceProvider>
          </UIProvider>
        </OrderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
