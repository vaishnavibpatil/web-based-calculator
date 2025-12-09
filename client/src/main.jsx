// Import Bootstrap CSS for styling
import 'bootstrap/dist/css/bootstrap.min.css';

// Import custom CSS file
import './styles.css'; 

// Import React library
import React from 'react';

// Import ReactDOM for rendering app
import ReactDOM from 'react-dom/client';

// Import main App component
import App from './App';

// Render the App component into the root HTML element
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
