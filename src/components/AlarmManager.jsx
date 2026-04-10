import React, { useEffect, useRef } from 'react';
import { alarmService } from '../services/alarmService';

const AlarmManager = () => {
    const audioContextRef = useRef(null);

    useEffect(() => {
        // Register alarm callback using the browser-based alarm service
        alarmService.onAlarmTriggered((alarm) => {
            console.log('Alarm triggered:', alarm);
            playAlarmSound();
            // Show browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`ALARM: ${alarm.label || 'Time is up!'}`, {
                    body: `It's ${alarm.time}`,
                    tag: 'shuuchuu-alarm',
                    renotify: true
                });
            }
            alert(`ALARM: ${alarm.label || 'Time is up!'}`);
        });

        // Start the alarm checking interval
        alarmService.startChecking();

        return () => {
            alarmService.stopChecking();
        };
    }, []);

    const playAlarmSound = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        const ctx = audioContextRef.current;
        const startTime = ctx.currentTime;
        const duration = 10; // 10 seconds

        // Create a rhythmic beep pattern
        for (let i = 0; i < duration; i++) {
            // Beep 1
            createBeep(ctx, startTime + i, 880, 0.1);
            // Beep 2
            createBeep(ctx, startTime + i + 0.15, 880, 0.1);
            // Beep 3
            createBeep(ctx, startTime + i + 0.3, 880, 0.1);
        }
    };

    const createBeep = (ctx, time, freq, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'square';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.start(time);
        osc.stop(time + duration);
    };

    return null; // Invisible component
};

export default AlarmManager;
