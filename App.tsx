/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateDecadeImage } from './services/geminiService';
import PolaroidCard from './components/PolaroidCard';
import { createAlbumPage } from './lib/albumUtils';
import { dataURLtoFile } from './lib/utils';
import Footer from './components/Footer';
import ConfigModal, { GenerationConfig } from './components/ConfigModal';
import ReactiveGrid from "@/components/ReactiveGrid";


const DECADES = ['1920s', '1930s', '1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s'];

// Pre-defined positions for a scattered look on desktop
const POSITIONS = [
    { top: '2%', left: '2%', rotate: -8 },
    { top: '5%', left: '25%', rotate: 5 },
    { top: '3%', left: '50%', rotate: 10 },
    { top: '6%', left: '75%', rotate: -5 },
    { top: '35%', left: '8%', rotate: 12 },
    { top: '40%', left: '35%', rotate: -3 },
    { top: '38%', left: '65%', rotate: 8 },
    { top: '50%', left: '85%', rotate: -11 },
    { top: '65%', left: '20%', rotate: -10 },
    { top: '68%', left: '50%', rotate: 4 },
    { top: '15%', left: '15%', rotate: 7 },
    { top: '60%', left: '70%', rotate: -15 },
];

const GHOST_POLAROIDS_CONFIG = [
  { initial: { x: "-150%", y: "-100%", rotate: -30 }, transition: { delay: 0.2 } },
  { initial: { x: "150%", y: "-80%", rotate: 25 }, transition: { delay: 0.4 } },
  { initial: { x: "-120%", y: "120%", rotate: 45 }, transition: { delay: 0.6 } },
  { initial: { x: "180%", y: "90%", rotate: -20 }, transition: { delay: 0.8 } },
  { initial: { x: "0%", y: "-200%", rotate: 0 }, transition: { delay: 0.5 } },
  { initial: { x: "100%", y: "150%", rotate: 10 }, transition: { delay: 0.3 } },
];


type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

const primaryButtonClasses = "font-sans text-lg font-medium tracking-wide text-center text-stone-900 bg-amber-300 py-3 px-8 rounded-md transition-all duration-300 hover:bg-amber-200 hover:shadow-lg hover:shadow-amber-400/20 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-stone-950";
const secondaryButtonClasses = "font-sans text-lg font-medium tracking-wide text-center text-amber-200 bg-transparent border border-amber-200/50 py-3 px-8 rounded-md transition-colors duration-300 hover:bg-amber-200 hover:text-stone-900";


const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

