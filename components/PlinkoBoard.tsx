'use client';

import { useEffect, useRef, useState } from 'react';
import { PAYOUT_MULTIPLIERS, ROWS } from '@/lib/engine';

interface PlinkoBoardProps {
  path: ('L' | 'R')[];
  isDropping: boolean;
  dropColumn: number;
  onDropComplete: () => void;
  muted: boolean;
}

export default function PlinkoBoard({ path, isDropping, dropColumn, onDropComplete, muted }: PlinkoBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize Web Audio API context
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    tickAudioRef.current = new Audio('/sounds/tick.mp3');
    winAudioRef.current = new Audio('/sounds/win.mp3');
    // Preload sounds
    tickAudioRef.current.load();
    winAudioRef.current.load();
  }, []);

  const playTick = () => {
    if (!muted && tickAudioRef.current) {
      tickAudioRef.current.currentTime = 0;
      tickAudioRef.current.play().catch(() => {});
    }
  };

  const playWin = () => {
    if (!muted && winAudioRef.current) {
      winAudioRef.current.currentTime = 0;
      winAudioRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.width * 0.75, // maintain 4:3 aspect ratio
        });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // Constants mapping to canvas size
    const width = dimensions.width;
    const height = dimensions.height;
    
    // Scaling and positioning
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const PADDING = width * 0.05;
    const TOTAL_ROWS = ROWS; // 12
    const MAX_PEGS = TOTAL_ROWS + 1; // 13 in the last row
    
    const VERTICAL_SPACING = (height - 2 * PADDING - 60) / TOTAL_ROWS;
    const HORIZONTAL_SPACING = (width - 2 * PADDING) / MAX_PEGS;
    
    const START_Y = PADDING + 40;

    let ballY = 0;
    let ballX = 0;
    let targetRow = 0;
    let ballPathIndex = 0;
    let currentXPositionIndex = dropColumn;
    let isAnimating = false;
    let ballRadius = Math.min(VERTICAL_SPACING, HORIZONTAL_SPACING) * 0.35;
    let pegRadius = ballRadius * 0.45;
    
    // Smooth animation vars
    let animProgress = 0;
    let startAnimaX = 0;
    let startAnimaY = 0;
    let targetAnimaX = 0;
    let targetAnimaY = 0;

    const renderBoard = () => {
      // Background gradient (Deep Jungle Moss)
      const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
      bgGradient.addColorStop(0, '#103010'); // Dark forest green
      bgGradient.addColorStop(1, '#081708'); // Almost black green
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle "vines/ripples"
      ctx.strokeStyle = 'rgba(164, 219, 140, 0.05)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(width/2, height/2, (Date.now() / 50 + i * 100) % (width/2), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw bins (golden cups)
      for (let i = 0; i < PAYOUT_MULTIPLIERS.length; i++) {
        const x = PADDING + i * HORIZONTAL_SPACING;
        const y = height - PADDING + 20;
        const w = HORIZONTAL_SPACING - 4;
        const h = 40;
        
        // Gradient for golden cup
        const cupGradient = ctx.createLinearGradient(x, y-h, x, y);
        cupGradient.addColorStop(0, '#ffd700');
        cupGradient.addColorStop(1, '#daa520');
        
        ctx.fillStyle = cupGradient;
        ctx.beginPath();
        ctx.roundRect(x, y - h, w, h, 8);
        ctx.fill();

        // Inner bin shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect(x + 4, y - h + 4, w - 8, h - 8, 4);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px var(--font-display)';
        ctx.textAlign = 'center';
        ctx.fillText(`${PAYOUT_MULTIPLIERS[i]}x`, x + w / 2, y - 15);
      }

      // Draw Pegs (Brass/Golden)
      for (let r = 1; r <= TOTAL_ROWS; r++) {
        for (let c = 0; c < 13; c++) {
           const shift = (r % 2 === 0) ? 0 : HORIZONTAL_SPACING / 2;
           if (c === 12 && r % 2 !== 0) continue; 
           
           const x = PADDING + HORIZONTAL_SPACING / 2 + c * HORIZONTAL_SPACING + shift;
           const y = START_Y + r * VERTICAL_SPACING;
           
           // Brass peg with shadow
           const pegGrad = ctx.createRadialGradient(x - 1, y - 1, 0, x, y, pegRadius);
           pegGrad.addColorStop(0, '#ffe066');
           pegGrad.addColorStop(1, '#b8860b');
           
           ctx.fillStyle = pegGrad;
           ctx.shadowBlur = 4;
           ctx.shadowColor = 'rgba(0,0,0,0.5)';
           ctx.beginPath();
           ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
           ctx.fill();
           ctx.shadowBlur = 0;
        }
      }
    };

    const drawBall = (x: number, y: number) => {
      // Sphere shading
      const ballGrad = ctx.createRadialGradient(x - ballRadius*0.3, y - ballRadius*0.3, ballRadius*0.1, x, y, ballRadius);
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.2, '#00e6e6');
      ballGrad.addColorStop(1, '#006666');
      
      ctx.fillStyle = ballGrad;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0, 204, 204, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const runAnimation = () => {
      renderBoard();

      if (isAnimating && ballPathIndex <= path.length) {
        animProgress += 0.03;
        
        if (animProgress >= 1) {
            animProgress = 1;
            
            playTick();
            ballX = targetAnimaX;
            ballY = targetAnimaY;
            
            if (ballPathIndex < path.length) {
                const dir = path[ballPathIndex];
                ballPathIndex++;
                targetRow++;
                
                startAnimaX = ballX;
                startAnimaY = ballY;
                
                if (dir === 'R') {
                    currentXPositionIndex++;
                }
                
                targetAnimaX = PADDING + HORIZONTAL_SPACING / 2 + currentXPositionIndex * HORIZONTAL_SPACING;
                targetAnimaY = START_Y + targetRow * VERTICAL_SPACING;
                animProgress = 0;
            } else {
                isAnimating = false;
                playWin();
                onDropComplete();
            }
        }
        
        const x = startAnimaX + (targetAnimaX - startAnimaX) * animProgress;
        const p = animProgress;
        const arc = Math.sin(p * Math.PI) * 15; 
        const y = startAnimaY + (targetAnimaY - startAnimaY) * p - arc;

        drawBall(x, y);
      } else if (isDropping && !isAnimating) {
          isAnimating = true;
          ballPathIndex = 0;
          targetRow = 0;
          currentXPositionIndex = dropColumn;
          
          startAnimaX = PADDING + HORIZONTAL_SPACING / 2 + currentXPositionIndex * HORIZONTAL_SPACING;
          startAnimaY = START_Y - VERTICAL_SPACING;
          
          targetAnimaX = startAnimaX;
          targetAnimaY = START_Y; 
          
          animProgress = 0;
          drawBall(startAnimaX, startAnimaY);
      }

      animationFrameId = requestAnimationFrame(runAnimation);
    };

    renderBoard();
    if (isDropping) {
        runAnimation();
    } else {
        const initX = PADDING + HORIZONTAL_SPACING / 2 + dropColumn * HORIZONTAL_SPACING;
        drawBall(initX, START_Y - VERTICAL_SPACING);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions, isDropping, path, dropColumn, onDropComplete, muted]);

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto stone-frame rounded-[32px] overflow-hidden p-6">
      <canvas ref={canvasRef} className="w-full block rounded-2xl" />
    </div>
  );
}
