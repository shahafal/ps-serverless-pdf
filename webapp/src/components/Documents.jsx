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
    Alert
} from '@mui/material';
import { fetchDocuments } from '../api/documents';

function Documents() {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDocuments();
    }, []);

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

    if (loading) {
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
            <Typography variant="h4" component="h1" gutterBottom>
                Documents
            </Typography>
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
                                <TableCell>{doc.Owner}</TableCell>
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
