import './App.css';
import Splash from './screens/splash';
import AdminDashboard from './screens/adminDashboard';

function App() {
  // Quick in-app routing: if path starts with /admin, show AdminDashboard
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (path && path.startsWith('/admin')) {
    return <AdminDashboard />;
  }

  // Default: render the splash screen (logo + label)
  return <Splash />;
}

export default App;
