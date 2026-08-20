import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Directory } from './pages/Directory';
import { Storefront } from './pages/Storefront';
import { OrderTracking } from './pages/OrderTracking';
import { Apply } from './pages/Apply';
import { Account } from './pages/Account';
import { Events } from './pages/Events';
import { Protea } from './pages/Protea';
import { Blissings } from './pages/Blissings';
import { Raffle } from './pages/Raffle';
import { CustomTee } from './pages/CustomTee';
import { RastaRooster } from './pages/RastaRooster';
import { KingdomTokens } from './pages/KingdomTokens';
import { ToastContainer } from './components/ui/Toast';

// Heavy pages: code-split to keep initial bundle lean
const VendorDashboard = lazy(() => import('./pages/VendorDashboard').then(m => ({ default: m.VendorDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Map = lazy(() => import('./pages/Map').then(m => ({ default: m.Map })));
const KullaCoin = lazy(() => import('./pages/KullaCoin').then(m => ({ default: m.KullaCoin })));
const SignatureSong = lazy(() => import('./pages/SignatureSong').then(m => ({ default: m.SignatureSong })));

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
        <Route path="/events" element={<Events />} />
        <Route path="/protea" element={<Protea />} />
        <Route path="/blissings" element={<Blissings />} />
        <Route path="/raffle" element={<Raffle />} />
        <Route path="/custom-tee" element={<CustomTee />} />
        <Route path="/rasta-rooster" element={<RastaRooster />} />
        <Route path="/kingdom-tokens" element={<KingdomTokens />} />
        <Route path="/kullacoin" element={<Suspense fallback={<PageLoader />}><KullaCoin /></Suspense>} />
        <Route path="/signature" element={<Suspense fallback={<PageLoader />}><SignatureSong /></Suspense>} />
        <Route path="/vendor" element={<Suspense fallback={<PageLoader />}><VendorDashboard /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
        <Route path="/map" element={<Suspense fallback={<PageLoader />}><Map /></Suspense>} />
      </Routes>
    </HashRouter>
  );
}
