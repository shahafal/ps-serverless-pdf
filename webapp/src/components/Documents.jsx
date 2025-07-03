import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Box,
    Stack
} from '@mui/material';
import { Add as AddIcon, People as PeopleIcon } from '@mui/icons-material';
import { fetchDocuments } from '../api/documents';
import { useUserGroups } from '../utils/auth';
import { useUsers } from '../utils/UserProvider';

function Documents() {
    const navigate = useNavigate();
    const location = useLocation();
    const { canCreateDocuments, isAdmin, loading: loadingPermissions } = useUserGroups();
    const { renderUser, loading: loadingUsers } = useUsers();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(location.state?.message);

    useEffect(() => {
        loadDocuments();
    }, []);

    // Clear navigation state after showing notification
    useEffect(() => {
        if (location.state?.message) {
            // Clear the navigation state
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    async function loadDocuments() {
        try {
            const data = await fetchDocuments();
            setDocuments(data);
            setError(null);
        } catch (err) {
            setError('Failed to load documents. Please try again later.');
        } finally {
            setLoading(false);
        }
    }

    function formatDate(isoDate) {
        return new Date(isoDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function handleRowClick(id) {
        navigate(`/documents/${id}`);
    }

    if (loading || loadingPermissions || loadingUsers) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <CircularProgress />
            </div>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ margin: '1rem' }}>
                {error}
            </Alert>
        );
    }

    return (
        <div style={{ padding: '1rem' }}>
            {notification && (
                <Alert 
                    severity={location.state?.severity || 'success'} 
                    sx={{ mb: 2 }}
                    onClose={() => setNotification(null)}
                >
                    {notification}
                </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Documents
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {isAdmin && (
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<PeopleIcon />}
                            onClick={() => navigate('/users')}
                        >
                            Manage Users
                        </Button>
                    )}
                    {canCreateDocuments && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/documents/create')}
                        >
                            Create Document
                        </Button>
                    )}
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Owner</TableCell>
                            <TableCell>Upload Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {documents.map((doc) => (
                            <TableRow 
                                key={doc.PK}
                                onClick={() => handleRowClick(doc.PK)}
                                hover
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell>{doc.Name}</TableCell>
                                <TableCell>
                                    <Typography component="div">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            {renderUser(doc.Owner, { avatarSize: 32 }).avatar}
                                            <span>{renderUser(doc.Owner).name || 'Unknown User'}</span>
                                        </Stack>
                                    </Typography>
                                </TableCell>
                                <TableCell>{formatDate(doc.DateUploaded)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}

export default Documents;
