import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRegisterPatient from './pages/admin/AdminRegisterPatient';
import AdminStaff from './pages/admin/AdminStaff';
import AdminFinancials from './pages/admin/AdminFinancials';
import AdminLogs from './pages/admin/AdminLogs';
import AdminSettings from './pages/admin/AdminSettings';
import AdminExpenses from './pages/admin/AdminExpenses';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminMasterCatalog from './pages/admin/AdminMasterCatalog';
import AdminBundles from './pages/admin/AdminBundles';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import ConsultationModule from './pages/doctor/ConsultationModule';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';
import DoctorLabs from './pages/doctor/DoctorLabs';
import DoctorMessages from './pages/doctor/DoctorMessages';
import DoctorReports from './pages/doctor/DoctorReports';
import DoctorSettings from './pages/doctor/DoctorSettings';
import PatientProfile from './pages/doctor/PatientProfile';
import RegistrarDashboard from './pages/registrar/RegistrarDashboard';
import RegistrarRegistration from './pages/registrar/RegistrarRegistration';
import RegistrarPatients from './pages/registrar/RegistrarPatients';
import RegistrarHistory from './pages/registrar/RegistrarHistory';
import RegistrarPrint from './pages/registrar/RegistrarPrint';
import RegistrarSettings from './pages/registrar/RegistrarSettings';
import LabDashboard from './pages/lab/LabDashboard';
import LabWorkbench from './pages/lab/LabWorkbench';
import LabResults from './pages/lab/LabResults';
import LabCatalog from './pages/lab/LabCatalog';
import LabInventory from './pages/lab/LabInventory';
import LabAnalytics from './pages/lab/LabAnalytics';
import LabSettings from './pages/lab/LabSettings';
import PharmaDashboard from './pages/pharmacy/PharmaDashboard';
import PharmaWorkbench from './pages/pharmacy/PharmaWorkbench';
import PharmaInventory from './pages/pharmacy/PharmaInventory';
import PharmaSales from './pages/pharmacy/PharmaSales';
import PharmaSettings from './pages/pharmacy/PharmaSettings';
import PharmaSuppliers from './pages/pharmacy/PharmaSuppliers';
import PharmaProcurement from './pages/pharmacy/PharmaProcurement';
import MedicineStatus from './pages/pharmacy/MedicineStatus';
import { NotificationProvider } from './components/NotificationContext';
import ICD10Search from './components/ICD10Search';

// ProtectedRoute Logic
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#000000' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <NotificationProvider>
      <Router 
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Admin — protected */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/register-patient" element={<ProtectedRoute><AdminRegisterPatient /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute><AdminStaff /></ProtectedRoute>} />
          <Route path="/admin/financials" element={<ProtectedRoute><AdminFinancials /></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute><AdminLogs /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/expenses" element={<ProtectedRoute><AdminExpenses /></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute><AdminAttendance /></ProtectedRoute>} />
          <Route path="/admin/master-catalog" element={<ProtectedRoute><AdminMasterCatalog /></ProtectedRoute>} />
          <Route path="/admin/bundles" element={<ProtectedRoute><AdminBundles /></ProtectedRoute>} />

          {/* Doctor — protected */}
          <Route path="/doctor" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/consultation" element={<ProtectedRoute><ConsultationModule /></ProtectedRoute>} />
          <Route path="/doctor/appointments" element={<ProtectedRoute><DoctorAppointments /></ProtectedRoute>} />
          <Route path="/doctor/patients" element={<ProtectedRoute><DoctorPatients /></ProtectedRoute>} />
          <Route path="/doctor/prescriptions" element={<ProtectedRoute><DoctorPrescriptions /></ProtectedRoute>} />
          <Route path="/doctor/labs" element={<ProtectedRoute><DoctorLabs /></ProtectedRoute>} />
          <Route path="/doctor/messages" element={<ProtectedRoute><DoctorMessages /></ProtectedRoute>} />
          <Route path="/doctor/reports" element={<ProtectedRoute><DoctorReports /></ProtectedRoute>} />
          <Route path="/doctor/settings" element={<ProtectedRoute><DoctorSettings /></ProtectedRoute>} />
          <Route path="/doctor/patient/:pid" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />

          {/* Registrar — protected */}
          <Route path="/registrar" element={<ProtectedRoute><RegistrarDashboard /></ProtectedRoute>} />
          <Route path="/registrar/new-patient" element={<ProtectedRoute><RegistrarRegistration /></ProtectedRoute>} />
          <Route path="/registrar/patients" element={<ProtectedRoute><RegistrarPatients /></ProtectedRoute>} />
          <Route path="/registrar/history" element={<ProtectedRoute><RegistrarHistory /></ProtectedRoute>} />
          <Route path="/registrar/print" element={<ProtectedRoute><RegistrarPrint /></ProtectedRoute>} />
          <Route path="/registrar/settings" element={<ProtectedRoute><RegistrarSettings /></ProtectedRoute>} />

          {/* Lab — protected */}
          <Route path="/lab" element={<ProtectedRoute><LabDashboard /></ProtectedRoute>} />
          <Route path="/lab/workbench" element={<ProtectedRoute><LabWorkbench /></ProtectedRoute>} />
          <Route path="/lab/results" element={<ProtectedRoute><LabResults /></ProtectedRoute>} />
          <Route path="/lab/catalog" element={<ProtectedRoute><LabCatalog /></ProtectedRoute>} />
          <Route path="/lab/inventory" element={<ProtectedRoute><LabInventory /></ProtectedRoute>} />
          <Route path="/lab/analytics" element={<ProtectedRoute><LabAnalytics /></ProtectedRoute>} />
          <Route path="/lab/settings" element={<ProtectedRoute><LabSettings /></ProtectedRoute>} />

          {/* Pharmacy — protected */}
          <Route path="/pharmacy" element={<ProtectedRoute><PharmaDashboard /></ProtectedRoute>} />
          <Route path="/pharmacy/workbench" element={<ProtectedRoute><PharmaWorkbench /></ProtectedRoute>} />
          <Route path="/pharmacy/inventory" element={<ProtectedRoute><PharmaInventory /></ProtectedRoute>} />
          <Route path="/pharmacy/sales" element={<ProtectedRoute><PharmaSales /></ProtectedRoute>} />
          <Route path="/pharmacy/settings" element={<ProtectedRoute><PharmaSettings /></ProtectedRoute>} />
          <Route path="/pharmacy/suppliers" element={<ProtectedRoute><PharmaSuppliers /></ProtectedRoute>} />
          <Route path="/pharmacy/procurement" element={<ProtectedRoute><PharmaProcurement /></ProtectedRoute>} />
          <Route path="/pharmacy/status" element={<ProtectedRoute><MedicineStatus /></ProtectedRoute>} />

          <Route path="/icd-prototype" element={<ICD10Search />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;