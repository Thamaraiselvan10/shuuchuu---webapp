import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGoals } from '../context/GoalsContext';
import { useTasks } from '../context/TasksContext';
import { useCelebration } from '../context/CelebrationContext';
import Button from '../components/Button';
import PhaseModal from '../components/PhaseModal';
import GoalModal from '../components/GoalModal';
import Modal from '../components/Modal';
import { format } from 'date-fns';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Phase Card Component
const SortablePhaseCard = ({ phase, index, onComplete, onEdit, onDelete, isFirst, isLast }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: phase.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    const isCompleted = phase.status === 'completed';
    const isOverdue = phase.deadline && new Date(phase.deadline) < new Date() && !isCompleted;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`phase-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
        >
            {/* Timeline indicator */}
            <div className="phase-timeline">
                <div className={`phase-dot ${isCompleted ? 'completed' : ''}`}>
                    {isCompleted ? '✓' : index + 1}
                </div>
                {!isLast && <div className="phase-line"></div>}
            </div>

            {/* Phase content */}
            <div className="phase-main">
                <div className="phase-header-row">
                    <div className="phase-badge">Phase {index + 1}</div>
                    <div className={`phase-status-badge ${isCompleted ? 'completed' : isOverdue ? 'overdue' : 'pending'}`}>
                        {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                    </div>
                </div>

                <h3 className="phase-title">{phase.title}</h3>
                <p className="phase-description">{phase.description || 'No description provided.'}</p>

                {/* Phase Dates */}
                {(phase.start_date || phase.deadline) && (
                    <div className="phase-dates">
                        {phase.start_date && (
                            <span>🚀 Start: {format(new Date(phase.start_date), 'MMM d, yyyy')}</span>
                        )}
                        {phase.deadline && (
                            <span className={isOverdue ? 'overdue' : ''}>
                                📅 Due: {format(new Date(phase.deadline), 'MMM d, yyyy')}
                            </span>
                        )}
                    </div>
                )}

                {/* Completion Comment Display */}
                {isCompleted && phase.completion_comment && (
                    <div className="completion-comment">
                        <span className="comment-label">💬 Completion Note:</span>
                        <p>{phase.completion_comment}</p>
                    </div>
                )}

                <div className="phase-actions-row">
                    <div className="phase-reorder-btns">
                        <div
                            className="drag-handle"
                            {...attributes}
                            {...listeners}
                            title="Drag to reorder"
                        >
                            ⋮⋮
                        </div>
                    </div>

                    <div className="phase-action-btns">
                        <button
                            onClick={() => onComplete(phase)}
                            className={`complete-btn ${isCompleted ? 'undo' : ''}`}
                            title={isCompleted ? 'Mark as Pending' : 'Mark as Complete'}
                        >
                            {isCompleted ? 'Undo' : 'Complete'}
                        </button>
                        <button onClick={() => onEdit(phase)} className="action-btn edit" title="Edit">
                            ✎
                        </button>
                        <button onClick={() => onDelete(phase.id)} className="action-btn delete" title="Delete">
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sortable Grid Card Component for drag-and-drop
const SortableGridCard = ({ phase, index, onEdit, onComplete, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: phase.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    const isCompleted = phase.status === 'completed';
    const isOverdue = phase.deadline && new Date(phase.deadline) < new Date() && !isCompleted;

    const [showContextMenu, setShowContextMenu] = React.useState(false);
    const [contextPos, setContextPos] = React.useState({ x: 0, y: 0 });

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextPos({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className={`phase-grid-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
                onClick={onEdit}
                onContextMenu={handleContextMenu}
            >
                <div className="grid-card-header">
                    <div
                        className="drag-handle-grid"
                        {...attributes}
                        {...listeners}
                        title="Drag to reorder"
                    >
                        ⋮⋮
                    </div>
                    <span className="grid-phase-label">Phase {index + 1}</span>
                    <span className={`grid-status ${isCompleted ? 'completed' : isOverdue ? 'overdue' : 'pending'}`}>
                        {isCompleted ? 'Done' : isOverdue ? 'Overdue' : 'Pending'}
                    </span>
                </div>
                <h4 className="grid-phase-title">{phase.title}</h4>
                <p className="grid-phase-desc">{phase.description || 'No description'}</p>

                {isCompleted && phase.completion_comment && (
                    <div className="completion-comment">
                        <span className="comment-label">💬 Completion Note:</span>
                        <p>{phase.completion_comment}</p>
                    </div>
                )}

                <div className="grid-card-footer">
                    <div
                        className={`phase-complete-toggle ${isCompleted ? 'done' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onComplete(); }}
                        title={isCompleted ? 'Undo' : 'Mark Complete'}
                    >
                        <span className="toggle-circle">{isCompleted ? '✓' : ''}</span>
                        <span className="toggle-label">{isCompleted ? 'Completed' : 'Mark Done'}</span>
                    </div>
                </div>
            </div>
            {showContextMenu && (
                <div
                    className="phase-context-menu"
                    style={{ top: contextPos.y, left: contextPos.x }}
                    onClick={() => setShowContextMenu(false)}
                >
                    <button onClick={() => { onComplete(); setShowContextMenu(false); }}>
                        {isCompleted ? '⚪ Undo Complete' : '✅ Mark Complete'}
                    </button>
                    <div className="context-divider"></div>
                    <button className="danger" onClick={() => { onDelete(); setShowContextMenu(false); }}>
                        ✕ Delete Phase
                    </button>
                </div>
            )}
        </>
    );
};

const GoalDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { goals, updateGoal, deleteGoal, getGoalPhases, addPhase, updatePhase, deletePhase, reorderPhases, refreshGoals } = useGoals();
    const { addTask } = useTasks();
    const { triggerCelebration } = useCelebration();

    const [goal, setGoal] = useState(null);
    const [phases, setPhases] = useState([]);
    const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
    const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
    const [editingPhase, setEditingPhase] = useState(null);

    // Removed phaseView state as we are only using grid view
    // Removed hoveredPhase state for map view tooltip
    const [phaseContextMenu, setPhaseContextMenu] = useState(null); // For right-click menu

    // Completion modal state
    const [completionModalOpen, setCompletionModalOpen] = useState(false);
    const [phaseToComplete, setPhaseToComplete] = useState(null);
    const [completionComment, setCompletionComment] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        const foundGoal = goals.find(g => g.id === id);
        if (foundGoal) {
            setGoal(foundGoal);
            loadPhases();
        } else if (goals.length > 0) {
            navigate('/goals');
        }
    }, [id, goals]);

    const loadPhases = async () => {
        const data = await getGoalPhases(id);
        // Sort by order_index
        setPhases(data.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
    };

    const handleAddPhase = async (phaseData) => {
        const newPhase = await addPhase({ ...phaseData, goal_id: id, order_index: phases.length });

        if (phaseData.addToCalendar && phaseData.deadline) {
            await addTask({
                title: `Phase Deadline: ${phaseData.title}`,
                due_at: phaseData.deadline,
                category: 'Goal',
                priority: 2,
                description: `Deadline for phase: ${phaseData.title} in goal: ${goal.title}`
            });
        }

        loadPhases();
        refreshGoals();
    };

    const handleUpdatePhase = async (phaseData) => {
        if (editingPhase) {
            await updatePhase(editingPhase.id, phaseData);
            setEditingPhase(null);
            loadPhases();
            refreshGoals();
        }
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [phaseToDelete, setPhaseToDelete] = useState(null);

    const handleDeletePhase = (phaseId) => {
        setPhaseToDelete(phaseId);
        setDeleteModalOpen(true);
    };

    const confirmDeletePhase = async () => {
        if (phaseToDelete) {
            await deletePhase(phaseToDelete);
            setDeleteModalOpen(false);
            setPhaseToDelete(null);
            loadPhases();
            refreshGoals();
        }
    };

    const [isDeleteGoalModalOpen, setIsDeleteGoalModalOpen] = useState(false);

    const handleConfirmDeleteGoal = async () => {
        console.log('Attempting to delete goal with ID:', id);
        try {
            await deleteGoal(id);
            console.log('Goal deleted successfully');
            navigate('/goals');
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    const handleUpdateGoal = async (goalData) => {
        await updateGoal(id, goalData);
    };










    // Handle Complete button click
    const handleCompleteClick = (phase) => {
        if (phase.status === 'completed') {
            // If already completed, undo immediately
            togglePhaseStatus(phase);
        } else {
            // Open modal to get completion comment
            setPhaseToComplete(phase);
            setCompletionComment('');
            setCompletionModalOpen(true);
        }
    };

    // Confirm completion with comment
    const confirmCompletion = async () => {
        if (phaseToComplete) {
            await updatePhase(phaseToComplete.id, {
                status: 'completed',
                completion_comment: completionComment
            });
            setCompletionModalOpen(false);
            setPhaseToComplete(null);
            setCompletionComment('');
            loadPhases();
            refreshGoals();
            
            triggerCelebration('goals');
        }
    };

    const togglePhaseStatus = async (phase) => {
        const newStatus = phase.status === 'completed' ? 'pending' : 'completed';
        await updatePhase(phase.id, {
            status: newStatus,
            completion_comment: newStatus === 'pending' ? null : phase.completion_comment
        });
        loadPhases();
        refreshGoals();
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = phases.findIndex(p => p.id === active.id);
            const newIndex = phases.findIndex(p => p.id === over.id);
            const newPhases = arrayMove(phases, oldIndex, newIndex);
            setPhases(newPhases);
            await reorderPhases(newPhases);
            refreshGoals();
        }
    };

    if (!goal) return <div>Loading...</div>;

    const progress = phases.length > 0
        ? Math.round((phases.filter(p => p.status === 'completed').length / phases.length) * 100)
        : 0;

    return (
        <div className="goal-details-container">
            <div className="goal-details-header">
                <div className="header-top">
                    <button onClick={() => navigate('/goals')} className="back-btn-mini">←</button>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-color)', fontWeight: '700' }}>{goal.title}</h1>
                        <div className="goal-meta-row">
                            <span className="goal-category-tag">{goal.category}</span>
                            {goal.deadline && <span>Due: {format(new Date(goal.deadline), 'MMM d, yyyy')}</span>}
                        </div>
                    </div>
                    <Button onClick={() => setIsEditGoalModalOpen(true)} className="edit-goal-btn">Edit Goal</Button>
                </div>

                <div className="goal-description-box">
                    {goal.description}
                </div>

                <div className="progress-section">
                    <div className="progress-label">
                        <span>Roadmap Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="roadmap-container">
                <div className="roadmap-header">
                    <h2>Roadmap to Success 🚀</h2>
                    <Button onClick={() => { setEditingPhase(null); setIsPhaseModalOpen(true); }} className="add-phase-btn">+ Add Phase</Button>
                </div>

                {/* Grid View with Drag-and-Drop */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={phases.map(p => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="phases-grid">
                            {phases.length === 0 ? (
                                <div className="empty-state">
                                    <p>No phases defined yet. Start your journey by adding a phase!</p>
                                </div>
                            ) : (
                                phases.map((phase, index) => (
                                    <SortableGridCard
                                        key={phase.id}
                                        phase={phase}
                                        index={index}
                                        onEdit={() => { setEditingPhase(phase); setIsPhaseModalOpen(true); }}
                                        onComplete={() => handleCompleteClick(phase)}
                                        onDelete={() => handleDeletePhase(phase.id)}
                                    />
                                ))
                            )}
                        </div>
                    </SortableContext>
                </DndContext>

                {/* Timeline View - Hidden but kept for reference */}
                <div className="phases-timeline" style={{ display: 'none' }}>
                    {phases.length === 0 ? (
                        <div className="empty-state">
                            <p>No phases defined yet. Start your journey by adding a phase!</p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={phases.map(p => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {phases.map((phase, index) => (
                                    <SortablePhaseCard
                                        key={phase.id}
                                        phase={phase}
                                        index={index}
                                        onComplete={handleCompleteClick}
                                        onEdit={(p) => { setEditingPhase(p); setIsPhaseModalOpen(true); }}
                                        onDelete={handleDeletePhase}
                                        isFirst={index === 0}
                                        isLast={index === phases.length - 1}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>

            <PhaseModal
                isOpen={isPhaseModalOpen}
                onClose={() => setIsPhaseModalOpen(false)}
                onSave={editingPhase ? handleUpdatePhase : handleAddPhase}
                initialData={editingPhase}
            />

            <GoalModal
                isOpen={isEditGoalModalOpen}
                onClose={() => setIsEditGoalModalOpen(false)}
                onSave={handleUpdateGoal}
                onDelete={() => {
                    setIsEditGoalModalOpen(false);
                    setIsDeleteGoalModalOpen(true);
                }}
                initialData={goal}
            />

            {/* Delete Goal Confirmation Modal */}
            <Modal
                isOpen={isDeleteGoalModalOpen}
                onClose={() => setIsDeleteGoalModalOpen(false)}
                title="Delete Goal"
            >
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '20px', color: 'var(--text-color)' }}>
                        Are you sure you want to delete this goal?<br />
                        <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>This action cannot be undone and will delete all phases.</span>
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <Button onClick={() => setIsDeleteGoalModalOpen(false)} style={{ background: 'var(--card-bg)', color: 'var(--text-color)' }}>Cancel</Button>
                        <Button onClick={handleConfirmDeleteGoal} style={{ background: '#ff4444', color: 'white' }}>Delete Goal</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Phase"
            >
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '20px', color: 'var(--text-color)' }}>Are you sure you want to delete this phase?</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <Button onClick={() => setDeleteModalOpen(false)} style={{ background: 'var(--card-bg)', color: 'var(--text-color)' }}>Cancel</Button>
                        <Button onClick={confirmDeletePhase} style={{ background: '#ff4444', color: 'white' }}>Delete</Button>
                    </div>
                </div>
            </Modal>

            {/* Completion Comment Modal */}
            <Modal
                isOpen={completionModalOpen}
                onClose={() => setCompletionModalOpen(false)}
                title="Complete Phase"
            >
                <div style={{ padding: '10px 0' }}>
                    <p style={{ marginBottom: '15px', color: 'var(--text-color)' }}>
                        Add a note about completing <strong>"{phaseToComplete?.title}"</strong>:
                    </p>
                    <textarea
                        value={completionComment}
                        onChange={(e) => setCompletionComment(e.target.value)}
                        placeholder="What did you accomplish? Any learnings or notes..."
                        className="anime-input"
                        style={{ width: '100%', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        autoFocus
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <Button onClick={() => setCompletionModalOpen(false)} style={{ background: 'var(--card-bg)', color: 'var(--text-color)' }}>Cancel</Button>
                        <Button onClick={confirmCompletion} style={{ background: '#2ecc71', color: 'white' }}>Mark Complete</Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                .goal-details-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    height: 100%;
                    padding: 20px 40px;
                    overflow-y: auto;
                    background: var(--bg-gradient);
                }

                .goal-details-header {
                    padding-bottom: 20px;
                    border-bottom: 1px solid var(--border-color);
                    flex-shrink: 0;
                }

                .header-top {
                    display: flex;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }

                .goal-meta-row {
                    display: flex;
                    gap: 15px;
                    font-size: 0.9rem;
                    color: rgba(255,255,255,0.6);
                    margin-top: 8px;
                    align-items: center;
                }

                .goal-category-tag {
                    background: rgba(var(--primary-rgb), 0.2);
                    color: var(--primary-color);
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.8rem;
                }

                .goal-description-box {
                    background: var(--card-bg);
                    padding: 15px;
                    border-radius: 12px;
                    color: var(--text-color);
                    line-height: 1.6;
                    font-size: 1rem;
                    margin-bottom: 20px;
                    border: 1px solid var(--border-color);
                    opacity: 0.8;
                }

                .progress-section {
                    margin-top: 10px;
                }

                .progress-label {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: rgba(255,255,255,0.9);
                }

                .progress-bar-bg {
                    height: 8px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
                    transition: width 0.5s ease;
                    box-shadow: 0 0 10px rgba(var(--primary-rgb), 0.5);
                }

                /* Mini Back Button */
                .back-btn-mini {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.7);
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 15px;
                    flex-shrink: 0;
                }

                .back-btn-mini:hover {
                    background: rgba(255,255,255,0.12);
                    color: #fff;
                    transform: translateX(-2px);
                }

                /* Phase Complete Toggle (smaller minimal design) */
                .phase-complete-toggle {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 14px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    transition: all 0.25s;
                }

                .phase-complete-toggle:hover {
                    background: rgba(46, 204, 113, 0.1);
                    border-color: rgba(46, 204, 113, 0.3);
                }

                .phase-complete-toggle .toggle-circle {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    border: 1.5px solid rgba(255,255,255,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.55rem;
                    color: transparent;
                    transition: all 0.25s;
                }

                .phase-complete-toggle.done .toggle-circle {
                    background: #2ecc71;
                    border-color: #2ecc71;
                    color: white;
                }

                .phase-complete-toggle .toggle-label {
                    font-size: 0.65rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.5);
                    transition: color 0.25s;
                }

                .phase-complete-toggle.done .toggle-label {
                    color: #2ecc71;
                }

                .phase-complete-toggle:hover .toggle-label {
                    color: rgba(255,255,255,0.8);
                }

                .phase-complete-toggle.done:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.1);
                }

                .roadmap-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .roadmap-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .roadmap-header h2 {
                    font-size: 1.5rem;
                    color: var(--text-color);
                    margin: 0;
                    font-weight: 700;
                }

                .add-phase-btn {
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
                    transition: all 0.2s;
                }
                .add-phase-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(var(--primary-rgb), 0.4);
                }

                /* View Toggle */
                .view-toggle-group {
                    display: flex;
                    gap: 4px;
                    background: rgba(255,255,255,0.05);
                    padding: 4px;
                    border-radius: 10px;
                }

                .view-toggle-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 8px;
                    background: transparent;
                    color: rgba(255,255,255,0.6);
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .add-phase-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(var(--primary-rgb), 0.4);
                }

                /* Grid Drag Handle */















                /* Phase Context Menu */
                .phase-context-menu {
                    position: fixed;
                    background: var(--card-elevated);
                    backdrop-filter: blur(16px);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 6px;
                    min-width: 180px;
                    z-index: 10000;
                    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
                }

                .phase-context-menu button {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 10px 14px;
                    border: none;
                    border-radius: 8px;
                    background: transparent;
                    color: var(--text-color);
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                    text-align: left;
                }

                .phase-context-menu button:hover {
                    background: rgba(255,255,255,0.08);
                }

                .phase-context-menu button.danger {
                    color: #ff6b6b;
                }

                .phase-context-menu button.danger:hover {
                    background: rgba(255, 77, 77, 0.15);
                }

                .phase-context-menu .context-divider {
                    height: 1px;
                    background: rgba(255,255,255,0.08);
                    margin: 4px 8px;
                }



                /* Grid Drag Handle */
                .drag-handle-grid {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    background: rgba(255,255,255,0.05);
                    color: var(--text-color);
                    cursor: grab;
                    font-size: 0.7rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    letter-spacing: 2px;
                    flex-shrink: 0;
                    margin-right: 12px;
                }

                .drag-handle-grid:hover {
                    background: var(--nav-hover-bg);
                    color: var(--text-color);
                }

                .drag-handle-grid:active {
                    cursor: grabbing;
                }

                .grid-phase-label {
                    flex: 1;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-color);
                    opacity: 0.6;
                    font-weight: 600;
                }

                /* Grid View Styles */
                .phases-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    padding-bottom: 40px;
                }

                .phase-grid-card {
                    background: var(--card-bg);
                    border-radius: 12px;
                    padding: 18px;
                    border: 1px solid var(--border-color);
                    cursor: pointer;
                    transition: all 0.25s;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .phase-grid-card:hover {
                    background: var(--card-elevated);
                    border-color: rgba(var(--primary-rgb), 0.3);
                    transform: translateY(-3px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                }

                .phase-grid-card.completed {
                    border-left: 3px solid #2ecc71;
                }

                .phase-grid-card.overdue {
                    border-left: 3px solid #ff4d4d;
                }

                .grid-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .grid-phase-num {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: rgba(var(--primary-rgb), 0.2);
                    color: var(--primary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    font-weight: 700;
                }

                .grid-phase-num.done {
                    background: #2ecc71;
                    color: white;
                }

                .grid-status {
                    font-size: 0.65rem;
                    padding: 3px 8px;
                    border-radius: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .grid-status.completed { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
                .grid-status.overdue { background: rgba(255, 77, 77, 0.2); color: #ff4d4d; }
                .grid-status.pending { background: var(--nav-hover-bg); color: var(--text-color); opacity: 0.7; }

                .grid-phase-title {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--text-color);
                    margin: 0;
                    line-height: 1.3;
                }

                .grid-phase-desc {
                    font-size: 0.8rem;
                    color: var(--text-color);
                    opacity: 0.6;
                    margin: 0;
                    flex: 1;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .grid-card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 10px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    margin-top: auto;
                }

                .grid-complete-btn {
                    padding: 5px 12px;
                    border-radius: 6px;
                    border: none;
                    background: #2ecc71;
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .grid-complete-btn:hover {
                    background: #27ae60;
                }

                .phase-grid-card.completed .grid-complete-btn {
                    background: var(--nav-hover-bg);
                    color: var(--text-color);
                    opacity: 0.7;
                    border: 1px solid var(--border-color);
                }

                .grid-delete-btn {
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    border: none;
                    background: transparent;
                    color: var(--text-color);
                    opacity: 0.4;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .grid-delete-btn:hover {
                    background: rgba(255, 77, 77, 0.2);
                    color: #ff4d4d;
                }

                /* New Timeline Layout */
                .phases-timeline {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    padding-bottom: 40px;
                }

                .phase-card {
                    display: flex;
                    gap: 20px;
                    padding: 0 0 20px 0;
                    position: relative;
                }

                .phase-timeline {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 50px;
                    flex-shrink: 0;
                }

                .phase-dot {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: rgba(var(--primary-rgb), 0.2);
                    border: 3px solid var(--primary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.85rem;
                    color: var(--primary-color);
                    flex-shrink: 0;
                    z-index: 2;
                    transition: all 0.3s;
                }

                .phase-dot.completed {
                    background: #2ecc71;
                    border-color: #2ecc71;
                    color: white;
                }

                .phase-line {
                    width: 3px;
                    flex: 1;
                    background: var(--border-color);
                    min-height: 20px;
                }

                .phase-main {
                    flex: 1;
                    background: var(--card-bg);
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    padding: 20px;
                    transition: all 0.25s ease;
                }

                .phase-card:hover .phase-main {
                    border-color: rgba(var(--primary-rgb), 0.3);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }

                .phase-card.completed .phase-main {
                    opacity: 0.8;
                    border-left: 3px solid #2ecc71;
                }

                .phase-card.overdue .phase-main {
                    border-left: 3px solid #ff4d4d;
                }

                .phase-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .phase-badge {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 700;
                    color: var(--text-color);
                    opacity: 0.5;
                }

                .phase-status-badge {
                    font-size: 0.7rem;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .phase-status-badge.completed {
                    background: rgba(46, 204, 113, 0.2);
                    color: #2ecc71;
                }

                .phase-status-badge.pending {
                    background: var(--nav-hover-bg);
                    color: var(--text-color);
                    opacity: 0.7;
                }

                .phase-status-badge.overdue {
                    background: rgba(255, 77, 77, 0.2);
                    color: #ff4d4d;
                }

                .phase-title {
                    font-size: 1.15rem;
                    font-weight: 600;
                    color: var(--text-color);
                    margin: 0 0 8px 0;
                    line-height: 1.4;
                }

                .phase-description {
                    font-size: 0.9rem;
                    color: var(--text-color);
                    opacity: 0.7;
                    line-height: 1.6;
                    margin: 0 0 12px 0;
                }

                .phase-deadline {
                    font-size: 0.8rem;
                    color: var(--text-color);
                    opacity: 0.6;
                    margin-bottom: 15px;
                }

                .phase-deadline.overdue {
                    color: #ff4d4d;
                    font-weight: 600;
                }

                .phase-actions-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid var(--border-color);
                }

                .phase-reorder-btns {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }

                .reorder-btn {
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    border: 1px solid var(--border-color);
                    background: var(--nav-hover-bg);
                    color: var(--text-color);
                    opacity: 0.7;
                    cursor: pointer;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .reorder-btn:hover:not(:disabled) {
                    background: rgba(var(--primary-rgb), 0.2);
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }

                .reorder-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .drag-handle {
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    background: rgba(255,255,255,0.05);
                    color: rgba(255,255,255,0.4);
                    cursor: grab;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    letter-spacing: 1px;
                }

                .drag-handle:hover {
                    background: var(--nav-hover-bg);
                    color: var(--text-color);
                    opacity: 1;
                }

                .drag-handle:active {
                    cursor: grabbing;
                }

                .phase-action-btns {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .action-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: none;
                    background: var(--nav-hover-bg);
                    color: var(--text-color);
                    opacity: 0.7;
                    cursor: pointer;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .action-btn.edit:hover {
                    background: rgba(var(--primary-rgb), 0.2);
                    color: var(--primary-color);
                }

                .action-btn.delete:hover {
                    background: rgba(255, 77, 77, 0.2);
                    color: #ff4d4d;
                }

                .complete-btn {
                    padding: 6px 14px;
                    border-radius: 6px;
                    border: none;
                    background: #2ecc71;
                    color: white;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .complete-btn:hover {
                    background: #27ae60;
                    transform: translateY(-1px);
                }

                .complete-btn.undo {
                    background: rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.7);
                }

                .complete-btn.undo:hover {
                    background: rgba(255,255,255,0.15);
                }

                .completion-comment {
                    background: rgba(46, 204, 113, 0.1);
                    border-left: 3px solid #2ecc71;
                    padding: 12px 15px;
                    border-radius: 0 8px 8px 0;
                    margin: 12px 0;
                }

                .completion-comment .comment-label {
                    font-size: 0.75rem;
                    color: #2ecc71;
                    font-weight: 600;
                    display: block;
                    margin-bottom: 6px;
                }

                .completion-comment p {
                    margin: 0;
                    font-size: 0.9rem;
                    color: rgba(255,255,255,0.8);
                    line-height: 1.5;
                }

                .phase-dates {
                    display: flex;
                    gap: 15px;
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.5);
                    margin-bottom: 12px;
                }

                .phase-dates span {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .edit-goal-btn {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .empty-state {
                    text-align: center;
                    padding: 60px;
                    color: rgba(255,255,255,0.3);
                    font-size: 1.1rem;
                    font-style: italic;
                }
            `}</style>
        </div >
    );
};

export default GoalDetails;

