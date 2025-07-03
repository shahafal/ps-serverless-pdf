import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { ThemeProvider, CssBaseline, Button } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import '@aws-amplify/ui-react/styles.css';
import Documents from './Documents';

const theme = createTheme();

function AuthWrapper() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Authenticator>
                {({ signOut }) => (
                    <div>
                        <Documents />
                        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="outlined" color="primary" onClick={signOut}>
                                Sign out
                            </Button>
                        </div>
                    </div>
                )}
            </Authenticator>
        </ThemeProvider>
    );
}

export default AuthWrapper;
