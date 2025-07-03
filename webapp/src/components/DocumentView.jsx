import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Paper,
    Grid,
    Typography,
    CircularProgress,
    Alert,
    Card,
    CardMedia,
    CardContent,
    Button,
    List,
    ListItem,
    ListItemText,
    Chip,
    Box,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import { ArrowBack, Download, Delete } from '@mui/icons-material';
import { fetchDocument, deleteDocument } from '../api/documents';
import Comments from './Comments';
import { useUserGroups } from '../utils/auth';

function formatDate(isoDate) {
    return new Date(isoDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function DocumentView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { canCreateDocuments } = useUserGroups();
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        loadDocument();
    }, [id]);

    async function loadDocument() {
        try {
            const data = await fetchDocument(id);
            setDocument(data);
            setError(null);
        } catch (err) {
            setError('Failed to load document. Please try again later.');
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        setDeleteLoading(true);
        try {
            await deleteDocument(id);
            navigate('/documents', {
                state: {
                    message: 'Document was successfully deleted',
                    severity: 'success'
                }
            });
        } catch (err) {
            setError('Failed to delete document. Please try again.');
            setDeleteDialogOpen(false);
        } finally {
            setDeleteLoading(false);
        }
    };

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
        <Container maxWidth="lg">
            <div style={{ padding: '1rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/documents')}
                    >
                        Back to Documents
                    </Button>
                    {canCreateDocuments && (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<Delete />}
                            onClick={handleDeleteClick}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? 'Deleting...' : 'Delete Document'}
                        </Button>
                    )}
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardMedia
                                component="img"
                                image={document.Thumbnail}
                                alt={document.Name}
                                sx={{ objectFit: 'contain', maxHeight: 300 }}
                            />
                            <CardContent>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<Download />}
                                    fullWidth
                                    href={document.Document}
                                    target="_blank"
                                >
                                    Download PDF
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Paper sx={{ padding: 2 }}>
                            <Typography variant="h5" gutterBottom>
                                {document.Name}
                            </Typography>

                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary="Owner"
                                        secondary={document.Owner}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Upload Date"
                                        secondary={formatDate(document.DateUploaded)}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="File Name"
                                        secondary={document.FileDetails?.fileName}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Content Type"
                                        secondary={document.FileDetails?.contentType}
                                    />
                                </ListItem>
                                {document.Tags && (
                                    <ListItem>
                                        <ListItemText
                                            primary="Tags"
                                            secondary={
                                                <Box sx={{ mt: 1 }}>
                                                    {document.Tags.map(tag => (
                                                        <Chip
                                                            key={tag}
                                                            label={tag}
                                                            sx={{ mr: 1, mb: 1 }}
                                                        />
                                                    ))}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </Paper>

                        <Comments documentId={id} />
                    </Grid>
                </Grid>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Document</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this document? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={deleteLoading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm}
                        color="error"
                        disabled={deleteLoading}
                    >
                        {deleteLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default DocumentView;
