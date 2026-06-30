import { HashRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Directory } from './pages/Directory';
import { Storefront } from './pages/Storefront';
import { OrderTracking } from './pages/OrderTracking';
import { VendorDashboard } from './pages/VendorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Apply } from './pages/Apply';
import { Account } from './pages/Account';
import { ToastContainer } from './components/ui/Toast';

export default function App() {
  return (
    <HashRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/vendors" element={<Directory />} />
        <Route path="/vendors/:slug" element={<Storefront />} />
        <Route path="/order/:id" element={<OrderTracking />} />
        <Route path="/vendor" element={<VendorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </HashRouter>
  );
}
