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
    Alert,
    IconButton,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import { Send as SendIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { fetchComments, createComment, deleteComment } from '../api/comments';
import { useUserGroups } from '../utils/auth';
import { useUsers } from '../utils/UserProvider';

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
    const { canCreateDocuments } = useUserGroups(); // Admin or contributor
    const { renderUser } = useUsers();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

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

    const handleDeleteClick = (comment) => {
        setCommentToDelete(comment);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!commentToDelete) return;

        setDeleteLoading(true);
        try {
            await deleteComment(documentId, commentToDelete.SK);
            setComments(prev => prev.filter(c => c.SK !== commentToDelete.SK));
            setDeleteDialogOpen(false);
            setCommentToDelete(null);
        } catch (err) {
            setError('Failed to delete comment. Please try again.');
        } finally {
            setDeleteLoading(false);
        }
    };

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
                        <ListItem 
                            alignItems="flex-start"
                            secondaryAction={
                                canCreateDocuments && (
                                    <Tooltip title="Delete Comment">
                                        <IconButton
                                            edge="end"
                                            color="error"
                                            onClick={() => handleDeleteClick(comment)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                )
                            }
                        >
                            <ListItemText
                                primary={
                                    <Typography component="div">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {renderUser(comment.Owner, { avatarSize: 32 }).avatar}
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                color="text.primary"
                                            >
                                                {renderUser(comment.Owner).name || 'Unknown User'}
                                            </Typography>
                                        </Box>
                                    </Typography>
                                }
                                secondary={
                                    <>
                                        {formatDate(comment.DateAdded)}
                                        <Typography
                                            component="span"
                                            variant="body1"
                                            sx={{ display: 'block', mt: 1 }}
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

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Comment</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this comment? This action cannot be undone.
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
        </Paper>
    );
}

export default Comments;
