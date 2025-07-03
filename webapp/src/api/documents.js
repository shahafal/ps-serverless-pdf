import { Auth } from 'aws-amplify';
import { API_ENDPOINT } from '../config';

async function getAuthToken() {
    const session = await Auth.currentSession();
    return session.getAccessToken().getJwtToken();
}

export async function fetchDocuments() {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_ENDPOINT}/documents/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching documents:', error);
        throw error;
    }
}

export async function fetchDocument(id) {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_ENDPOINT}/documents/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch document');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching document:', error);
        throw error;
    }
}

export async function deleteDocument(id) {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_ENDPOINT}/documents/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete document');
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
}

export async function createDocument(file, name, tags) {
    try {
        const token = await getAuthToken();
        const formData = new FormData();

        // Add file with fieldName 'document' to match schema
        formData.append('document', file);
        formData.append('name', name);
        if (tags && tags.length > 0) {
            formData.append('tags', tags.join(','));
        }

        const response = await fetch(`${API_ENDPOINT}/documents/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        // Debug response
        console.log('Response:', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
        });

        // Handle error responses
        if (response.status !== 200) {
            // Try to parse error as JSON, fallback to text if not JSON
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message;
            } catch (e) {
                errorMessage = errorText;
            }
            throw new Error(errorMessage || 'Failed to create document');
        }

        // For successful response, get the message text
        const message = await response.text();
        return {
            success: true,
            message: message || 'Document uploaded successfully. Please wait a few minutes while we process it.'
        };

    } catch (error) {
        console.error('Error creating document:', error);
        throw error;
    }
}
