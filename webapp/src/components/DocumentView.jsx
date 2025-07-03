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
    Box
} from '@mui/material';
import { ArrowBack, Download } from '@mui/icons-material';
import { fetchDocument } from '../api/documents';

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
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/documents')}
                sx={{ marginBottom: 2 }}
            >
                Back to Documents
            </Button>

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
                </Grid>
            </Grid>
        </div>
    );
}

export default DocumentView;
