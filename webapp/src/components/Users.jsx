import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Box,
    Button
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { fetchUsers } from '../api/users';

function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Define loadUsers before useEffect
    const loadUsers = async () => {
        console.log('Fetching users...');
        try {
            const data = await fetchUsers();
            console.log('Users data:', data);
            setUsers(data.users || []);
            setError(null);
        } catch (err) {
            console.error('Load users error:', err);
            setError('Failed to load users. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Use loadUsers in useEffect
    useEffect(() => {
        console.log('Users component mounted');
        loadUsers();
    }, []);

    console.log('Current users state:', users); // Debug log

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <CircularProgress />
            </div>
        );
    }

    if (error) {
        return (
            <Alert 
                severity="error" 
                sx={{ margin: '1rem' }}
                action={
                    <Button color="inherit" size="small" onClick={loadUsers}>
                        Retry
                    </Button>
                }
            >
                {error}
            </Alert>
        );
    }

    return (
        <div style={{ padding: '1rem' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/documents')}
                    sx={{ mb: 2 }}
                >
                    Back to Documents
                </Button>
            </Box>
            
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Users
                </Typography>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Group</TableCell>
                            <TableCell>Created</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.userId}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.group}</TableCell>
                                <TableCell>
                                    {new Date(user.dateCreated).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}

export default Users;
