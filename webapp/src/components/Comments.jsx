import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    TextField,
    Button,
    Box,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { fetchComments, createComment } from '../api/comments';

function formatDate(isoDate) {
    return new Date(isoDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function Comments({ documentId }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [documentId]);

    async function loadComments() {
        try {
            const data = await fetchComments(documentId);
            setComments(data);
            setError(null);
        } catch (err) {
            setError('Failed to load comments. Please try again later.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const comment = await createComment(documentId, newComment);
            setComments(prev => [...prev, comment]);
            setNewComment('');
            setError(null);
        } catch (err) {
            setError('Failed to add comment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                Comments
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <List>
                {comments.map((comment) => (
                    <React.Fragment key={comment.SK}>
                        <ListItem alignItems="flex-start">
                            <ListItemText
                                secondary={
                                    <>
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            color="text.primary"
                                            sx={{ display: 'block' }}
                                        >
                                            {comment.Owner}
                                        </Typography>
                                        {formatDate(comment.DateAdded)}
                                        <Typography
                                            component="div"
                                            variant="body1"
                                            sx={{ mt: 1 }}
                                        >
                                            {comment.Comment}
                                        </Typography>
                                    </>
                                }
                            />
                        </ListItem>
                        <Divider component="li" />
                    </React.Fragment>
                ))}
                {comments.length === 0 && (
                    <ListItem>
                        <ListItemText 
                            secondary="No comments yet. Be the first to comment!"
                        />
                    </ListItem>
                )}
            </List>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={submitting}
                    sx={{ mb: 1 }}
                />
                <Button
                    type="submit"
                    variant="contained"
                    endIcon={<SendIcon />}
                    disabled={submitting || !newComment.trim()}
                >
                    {submitting ? 'Posting...' : 'Post Comment'}
                </Button>
            </Box>
        </Paper>
    );
}

export default Comments;
