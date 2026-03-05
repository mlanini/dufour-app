/**
 * Timeline Controls Component
 * 
 * Compact, collapsible timeline for scenario playback.
 * Supports ORBAT hierarchies with echelon filtering.
 * 
 * @component TimelineControls
 */

import React, { useState, useEffect, useRef } from 'react';
import '../styles/timeline.css';

export default function TimelineControls({
    scenario,
    orbatTree = null,
    visible = true,
    onTimeChange,
    onPlay,
    onPause,
    onStop,
    disabled = false
}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [currentTime, setCurrentTime] = useState(null);
    const [progress, setProgress] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [loop, setLoop] = useState(false);
    const [echelonFilter, setEchelonFilter] = useState({ min: 0, max: 10 });
    
    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);
    const endTimeRef = useRef(null);
    
    // Initialize time range
    useEffect(() => {
        if (scenario) {
            startTimeRef.current = scenario.startTime || new Date();
            endTimeRef.current = scenario.endTime || new Date(Date.now() + 86400000); // +24h
            setCurrentTime(startTimeRef.current);
        } else if (orbatTree && orbatTree.metadata) {
            startTimeRef.current = orbatTree.metadata.startTime || new Date();
            endTimeRef.current = orbatTree.metadata.endTime || new Date(Date.now() + 86400000);
            setCurrentTime(startTimeRef.current);
        }
    }, [scenario, orbatTree]);
    
    // Playback loop
    useEffect(() => {
        if (isPlaying && currentTime && startTimeRef.current && endTimeRef.current) {
            intervalRef.current = setInterval(() => {
                setCurrentTime(prev => {
                    const duration = endTimeRef.current - startTimeRef.current;
                    const step = (duration / 1000) * speed; // 1 second per interval
                    const next = new Date(prev.getTime() + step);
                    
                    if (next >= endTimeRef.current) {
                        if (loop) {
                            return startTimeRef.current;
                        } else {
                            handleStop();
                            return endTimeRef.current;
                        }
                    }
                    
                    return next;
                });
            }, 100); // Update every 100ms
            
            return () => clearInterval(intervalRef.current);
        }
    }, [isPlaying, speed, loop, currentTime]);
    
    // Update progress
    useEffect(() => {
        if (currentTime && startTimeRef.current && endTimeRef.current) {
            const elapsed = currentTime - startTimeRef.current;
            const total = endTimeRef.current - startTimeRef.current;
            const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
            setProgress(pct);
            
            if (onTimeChange) {
                onTimeChange(currentTime);
            }
        }
    }, [currentTime, onTimeChange]);
    
    // Handle play
    const handlePlay = () => {
        if (disabled) return;
        setIsPlaying(true);
        if (onPlay) onPlay();
    };
    
    // Handle pause
    const handlePause = () => {
        setIsPlaying(false);
        if (onPause) onPause();
    };
    
    // Handle stop
    const handleStop = () => {
        setIsPlaying(false);
        setCurrentTime(startTimeRef.current);
        setProgress(0);
        if (onStop) onStop();
    };
    
    // Handle step forward
    const handleStepForward = () => {
        if (disabled) return;
        setCurrentTime(prev => {
            const next = new Date(prev.getTime() + 5 * 60 * 1000); // +5 minutes
            return next > endTimeRef.current ? endTimeRef.current : next;
        });
    };
    
    // Handle step backward
    const handleStepBackward = () => {
        if (disabled) return;
        setCurrentTime(prev => {
            const next = new Date(prev.getTime() - 5 * 60 * 1000); // -5 minutes
            return next < startTimeRef.current ? startTimeRef.current : next;
        });
    };
    
    // Handle seek
    const handleSeek = (e) => {
        if (disabled) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = (x / rect.width) * 100;
        
        const elapsed = (pct / 100) * (endTimeRef.current - startTimeRef.current);
        const newTime = new Date(startTimeRef.current.getTime() + elapsed);
        
        setCurrentTime(newTime);
        setProgress(pct);
    };
    
    // Format duration
    const formatDuration = () => {
        if (!startTimeRef.current || !endTimeRef.current) return '--';
        
        const duration = endTimeRef.current - startTimeRef.current;
        const days = Math.floor(duration / 86400000);
        const hours = Math.floor((duration % 86400000) / 3600000);
        
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h`;
    };
    
    // Format time
    const formatTime = (date) => {
        if (!date) return '--:--';
        return date.toLocaleString('en-GB', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    if (!visible) return null;
    
    const scenarioName = scenario?.name || orbatTree?.name || 'Timeline';
    
    return (
        <div className={`timeline-controls ${disabled ? 'disabled' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Toggle Button */}
            <button
                className={`timeline-toggle-btn ${isCollapsed ? 'collapsed' : ''}`}
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? 'Expand Timeline' : 'Collapse Timeline'}
            >
                {isCollapsed ? '▲' : '▼'}
            </button>
            
            {/* Timeline Info */}
            <div className="timeline-info">
                <div className="timeline-scenario-name">{scenarioName}</div>
                <div className="timeline-duration">Duration: {formatDuration()}</div>
                {orbatTree && (
                    <div className="timeline-orbat-info">
                        {orbatTree.getTotalUnits()} units, {orbatTree.getMaxDepth()} levels
                    </div>
                )}
            </div>
            
            {/* Timeline Bar */}
            <div className="timeline-bar-container">
                <div className="timeline-time-label start">
                    {formatTime(startTimeRef.current)}
                </div>
                <div 
                    className="timeline-bar" 
                    onClick={handleSeek}
                    style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                >
                    <div 
                        className="timeline-progress" 
                        style={{ width: `${progress}%` }}
                    ></div>
                    <div 
                        className="timeline-handle" 
                        style={{ left: `${progress}%` }}
                    ></div>
                </div>
                <div className="timeline-time-label end">
                    {formatTime(endTimeRef.current)}
                </div>
            </div>
            
            {/* Current Time */}
            <div className="timeline-current-time">
                {formatTime(currentTime)}
            </div>
            
            {/* Playback Controls */}
            <div className="timeline-playback-controls">
                <button 
                    className="timeline-btn" 
                    onClick={handleStepBackward}
                    disabled={disabled}
                    title="Step Backward (5 min)"
                >
                    ⏮️
                </button>
                <button 
                    className={`timeline-btn timeline-btn-primary ${isPlaying ? 'playing' : ''}`}
                    onClick={isPlaying ? handlePause : handlePlay}
                    disabled={disabled}
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? '⏸️' : '▶️'}
                </button>
                <button 
                    className="timeline-btn" 
                    onClick={handleStop}
                    disabled={disabled}
                    title="Stop"
                >
                    ⏹️
                </button>
                <button 
                    className="timeline-btn" 
                    onClick={handleStepForward}
                    disabled={disabled}
                    title="Step Forward (5 min)"
                >
                    ⏭️
                </button>
            </div>
            
            {/* Options */}
            <div className="timeline-options">
                <div className="timeline-option">
                    <label htmlFor="timeline-speed">Speed:</label>
                    <select 
                        id="timeline-speed" 
                        value={speed} 
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        disabled={disabled}
                    >
                        <option value="0.25">0.25x</option>
                        <option value="0.5">0.5x</option>
                        <option value="1">1x</option>
                        <option value="2">2x</option>
                        <option value="5">5x</option>
                        <option value="10">10x</option>
                    </select>
                </div>
                
                <div className="timeline-option">
                    <label>
                        <input 
                            type="checkbox" 
                            checked={loop} 
                            onChange={(e) => setLoop(e.target.checked)}
                            disabled={disabled}
                        />
                        Loop
                    </label>
                </div>
                
                {orbatTree && (
                    <div className="timeline-option">
                        <label htmlFor="timeline-echelon">Echelon:</label>
                        <select 
                            id="timeline-echelon"
                            value={`${echelonFilter.min}-${echelonFilter.max}`}
                            onChange={(e) => {
                                const [min, max] = e.target.value.split('-').map(Number);
                                setEchelonFilter({ min, max });
                            }}
                            disabled={disabled}
                        >
                            <option value="0-10">All</option>
                            <option value="0-4">Brigade+</option>
                            <option value="4-10">Brigade-</option>
                            <option value="6-10">Battalion-</option>
                            <option value="7-10">Company-</option>
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}
