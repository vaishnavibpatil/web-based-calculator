import React from 'react';
import Calculator from './components/Calculator';

export default function App() {
  // If App fetched settings previously, keep that; else, use local defaults.
  const [settings, setSettings] = React.useState({ itRate: 100, businessRate: 150 });

  React.useEffect(() => {
    // try loading settings from server
    fetch('http://localhost:4000/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  return (
    <div className="app-container">
      <h2 className="mb-3">Automated Savings Calculator</h2>
      <Calculator settings={settings} />
    </div>
  );
}
