// src/components/GlobalAlerts.tsx


//TO-DO: Need to add a design for warnig and success
import { useContext } from 'react';
import { GlobalContext } from '../../context';

const Alerts = () => {
  const context = useContext(GlobalContext);
  if (!context) return null;

  const { success, error, alert } = context;

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {success && <div className="bg-green-600 text-white px-4 py-2 rounded">{success}</div>}
      {error && <div className="bg-red-600 text-white px-4 py-2 rounded">{error}</div>}
      {alert && <div className="bg-yellow-400 text-black px-4 py-2 mt-5 rounded">{alert}</div>}
    </div>
  );
};

export default Alerts;
