/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useCallback } from 'react';

const CHARS = '!<>-_\\/[]{}—=+*^?#________';

interface ShuffleTextProps {
    children: string;
}

const ShuffleText: React.FC<ShuffleTextProps> = ({ children }) => {
    const [currentText, setCurrentText] = useState(children);
    const intervalRef = useRef<number | null>(null);

    const scramble = useCallback(() => {
        let iteration = 0;
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = window.setInterval(() => {
            const newText = children
                .split('')
                .map((_char, index) => {
                    if (index < iteration) {
                        return children[index];
                    }
                    return CHARS[Math.floor(Math.random() * CHARS.length)];
                })
                .join('');
            
            setCurrentText(newText);
            
            if (iteration >= children.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
            }
            iteration += 1 / 2;
        }, 30);
    }, [children]);

    const stopScramble = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        setCurrentText(children);
    }, [children]);
    
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    }, []);

    return (
        <span onMouseEnter={scramble} onMouseLeave={stopScramble} className="font-mono text-base tracking-widest text-neutral-500 cursor-default" aria-label={children}>
            {currentText}
        </span>
    );
};

export default ShuffleText;