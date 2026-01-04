/**
 * Snow Effect Module
 * High-performance canvas-based snow animation with natural movement
 * 
 * Features:
 * - requestAnimationFrame for smooth 60fps
 * - DPR capped at 2 for performance
 * - Max 200 flakes
 * - Sinusoidal drift for natural movement
 * - Respects prefers-reduced-motion
 */

import type { SnowConfig } from '../services/api/uiEffects';

interface Snowflake {
    x: number;
    y: number;
    radius: number;
    speed: number;
    wind: number;
    opacity: number;
    sineOffset: number;
    sineSpeed: number;
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let flakes: Snowflake[] = [];
let animationId: number | null = null;
let currentConfig: SnowConfig | null = null;
let lastTime: number = 0;

// Check for reduced motion preference
const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Create canvas element
const createCanvas = (): void => {
    if (canvas) return;

    canvas = document.createElement('canvas');
    canvas.id = 'snow-canvas';
    canvas.style.cssText = `
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9999;
        width: 100%;
        height: 100%;
    `;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
};

// Resize canvas to match viewport
const resizeCanvas = (): void => {
    if (!canvas) return;

    // Cap DPR at 2 for performance
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    if (ctx) {
        ctx.scale(dpr, dpr);
    }
};

// Create initial snowflakes
const createFlakes = (config: SnowConfig): void => {
    flakes = [];

    // Cap at 200 flakes for performance
    const count = Math.min(config.intensity, 200);

    for (let i = 0; i < count; i++) {
        flakes.push(createFlake(config, true));
    }
};

// Create a single snowflake
const createFlake = (config: SnowConfig, randomY: boolean = false): Snowflake => {
    const radius = config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);

    return {
        x: Math.random() * window.innerWidth,
        y: randomY ? Math.random() * window.innerHeight : -10,
        radius,
        speed: config.speed * (0.5 + Math.random() * 0.5), // Vary speed 50-100%
        wind: config.wind + (Math.random() - 0.5) * 0.3, // Slight wind variation
        opacity: config.opacity * (0.6 + Math.random() * 0.4), // Vary opacity
        sineOffset: Math.random() * Math.PI * 2,
        sineSpeed: 0.5 + Math.random() * 1.5
    };
};

// Update flake count based on intensity
const updateFlakeCount = (config: SnowConfig): void => {
    const targetCount = Math.min(config.intensity, 200);

    // Add flakes if needed
    while (flakes.length < targetCount) {
        flakes.push(createFlake(config, true));
    }

    // Remove excess flakes
    while (flakes.length > targetCount) {
        flakes.pop();
    }
};

// Animation loop
const animate = (timestamp: number): void => {
    if (!ctx || !canvas || !currentConfig) return;

    // Calculate delta time for smooth animation
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Skip if too much time passed (tab was inactive)
    if (deltaTime > 100) {
        animationId = requestAnimationFrame(animate);
        return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const speedMultiplier = deltaTime / 16.67; // Normalize to 60fps

    // Update and draw each flake
    flakes.forEach((flake, index) => {
        // Update position
        flake.y += flake.speed * speedMultiplier;

        // Sinusoidal horizontal drift for natural movement
        const sineWave = Math.sin(timestamp * 0.001 * flake.sineSpeed + flake.sineOffset);
        flake.x += (flake.wind + sineWave * 0.5) * speedMultiplier;

        // Wrap around edges
        if (flake.y > window.innerHeight + 10) {
            // Reset to top
            flakes[index] = createFlake(currentConfig!, false);
        }

        if (flake.x > window.innerWidth + 10) {
            flake.x = -10;
        } else if (flake.x < -10) {
            flake.x = window.innerWidth + 10;
        }

        // Draw flake
        ctx!.beginPath();
        ctx!.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
        ctx!.fill();
    });

    animationId = requestAnimationFrame(animate);
};

/**
 * Start snow effect with configuration
 */
export const startSnow = (config: SnowConfig): void => {
    // Don't start if user prefers reduced motion
    if (prefersReducedMotion()) {
        console.log('[Snow] Disabled due to prefers-reduced-motion');
        return;
    }

    // Don't start if already running
    if (animationId !== null) {
        updateSnow(config);
        return;
    }

    console.log('[Snow] Starting with config:', config);

    currentConfig = config;
    createCanvas();
    createFlakes(config);
    lastTime = performance.now();
    animationId = requestAnimationFrame(animate);
};

/**
 * Update snow configuration without recreating canvas
 */
export const updateSnow = (config: SnowConfig): void => {
    console.log('[Snow] Updating config:', config);

    currentConfig = config;

    // Update flake count based on new intensity
    updateFlakeCount(config);

    // Update existing flakes with new parameters
    flakes.forEach(flake => {
        flake.wind = config.wind + (Math.random() - 0.5) * 0.3;
        flake.opacity = config.opacity * (0.6 + Math.random() * 0.4);
    });
};

/**
 * Stop snow effect and cleanup
 */
export const stopSnow = (): void => {
    console.log('[Snow] Stopping');

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if (canvas) {
        window.removeEventListener('resize', resizeCanvas);
        canvas.remove();
        canvas = null;
        ctx = null;
    }

    flakes = [];
    currentConfig = null;
};

/**
 * Check if snow is currently running
 */
export const isSnowRunning = (): boolean => {
    return animationId !== null;
};