function App() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [appState, setAppState] = useState<'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('idle');
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [activeDecades, setActiveDecades] = useState<string[]>([]);
    const [generationStyle, setGenerationStyle] = useState<'Photograph' | 'Painting'>('Photograph');
    const dragAreaRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setAppState('image-uploaded');
                setGeneratedImages({}); // Clear previous results
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateClick = async (config: GenerationConfig) => {
        if (!uploadedImage) return;

        setIsConfigModalOpen(false);
        setIsLoading(true);
        setAppState('generating');
        setActiveDecades(config.decades);
        setGenerationStyle(config.style);
        
        const initialImages: Record<string, GeneratedImage> = {};
        config.decades.forEach(decade => {
            initialImages[decade] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        const concurrencyLimit = 2; // Process two decades at a time
        const decadesQueue = [...config.decades];

        const processDecade = async (decade: string) => {
            try {
                let prompt;
                if (config.style === 'Painting') {
                     prompt = `Reimagine the person in this photo as a painting in the style of the ${decade}. This includes artistic movements, color palettes, and brushwork common in that era. The output must be a painting showing the person clearly.`;
                } else {
                     prompt = `Reimagine the person in this photo in the style of the ${decade}. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that decade. The output must be a photorealistic image showing the person clearly.`;
                }
                
                const resultUrl = await generateDecadeImage(uploadedImage, prompt);
                setGeneratedImages(prev => ({
                    ...prev,
                    [decade]: { status: 'done', url: resultUrl },
                }));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setGeneratedImages(prev => ({
                    ...prev,
                    [decade]: { status: 'error', error: errorMessage },
                }));
                console.error(`Failed to generate image for ${decade}:`, err);
            }
        };

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            while (decadesQueue.length > 0) {
                const decade = decadesQueue.shift();
                if (decade) {
                    await processDecade(decade);
                }
            }
        });

        await Promise.all(workers);

        setIsLoading(false);
        setAppState('results-shown');
    };

    const handleRegenerateDecade = async (decade: string) => {
        if (!uploadedImage) return;

        if (generatedImages[decade]?.status === 'pending') return;
        
        setGeneratedImages(prev => ({ ...prev, [decade]: { status: 'pending' } }));

        try {
            let prompt;
            if (generationStyle === 'Painting') {
                prompt = `Reimagine the person in this photo as a painting in the style of the ${decade}. This includes artistic movements, color palettes, and brushwork common in that era. The output must be a painting showing the person clearly.`;
            } else {
                prompt = `Reimagine the person in this photo in the style of the ${decade}. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that decade. The output must be a photorealistic image showing the person clearly.`;
            }

            const resultUrl = await generateDecadeImage(uploadedImage, prompt);
            setGeneratedImages(prev => ({
                ...prev,
                [decade]: { status: 'done', url: resultUrl },
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => ({
                ...prev,
                [decade]: { status: 'error', error: errorMessage },
            }));
            console.error(`Failed to regenerate image for ${decade}:`, err);
        }
    };
    
    const handleReset = () => {
        setUploadedImage(null);
        setGeneratedImages({});
        setAppState('idle');
        setActiveDecades([]);
    };

    const handleShareIndividualImage = async (decade: string) => {
        const image = generatedImages[decade];
        if (image?.status !== 'done' || !image.url) return;
    
        if (!navigator.share) {
            alert('Web Share API is not supported in your browser.');
            return;
        }
    
        try {
            const file = dataURLtoFile(image.url, `re-you-${decade}.jpg`);
            if (file && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Re:You - My ${decade} Look`,
                    text: `Check out my ${decade} look generated by Re:You.`,
                    files: [file],
                });
            } else {
               await navigator.share({
                    title: 'Re:You',
                    text: 'Generate your own alternate pasts with Re:You!',
                    url: window.location.href,
               });
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };
    
    const handleShareAlbum = async () => {
        if (!navigator.share) {
            alert('Web Share API is not supported in your browser.');
            return;
        }

        setIsDownloading(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]) => image.status === 'done' && image.url)
                .reduce((acc, [decade, image]) => {
                    acc[decade] = image!.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length === 0) {
                alert("No images to share.");
                return;
            }
            const albumDataUrl = await createAlbumPage(imageData);
            const file = dataURLtoFile(albumDataUrl, `re-you-album.jpg`);

            if (file && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My Re:You Album',
                    text: 'Check out my album of alternate pasts, generated with 💫 Re:You!',
                    files: [file]
                });
            } else {
                alert("Your browser doesn't support sharing files directly.");
            }
        } catch (error) {
            console.error("Failed to create or share album:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadIndividualImage = (decade: string) => {
        const image = generatedImages[decade];
        if (image?.status === 'done' && image.url) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `re-you-${decade}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDownloadAlbum = async () => {
        setIsDownloading(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]) => image.status === 'done' && image.url)
                .reduce((acc, [decade, image]) => {
                    acc[decade] = image!.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length === 0) {
                alert("No images have been generated yet.");
                return;
            }

            const albumDataUrl = await createAlbumPage(imageData);

            const link = document.createElement('a');
            link.href = albumDataUrl;
            link.download = 're-you-album.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to create or download album:", error);
            alert("Sorry, there was an error creating your album. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <main className="bg-stone-950 text-stone-200 min-h-screen w-full flex flex-col items-center justify-center p-4 pb-24 overflow-hidden relative isolate">
           <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="absolute inset-0 -z-10"
           >
            <ReactiveGrid
             gridSize={35}
             radius={140}
             dotSize={1.3}
             color="rgba(55, 55, 55, 1)" // soft subtle glow
             speed={0.05}
             breatheSpeed={8}
             breatheAmount={0.1}
            />
           </motion.div>
            <div className="absolute inset-0 flex items-center justify-center -z-20 pointer-events-none">
                <span className="text-[40rem] text-stone-800 opacity-10 leading-none select-none">💫</span>
            </div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-950/20 via-stone-950 to-stone-950" />
            
            <div className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
                <div className="text-center mb-10">
                    <h1 className="text-6xl md:text-8xl font-bold text-stone-100 font-title tracking-widest">
                        RE:YOU
                    </h1>
                    <p className="font-sans text-stone-400 mt-4 text-xl tracking-wide">Time, rendered in pixels.</p>
                </div>

                {appState === 'idle' && (
                     <div className="relative flex flex-col items-center justify-center w-full">
                        {GHOST_POLAROIDS_CONFIG.map((config, index) => (
                             <motion.div key={index} className="absolute w-80 h-[26rem] rounded-md p-4 bg-white/5 blur-sm" initial={config.initial} animate={{ x: "0%", y: "0%", rotate: (Math.random() - 0.5) * 20, scale: 0, opacity: 0 }} transition={{ ...config.transition, ease: "circOut", duration: 2 }} />
                        ))}
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2, duration: 0.8, type: 'spring' }} className="flex flex-col items-center">
                            <label htmlFor="file-upload" className="cursor-pointer group transform hover:scale-105 transition-transform duration-300">
                                 <PolaroidCard caption="Click to begin" status="done" />
                            </label>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                            <p className="mt-8 font-sans tracking-wider text-stone-500 text-center max-w-xs text-lg">
                                Upload a photo to begin your journey.
                            </p>
                        </motion.div>
                    </div>
                )}

                {appState === 'image-uploaded' && uploadedImage && (
                    <>
                    <div className="flex flex-col items-center gap-6">
                         <PolaroidCard imageUrl={uploadedImage} caption="Your Photo" status="done" />
                         <div className="flex items-center gap-4 mt-4">
                            <button onClick={handleReset} className={secondaryButtonClasses}> Back </button>
                            <button onClick={() => setIsConfigModalOpen(true)} className={primaryButtonClasses}> Customize & Generate </button>
                         </div>
                    </div>
                    <ConfigModal 
                        isOpen={isConfigModalOpen}
                        onClose={() => setIsConfigModalOpen(false)}
                        onGenerate={handleGenerateClick}
                        decades={DECADES}
                    />
                    </>
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                     <>
                        {isMobile ? (
                            <div className="w-full max-w-sm flex-1 overflow-y-auto mt-4 space-y-8 p-4">
                                {activeDecades.map((decade) => (
                                    <div key={decade} className="flex justify-center">
                                         <PolaroidCard
                                            caption={decade}
                                            status={generatedImages[decade]?.status || 'pending'}
                                            imageUrl={generatedImages[decade]?.url}
                                            error={generatedImages[decade]?.error}
                                            onShake={handleRegenerateDecade}
                                            onDownload={handleDownloadIndividualImage}
                                            onShare={handleShareIndividualImage}
                                            isMobile={isMobile}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div ref={dragAreaRef} className="relative w-full max-w-6xl h-[700px] mt-4">
                                {activeDecades.map((decade, index) => {
                                    const position = POSITIONS[index % POSITIONS.length];
                                    let top = position.top;
                                    let left = position.left;
                                    // Add some jitter for more than 12 cards to prevent perfect stacking
                                    if (index >= POSITIONS.length) {
                                        const xJitter = (Math.random() - 0.5) * 10;
                                        const yJitter = (Math.random() - 0.5) * 10;
                                        top = `calc(${position.top} + ${yJitter}%)`;
                                        left = `calc(${position.left} + ${xJitter}%)`;
                                    }

                                    return (
                                        <motion.div
                                            key={decade}
                                            className="absolute cursor-grab active:cursor-grabbing"
                                            style={{ top, left }}
                                            initial={{ opacity: 0, scale: 0.5, y: 100, rotate: 0 }}
                                            animate={{ opacity: 1, scale: 1, y: 0, rotate: `${position.rotate}deg` }}
                                            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.1 }}
                                        >
                                            <PolaroidCard 
                                                dragConstraintsRef={dragAreaRef}
                                                caption={decade}
                                                status={generatedImages[decade]?.status || 'pending'}
                                                imageUrl={generatedImages[decade]?.url}
                                                error={generatedImages[decade]?.error}
                                                onShake={handleRegenerateDecade}
                                                onDownload={handleDownloadIndividualImage}
                                                onShare={handleShareIndividualImage}
                                                isMobile={isMobile}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                         <div className="h-20 mt-4 flex items-center justify-center">
                            {appState === 'results-shown' && (
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <button onClick={handleShareAlbum} className={secondaryButtonClasses}> Share Album </button>
                                    <button onClick={handleDownloadAlbum} disabled={isDownloading} className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`} >
                                        {isDownloading ? 'Creating...' : 'Download Album'}
                                    </button>
                                    <button onClick={handleReset} className={secondaryButtonClasses}> Start Over </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </main>
    );
}

export default App;