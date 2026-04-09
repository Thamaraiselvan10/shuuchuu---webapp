import React, { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import Modal from './Modal';
import Button from './Button';

const ProfilePopup = ({ isOpen, onNext, hideOverlay }) => {
    const { profile } = useProfile();

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onNext} title="Who Am I?" maxWidth="500px" hideOverlay={hideOverlay}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
                {profile.photo ? (
                    <img
                        src={profile.photo}
                        alt="Profile"
                        style={{
                            width: '150px',
                            height: '150px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            marginBottom: '20px',
                            border: '4px solid var(--primary-color)'
                        }}
                    />
                ) : (
                    <div style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        backgroundColor: '#ccc',
                        margin: '0 auto 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        color: '#666'
                    }}>
                        ?
                    </div>
                )}

                {profile.bio ? (
                    <div style={{ fontSize: '1.2rem', fontStyle: 'italic', lineHeight: '1.6' }}>
                        "{profile.bio}"
                    </div>
                ) : (
                    <p>You haven't defined who you are yet. Go to your profile to set it up!</p>
                )}

                <div style={{ marginTop: '30px' }}>
                    <Button onClick={onNext} variant="primary">Let's Go!</Button>
                </div>
            </div>
        </Modal>
    );
};

export default ProfilePopup;
