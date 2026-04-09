import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

const useKeyboardShortcuts = (actions = {}) => {
    const { settings } = useSettings();

    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ignore if in input/textarea/editable
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable) {
                return;
            }

            if (!settings.shortcuts) return;

            Object.entries(settings.shortcuts).forEach(([actionName, shortcut]) => {
                const match =
                    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
                    !!event.ctrlKey === !!shortcut.ctrl &&
                    !!event.altKey === !!shortcut.alt &&
                    !!event.shiftKey === !!shortcut.shift &&
                    !!event.metaKey === !!shortcut.meta;

                if (match && actions[actionName]) {
                    event.preventDefault(); // Prevent default browser behavior
                    actions[actionName]();
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [settings.shortcuts, actions]);
};

export default useKeyboardShortcuts;
