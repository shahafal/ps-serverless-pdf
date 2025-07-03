import React from 'react';
import { Amplify } from 'aws-amplify';
import { AUTH_CONFIG } from './config';
import AuthWrapper from './components/AuthWrapper';

// Configure Amplify with auth settings
Amplify.configure({
    Auth: AUTH_CONFIG
});

function App() {
    return (
        <div>
            <AuthWrapper />
        </div>
    );
}

export default App;
