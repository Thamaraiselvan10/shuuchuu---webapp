import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Clock } from 'lucide-react';

const Profile = () => {
    const { profile, updateProfile } = useProfile();
    const { currentUser, logout } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        photo: ''
    });

    const navigate = useNavigate();

    const { showToast } = useToast();

    useEffect(() => {
        setFormData(profile);
    }, [profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateProfile(formData);
        showToast('Profile updated successfully!', 'success');
        navigate('/');
    };

    const presetAvatars = [
        { id: 'avatar1', name: 'Avatar 1', src: './avatars/avatar1.gif' },
        { id: 'avatar2', name: 'Avatar 2', src: './avatars/avatar2.gif' },
        { id: 'avatar3', name: 'Avatar 3', src: './avatars/avatar3.gif' },
        { id: 'avatar4', name: 'Avatar 4', src: './avatars/avatar4.gif' },
        { id: 'avatar5', name: 'Avatar 5', src: './avatars/avatar5.gif' },
    ];

    const handleSelectPreset = (avatarSrc) => {
        setFormData(prev => ({ ...prev, photo: avatarSrc }));
    };

    const bioRef = useRef(null);

    const handleNameKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            bioRef.current?.focus();
        }
    };

    return (
        <div className="profile-page-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-title-section">
                        <h1>Edit Profile</h1>
                        <p>Customize your personal presence</p>
                    </div>
                    {currentUser && (
                        <div className="user-profile-meta">
                            <div className="lifetime-focus-badge">
                                <Clock size={14} />
                                <span>{currentUser.minutes_used || 0} lifetime minutes (local)</span>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="photo-section">
                        <div className="photo-container">
                            <div className="photo-wrapper">
                                {formData.photo ? (
                                    <img src={formData.photo} alt="Profile" />
                                ) : (
                                    <div className="photo-placeholder">
                                        <span>Click to upload or select a preset</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    title="Choose a profile picture"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="avatar-presets">
                        <p className="presets-label">Or choose a preset mascot:</p>
                        <div className="avatar-grid">
                            {presetAvatars.map((avatar) => (
                                <button
                                    key={avatar.id}
                                    type="button"
                                    className={`preset-avatar-btn ${formData.photo === avatar.src ? 'selected' : ''}`}
                                    onClick={() => handleSelectPreset(avatar.src)}
                                    title={avatar.name}
                                >
                                    <img src={avatar.src} alt={avatar.name} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-sections">
                        <Input
                            label="Your Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            onKeyDown={handleNameKeyDown}
                            autoFocus
                        />

                        <div className="bio-section">
                            <label className="input-label">Short Bio</label>
                            <textarea
                                ref={bioRef}
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Tell us a bit about yourself..."
                                rows="3"
                                className="bio-textarea"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button type="submit" variant="primary">Save Changes</Button>
                        <Button type="button" variant="secondary" onClick={() => navigate('/')}>Cancel</Button>
                    </div>
                </form>

                <div className="logout-section" style={{ opacity: 0.3, pointerEvents: 'none' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Local mode: Login features disabled</p>
                </div>
            </div>

            <style>{`
                .profile-page-container {
                    padding: 30px;
                    max-width: 900px;
                    margin: 0 auto;
                }

                .profile-card {
                    background: var(--card-bg, rgba(30, 32, 45, 0.4));
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
                    border-radius: 20px;
                    padding: 30px;
                }

                .profile-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 30px;
                    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
                    padding-bottom: 20px;
                }

                .user-profile-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    align-items: flex-end;
                }

                .lifetime-focus-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(139, 92, 246, 0.1);
                    color: #8b5cf6;
                    border-color: rgba(139, 92, 246, 0.2);
                }

                .photo-section {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 20px;
                }

                .photo-wrapper {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    border: 4px solid var(--primary-color);
                    overflow: hidden;
                    position: relative;
                }

                .photo-wrapper img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .photo-wrapper input {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    cursor: pointer;
                }

                .avatar-presets {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .avatar-grid {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                }

                .preset-avatar-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 2px solid transparent;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 0;
                }

                .preset-avatar-btn.selected {
                    border-color: var(--primary-color);
                    transform: scale(1.1);
                }

                .preset-avatar-btn img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .bio-textarea {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 12px;
                    color: white;
                    resize: none;
                }

                .form-actions {
                    display: flex;
                    gap: 15px;
                    margin-top: 20px;
                }

                .logout-section {
                    margin-top: 40px;
                    text-align: center;
                }
            `}</style>
        </div>
    );
};

export default Profile;
