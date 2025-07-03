import { Auth } from 'aws-amplify';
import { API_ENDPOINT } from '../config';

async function getAuthToken() {
    const session = await Auth.currentSession();
    return session.getAccessToken().getJwtToken();
}

export async function fetchUsers() {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_ENDPOINT}/users/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

export async function fetchUserProfiles() {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_ENDPOINT}/users/profiles`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profiles');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

export async function createUser(userData) {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_ENDPOINT}/users/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('Failed to create user');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

export async function deleteUser(userId) {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${API_ENDPOINT}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete user');
        }

        const data = await response.text();
        return { message: data };
    } catch (error) {
        throw error;
    }
}
