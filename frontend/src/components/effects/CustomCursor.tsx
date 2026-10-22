import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const trail = trailRef.current;
    if (!dot || !trail) return;

    let mouseX = 0, mouseY = 0;
    const trailPaths: { el: SVGPathElement; x: number; y: number }[] = [];

    // Create 20 trail paths
    for (let i = 0; i < 20; i++) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke', `hsla(${i * 3}, 100%, 60%, ${1 - i / 20})`);
      path.setAttribute('stroke-width', String((20 - i) / 2));
      trail.appendChild(path);
      trailPaths.push({ el: path, x: 0, y: 0 });
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dot) {
        dot.style.left = `${mouseX}px`;
        dot.style.top = `${mouseY}px`;
      }
    };

    const animateTrail = () => {
      trailPaths.forEach((p) => {
        p.x += (mouseX - p.x) * 0.15;
        p.y += (mouseY - p.y) * 0.15;
        p.el.setAttribute('d', `M${p.x},${p.y} L${mouseX},${mouseY}`);
      });
      requestAnimationFrame(animateTrail);
    };

    window.addEventListener('mousemove', onMouseMove);
    animateTrail();

    // Add hover effect on buttons/links
    const handleHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        dot?.classList.add('scale-[2.5]', 'bg-transparent', 'border-2', 'border-[#00E5A0]');
      } else {
        dot?.classList.remove('scale-[2.5]', 'bg-transparent', 'border-2', 'border-[#00E5A0]');
      }
    };
    window.addEventListener('mouseover', handleHover);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', handleHover);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[10000] mix-blend-screen">
      <div
        ref={dotRef}
        className="absolute w-3 h-3 bg-[#00E5A0] rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out shadow-[0_0_20px_#00E5A0]"
      />
      <svg ref={trailRef} className="absolute inset-0 w-full h-full opacity-50" />
    </div>
  );
}