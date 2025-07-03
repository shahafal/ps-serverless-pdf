import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import Home from './Home';

function AuthWrapper() {
    return (
        <Authenticator>
            {({ signOut }) => (
                <div>
                    <button onClick={signOut}>Sign out</button>
                    <Home />
                </div>
            )}
        </Authenticator>
    );
}

export default AuthWrapper;
