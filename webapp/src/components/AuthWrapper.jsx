import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { ThemeProvider, CssBaseline, Button } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import '@aws-amplify/ui-react/styles.css';
import Documents from './Documents';
import DocumentView from './DocumentView';
import CreateDocument from './CreateDocument';
import { useUserGroups } from '../utils/auth';

const theme = createTheme();

function ProtectedCreateRoute() {
    const location = useLocation();
    const { canCreateDocuments, loading } = useUserGroups();

    if (loading) {
        return null;
    }

    return canCreateDocuments ? (
        <CreateDocument />
    ) : (
        <Navigate to="/documents" state={{ from: location }} replace />
    );
}

function AuthWrapper() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Authenticator>
                {({ signOut }) => (
                    <div>
                        <Routes>
                            <Route path="/documents/create" element={<ProtectedCreateRoute />} />
                            <Route path="/documents/:id" element={<DocumentView />} />
                            <Route path="/documents" element={<Documents />} />
                            <Route path="/" element={<Navigate to="/documents" replace />} />
                        </Routes>
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
