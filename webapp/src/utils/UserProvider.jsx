import React, { createContext, useContext, useState, useEffect } from 'react';
import { Avatar } from '@mui/material';
import { AccountCircle as AccountCircleIcon } from '@mui/icons-material';
import { fetchUserProfiles } from '../api/users';

const UserContext = createContext();

export function useUsers() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUsers must be used within a UserProvider');
    }
    return context;
}

export function UserProvider({ children }) {
    const [userProfiles, setUserProfiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadUserProfiles();
    }, []);

    async function loadUserProfiles() {
        try {
            const response = await fetchUserProfiles();
            // Convert array to object for O(1) lookups
            const profilesMap = response.users.reduce((acc, profile) => {
                acc[profile.userId] = profile;
                return acc;
            }, {});
            setUserProfiles(profilesMap);
            setError(null);
        } catch (err) {
            console.error('Error loading user profiles:', err);
            setError('Failed to load user profiles');
        } finally {
            setLoading(false);
        }
    }

    // Utility function to render user name and avatar consistently
    function renderUser(userId, options = {}) {
        const { avatarOnly = false, avatarSize = 24 } = options;
        const profile = userProfiles[userId] || {};
        const name = profile.name;
        
        // Always return name instead of userId if profile exists
        if (!profile.name) {
            console.warn(`No profile found for user ${userId}`);
        }

        if (avatarOnly) {
            return (
                <Avatar
                    src={profile.pictureURL}
                    alt={name}
                    sx={{ width: avatarSize, height: avatarSize }}
                >
                    {profile.pictureURL ? null : <AccountCircleIcon />}
                </Avatar>
            );
        }

        return {
            name,
            pictureURL: profile.pictureURL,
            avatar: (
                <Avatar
                    src={profile.pictureURL}
                    alt={name}
                    sx={{ width: avatarSize, height: avatarSize }}
                >
                    {profile.pictureURL ? null : <AccountCircleIcon />}
                </Avatar>
            )
        };
    }

    const value = {
        userProfiles,
        loading,
        error,
        renderUser
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}
