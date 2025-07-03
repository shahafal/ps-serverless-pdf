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

export async function createDocument(file, name, tags) {
    try {
        const token = await getAuthToken();
        const formData = new FormData();

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

        if (response.status !== 200) {
            throw new Error('Failed to create document');
        }

        return {
            success: true,
            message: 'Document uploaded successfully. Please wait a few minutes while we process it.'
        };

    } catch (error) {
        console.error('Error creating document:', error);
        throw error;
    }
}
