import { BrowserRouter as Router } from 'react-router-dom';
import { Suspense } from 'react';
import RouteRenderer from './routes/RouteRenderer'; 
import routes from './routes';

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <RouteRenderer routes={routes} />
      </Suspense>
    </Router>
  );
}

export default App;
