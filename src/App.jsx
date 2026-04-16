import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import AdminPage from './pages/admin/AdminPage'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CatalogPage from './pages/CatalogPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage  from './pages/OrdersPage'
import AccountPage from './pages/AccountPage'
import PaymentResultPage from './pages/PaymentResultPage'

const queryClient = new QueryClient()

export default function App() {
  return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  borderRadius: '12px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '14px',
                },
              }}
          />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/admin/*" element={<AdminPage />} />
              <Route path="login"    element={<LoginPage />} />
              <Route path="registro" element={<RegisterPage />} />
              <Route path="catalogo"           element={<CatalogPage />} />
              <Route path="catalogo/:category" element={<CatalogPage />} />
              <Route path="producto/:slug" element={<ProductPage />} />
              <Route path="carrito"  element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="mis-pedidos" element={<OrdersPage />} />
              <Route path="mi-cuenta"   element={<AccountPage />} />
              <Route path="pago/resultado" element={<PaymentResultPage />} />
              <Route path="pago/cancelado" element={<PaymentResultPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
  )
}