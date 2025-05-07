import { useState, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import RouteRenderer from './routes/RouteRenderer';
import routes from './routes';
import Layout from './components/Layout';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start as open

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Layout sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar}>
          <RouteRenderer routes={routes} />
        </Layout>
      </Suspense>
    </Router>
  );
}

export default App;
