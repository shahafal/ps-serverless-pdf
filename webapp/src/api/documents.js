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
