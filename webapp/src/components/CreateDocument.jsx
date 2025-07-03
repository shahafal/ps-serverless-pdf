import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    Chip,
    Stack
} from '@mui/material';
import { Upload as UploadIcon, ArrowBack } from '@mui/icons-material';
import { createDocument } from '../api/documents';

function CreateDocument() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [name, setName] = useState('');
    const [tags, setTags] = useState([]);
    const [currentTag, setCurrentTag] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setError(null);
        } else {
            setFile(null);
            setError('Please select a valid PDF file');
        }
    };

    const handleAddTag = (event) => {
        if (event.key === 'Enter' && currentTag.trim()) {
            event.preventDefault();
            if (!tags.includes(currentTag.trim())) {
                setTags([...tags, currentTag.trim()]);
            }
            setCurrentTag('');
        }
    };

    const handleDeleteTag = (tagToDelete) => {
        setTags(tags.filter(tag => tag !== tagToDelete));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file || !name.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const result = await createDocument(file, name.trim(), tags);
            navigate('/documents', {
                state: {
                    message: result.message,
                    severity: 'success'
                }
            });
        } catch (err) {
            setError('Failed to create document. Please try again.');
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/documents')}
                    sx={{ mb: 3 }}
                >
                    Back to Documents
                </Button>

                <Paper sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Create New Document
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Box sx={{ mb: 3 }}>
                            <input
                                accept="application/pdf"
                                style={{ display: 'none' }}
                                id="raised-button-file"
                                type="file"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="raised-button-file">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    fullWidth
                                >
                                    {file ? file.name : 'Select PDF File *'}
                                </Button>
                            </label>
                        </Box>

                        <TextField
                            label="Document Name"
                            required
                            fullWidth
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            label="Add Tags (Press Enter to add)"
                            fullWidth
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            onKeyPress={handleAddTag}
                            sx={{ mb: 2 }}
                        />

                        {tags.length > 0 && (
                            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                                {tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        onDelete={() => handleDeleteTag(tag)}
                                    />
                                ))}
                            </Stack>
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={loading || !file || !name.trim()}
                            startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
                        >
                            {loading ? 'Uploading...' : 'Create Document'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

export default CreateDocument;
