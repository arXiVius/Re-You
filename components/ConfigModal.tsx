/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface GenerationConfig {
  decades: string[];
  style: 'Photograph' | 'Painting';
}

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: GenerationConfig) => void;
  decades: string[];
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onGenerate, decades }) => {
    const [selectedDecades, setSelectedDecades] = useState<string[]>(decades);
    const [customDecades, setCustomDecades] = useState<string[]>([]);
    const [customDecadeInput, setCustomDecadeInput] = useState('');
    const [style, setStyle] = useState<'Photograph' | 'Painting'>('Photograph');
    const [isCustomInputVisible, setIsCustomInputVisible] = useState(false);
    const [titleClickCount, setTitleClickCount] = useState(0);

    useEffect(() => {
        if (titleClickCount >= 5) {
            setIsCustomInputVisible(true);
        }
    }, [titleClickCount]);
    
    const handleTitleClick = () => {
        setTitleClickCount(prev => prev + 1);
    };

    const handleDecadeToggle = (decade: string) => {
        setSelectedDecades(prev =>
            prev.includes(decade) ? prev.filter(d => d !== decade) : [...prev, decade]
        );
    };

    const handleAddCustomDecade = () => {
        if (customDecadeInput.trim() && !customDecades.includes(customDecadeInput.trim())) {
            setCustomDecades(prev => [...prev, customDecadeInput.trim()]);
            setCustomDecadeInput('');
        }
    };

    const handleCustomDecadeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustomDecade();
        }
    };
    
    const handleRemoveCustomDecade = (decadeToRemove: string) => {
        setCustomDecades(prev => prev.filter(d => d !== decadeToRemove));
    };

    const handleSelectAll = () => setSelectedDecades(decades);
    const handleDeselectAll = () => setSelectedDecades([]);

    const handleGenerateClick = () => {
        const allDecades = [...selectedDecades, ...customDecades];
        if (allDecades.length === 0) {
            alert('Please select at least one decade.');
            return;
        }
        onGenerate({ decades: allDecades, style });
    };

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="bg-stone-900 border border-stone-700 p-8 w-full max-w-2xl text-white rounded-lg shadow-2xl shadow-black/50 max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-4xl font-serif font-bold text-stone-100 mb-6 cursor-pointer select-none" onClick={handleTitleClick}>Customize Your Journey</h2>

                        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                            {/* DECADE SELECTION */}
                            <div className='mb-6'>
                                <h3 className="text-xl font-sans font-bold tracking-wide text-amber-300 mb-3">Decades</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                                    {decades.map(decade => (
                                        <label key={decade} className="flex items-center space-x-3 cursor-pointer font-sans text-stone-300 hover:text-white transition-colors">
                                            <input type="checkbox" checked={selectedDecades.includes(decade)} onChange={() => handleDecadeToggle(decade)}
                                                   className="form-checkbox h-5 w-5 bg-stone-800 border-stone-600 text-amber-400 focus:ring-amber-400 focus:ring-offset-stone-900 rounded-sm transition"
                                            />
                                            <span>{decade}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={handleSelectAll} className="font-sans text-sm tracking-wide text-stone-400 hover:text-white transition-colors">Select All</button>
                                    <button onClick={handleDeselectAll} className="font-sans text-sm tracking-wide text-stone-400 hover:text-white transition-colors">Deselect All</button>
                                </div>
                            </div>
                            
                            {/* EASTER EGG: CUSTOM ERA & STYLE */}
                             {isCustomInputVisible && (
                                <>
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 overflow-hidden">
                                        <h3 className="text-xl font-sans font-bold tracking-wide text-amber-300 mb-3">Custom Era</h3>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={customDecadeInput}
                                                onChange={(e) => setCustomDecadeInput(e.target.value)}
                                                onKeyDown={handleCustomDecadeKeyDown}
                                                placeholder="e.g., 1988, 2077, Victorian Era"
                                                className="flex-grow bg-stone-800 border border-stone-700 text-white px-3 py-2 focus:border-amber-400 focus:outline-none rounded-md transition"
                                            />
                                            <button onClick={handleAddCustomDecade} className="font-sans font-semibold uppercase text-stone-800 bg-stone-300 hover:bg-white px-4 py-2 rounded-md transition-colors">Add</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {customDecades.map(d => (
                                                <div key={d} className="bg-stone-700 text-sm px-3 py-1 flex items-center gap-2 rounded-md">
                                                    <span>{d}</span>
                                                    <button onClick={() => handleRemoveCustomDecade(d)} className="text-stone-400 hover:text-white">&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto', transition: { delay: 0.1 } }} className="mb-6 overflow-hidden">
                                        <h3 className="text-xl font-sans font-bold tracking-wide text-amber-300 mb-3">Style</h3>
                                        <div className="flex gap-6">
                                            <label className="flex items-center space-x-3 cursor-pointer font-sans text-stone-300 hover:text-white transition-colors">
                                                <input type="radio" name="style" value="Photograph" checked={style === 'Photograph'} onChange={() => setStyle('Photograph')}
                                                    className="form-radio h-5 w-5 bg-stone-800 border-stone-600 text-amber-400 focus:ring-amber-400 focus:ring-offset-stone-900"
                                                />
                                                <span>Photograph</span>
                                            </label>
                                            <label className="flex items-center space-x-3 cursor-pointer font-sans text-stone-300 hover:text-white transition-colors">
                                                <input type="radio" name="style" value="Painting" checked={style === 'Painting'} onChange={() => setStyle('Painting')}
                                                    className="form-radio h-5 w-5 bg-stone-800 border-stone-600 text-amber-400 focus:ring-amber-400 focus:ring-offset-stone-900"
                                                />
                                                <span>Painting</span>
                                            </label>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-stone-700">
                             <button onClick={onClose} className="font-sans text-lg font-medium tracking-wide text-center text-amber-200 bg-transparent border border-amber-200/50 py-3 px-8 rounded-md transition-colors duration-300 hover:bg-amber-200 hover:text-stone-900">Cancel</button>
                             <button onClick={handleGenerateClick} className="font-sans text-lg font-medium tracking-wide text-center text-stone-900 bg-amber-300 py-3 px-8 rounded-md transition-all duration-300 hover:bg-amber-200 hover:shadow-lg hover:shadow-amber-400/20 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-stone-950">Generate</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfigModal;