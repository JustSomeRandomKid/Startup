import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import Home from './app/Home.jsx';

console.log('Rendering the app');
console.log(Home); // Debugging - Check if Home is defined

const root = ReactDOM.createRoot(document.getElementById('root'));
console.log(root ? "✅ Found #root in index.html" : "❌ #root not found!");
root.render(
  <React.StrictMode>
    <ChakraProvider>
      <Home />
    </ChakraProvider>
  </React.StrictMode>
);
