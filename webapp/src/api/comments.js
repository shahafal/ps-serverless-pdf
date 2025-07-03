import { Auth } from 'aws-amplify';
import { API_ENDPOINT } from '../config';

async function getAuthToken() {
    const session = await Auth.currentSession();
    return session.getAccessToken().getJwtToken();
}

export async function fetchComments(documentId) {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_ENDPOINT}/comments/${documentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

export async function createComment(documentId, text) {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_ENDPOINT}/comments/${documentId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Comment: text
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create comment');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

export async function deleteComment(documentId, commentId) {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_ENDPOINT}/comments/${documentId}/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete comment');
        }

        return await response.text();
    } catch (error) {
        throw error;
    }
}
