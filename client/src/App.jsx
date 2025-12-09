import React from 'react';                         // Import React library
import Calculator from './components/Calculator';  // Import Calculator component

export default function App() {

  // Local state to store IT and business rate settings
  const [settings, setSettings] = React.useState({ 
    itRate: 100, 
    businessRate: 150 
  });

  // Load settings from backend when component mounts
  React.useEffect(() => {

    fetch('http://localhost:4000/api/settings')    // API call to fetch saved rates
      .then(r => r.json())                         // Convert response to JSON
      .then(data => setSettings(data))             // Update settings state
      .catch(() => {});                            // Ignore errors silently

  }, []);

  return (
    <div className="app-container">                {/* Main page container */}
      <h2 className="mb-3">Automated Savings Calculator</h2>
      
      {/* Pass loaded settings to Calculator component */}
      <Calculator settings={settings} />           
    </div>
  );
}
