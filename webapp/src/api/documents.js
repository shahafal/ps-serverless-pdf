import { Auth } from 'aws-amplify';
import { API_ENDPOINT } from '../config';

export async function fetchDocuments() {
    try {
        const session = await Auth.currentSession();
        const token = session.getAccessToken().getJwtToken();

        const response = await fetch(`${API_ENDPOINT}/documents/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        const documents = await response.json();
        return documents;
    } catch (error) {
        console.error('Error fetching documents:', error);
        throw error;
    }
}
