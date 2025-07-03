import React, { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';

export async function getUserGroups() {
    try {
        const user = await Auth.currentAuthenticatedUser();
        const groups = user.signInUserSession.accessToken.payload['cognito:groups'] || [];
        return groups;
    } catch (error) {
        console.error('Error getting user groups:', error);
        return [];
    }
}

export function useUserGroups() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadGroups() {
            const userGroups = await getUserGroups();
            setGroups(userGroups);
            setLoading(false);
        }
        loadGroups();
    }, []);

    return {
        isAdmin: groups.includes('admin'),
        isContributor: groups.includes('contributor'),
        canCreateDocuments: groups.some(g => ['admin', 'contributor'].includes(g)),
        loading
    };
}
