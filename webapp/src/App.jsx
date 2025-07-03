import React from 'react';
import { Amplify } from 'aws-amplify';
import { BrowserRouter } from 'react-router-dom';
import { AUTH_CONFIG } from './config';
import AuthWrapper from './components/AuthWrapper';

// Configure Amplify with auth settings
Amplify.configure({
    Auth: AUTH_CONFIG
});

function App() {
    return (
        <BrowserRouter>
            <AuthWrapper />
        </BrowserRouter>
    );
}

export default App;
