import React, { useRef, useEffect } from 'react';

export type EffectType = 'none' | 'snow' | 'rain' | 'sparkle';

export function EffectsOverlay({ effect }: { effect: EffectType }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (effect === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    let animationFrame: number;
    
    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
        mouse.x = -1000;
        mouse.y = -1000;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    if (effect === 'snow') {
       for (let i = 0; i < 150; i++) {
           particles.push({
               x: Math.random() * canvas.width,
               y: Math.random() * canvas.height,
               r: Math.random() * 3 + 1,
               vx: Math.random() * 1 - 0.5,
               vy: Math.random() * 1 + 1,
               originalVx: Math.random() * 1 - 0.5,
               originalVy: Math.random() * 1 + 1
           });
       }
    } else if (effect === 'rain') {
       for (let i = 0; i < 200; i++) {
           particles.push({
               x: Math.random() * canvas.width,
               y: Math.random() * canvas.height,
               l: Math.random() * 20 + 10,
               vx: Math.random() * 1 - 0.5,
               vy: Math.random() * 15 + 15,
               originalVx: Math.random() * 1 - 0.5
           });
       }
    } else if (effect === 'sparkle') {
       for (let i = 0; i < 100; i++) {
           particles.push({
               x: Math.random() * canvas.width,
               y: Math.random() * canvas.height,
               r: Math.random() * 2.5 + 0.5,
               a: Math.random() * Math.PI * 2,
               da: (Math.random() - 0.5) * 0.08,
               originalX: Math.random() * canvas.width,
               originalY: Math.random() * canvas.height
           });
       }
    }

    const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = effect === 'rain' ? 'rgba(165, 180, 252, 0.6)' : 'rgba(255, 255, 255, 0.8)';
        ctx.strokeStyle = effect === 'rain' ? 'rgba(165, 180, 252, 0.6)' : 'rgba(255, 255, 255, 0.8)';

        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (effect === 'snow') {
                if (distance < 100) {
                    const force = (100 - distance) / 100;
                    p.vx += (dx / distance) * force * 0.5;
                    p.vy -= force * 0.5;
                } else {
                    p.vx += (p.originalVx - p.vx) * 0.05;
                    p.vy += (p.originalVy - p.vy) * 0.05;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                p.x += p.vx;
                p.y += p.vy;
                if (p.y > canvas.height) p.y = -p.r;
                if (p.y < -p.r) p.y = canvas.height;
                if (p.x > canvas.width + p.r) p.x = -p.r;
                if (p.x < -p.r) p.x = canvas.width + p.r;
            } else if (effect === 'rain') {
                if (distance < 150) {
                    const force = (150 - distance) / 150;
                    p.vx += (dx / distance) * force * 2;
                } else {
                    p.vx += (p.originalVx - p.vx) * 0.1;
                }

                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.vx, p.y + p.l);
                ctx.lineWidth = 1.5;
                ctx.stroke();
                p.x += p.vx;
                p.y += p.vy;
                if (p.y > canvas.height) {
                    p.y = -p.l;
                    p.x = Math.random() * canvas.width;
                }
                if (p.x > canvas.width || p.x < 0) {
                    p.x = (p.x + canvas.width) % canvas.width;
                }
            } else if (effect === 'sparkle') {
                let currentR = p.r;
                if (distance < 150) {
                   const force = (150 - distance) / 150;
                   p.x += (dx / distance) * force * 5;
                   p.y += (dy / distance) * force * 5;
                   currentR = p.r * (1 + force * 2);
                } else {
                   p.x += (p.originalX - p.x) * 0.05;
                   p.y += (p.originalY - p.y) * 0.05;
                }
                
                ctx.beginPath();
                ctx.globalAlpha = Math.abs(Math.sin(p.a));
                ctx.arc(p.x, p.y, Math.max(0.1, currentR), 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
                p.a += p.da;
            }
        }
        animationFrame = requestAnimationFrame(render);
    };
    render();

    return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
        cancelAnimationFrame(animationFrame);
    };

  }, [effect]);

  if (effect === 'none') return null;

  return (
    <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-[25] w-full h-full mix-blend-screen"
    />
  );
}
