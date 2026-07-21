import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Directory } from './pages/Directory';
import { Storefront } from './pages/Storefront';
import { OrderTracking } from './pages/OrderTracking';
import { Apply } from './pages/Apply';
import { Account } from './pages/Account';
import { ToastContainer } from './components/ui/Toast';

// Heavy pages: code-split to keep initial bundle lean
const VendorDashboard = lazy(() => import('./pages/VendorDashboard').then(m => ({ default: m.VendorDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Map = lazy(() => import('./pages/Map').then(m => ({ default: m.Map })));

function PageLoader() {
  return <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>Loading…</div>;
}

export default function App() {
  return (
    <HashRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/vendors" element={<Directory />} />
        <Route path="/vendors/:slug" element={<Storefront />} />
        <Route path="/order/:id" element={<OrderTracking />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/account" element={<Account />} />
        <Route path="/vendor" element={<Suspense fallback={<PageLoader />}><VendorDashboard /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
        <Route path="/map" element={<Suspense fallback={<PageLoader />}><Map /></Suspense>} />
      </Routes>
    </HashRouter>
  );
}
