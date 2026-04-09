import React, { createContext, useState, useEffect, useContext } from 'react';

const ProfileContext = createContext();

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState({
        name: '',
        bio: '',
        photo: null // URL or base64 string
    });

    useEffect(() => {
        const savedProfile = localStorage.getItem('user-profile');
        if (savedProfile) {
            setProfile(JSON.parse(savedProfile));
        }
    }, []);

    const updateProfile = (newProfile) => {
        setProfile(prev => {
            const updated = { ...prev, ...newProfile };
            localStorage.setItem('user-profile', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <ProfileContext.Provider value={{ profile, updateProfile }}>
            {children}
        </ProfileContext.Provider>
    );
};
