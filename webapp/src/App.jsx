import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { AUTH_CONFIG } from './config';
import Documents from './components/Documents';
import Users from './components/Users';
import DocumentView from './components/DocumentView';
import CreateDocument from './components/CreateDocument';
import AuthWrapper, { ProtectedCreateRoute } from './components/AuthWrapper';
import { useUserGroups } from './utils/auth';

Amplify.configure({ Auth: AUTH_CONFIG });

function RequireAdmin({ children }) {
    const { isAdmin, loading } = useUserGroups();
    if (loading) return null;
    return isAdmin ? children : <Navigate to="/documents" replace />;
}

function App() {
    return (
        <Router>
            <Authenticator hideSignUp={true} components={{
                SignUp: () => null
            }}>
                {({ signOut }) => (
                    <AuthWrapper signOut={signOut}>
                        <Routes>
                            <Route path="/users" element={<RequireAdmin><Users /></RequireAdmin>} />
                            <Route
                                path="/documents/create"
                                element={
                                    <ProtectedCreateRoute>
                                        <CreateDocument />
                                    </ProtectedCreateRoute>
                                }
                            />
                            <Route path="/documents/:id" element={<DocumentView />} />
                            <Route path="/documents" element={<Documents />} />
                            <Route path="/" element={<Navigate to="/documents" replace />} />
                            <Route path="*" element={<Navigate to="/documents" replace />} />
                        </Routes>
                    </AuthWrapper>
                )}
            </Authenticator>
        </Router>
    );
}

export default App;
