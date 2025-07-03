import React from 'react';
import { ThemeProvider, CssBaseline, Button } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserGroups } from '../utils/auth';

const theme = createTheme();

export function ProtectedCreateRoute({ children }) {
    const location = useLocation();
    const { canCreateDocuments, loading } = useUserGroups();

    if (loading) {
        return null;
    }

    return canCreateDocuments ? (
        children
    ) : (
        <Navigate to="/documents" state={{ from: location }} replace />
    );
}

function AuthWrapper({ children, signOut }) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div>
                {children}
                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="outlined" color="primary" onClick={signOut}>
                        Sign out
                    </Button>
                </div>
            </div>
        </ThemeProvider>
    );
}

export default AuthWrapper;
