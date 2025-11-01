'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './WireGame.module.css';

interface WireGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

const COLORS = ['#ff0000', '#00ff00', '#0000ff']; // Red, Green, Blue

interface Dot {
  id: number;
  x: number;
  y: number;
  color: string;
  side: 'left' | 'right';
}

interface Connection {
  from: number;
  to: number;
  path: string;
}

export default function WireGame({ onComplete, onCancel }: WireGameProps) {
  const [leftDots, setLeftDots] = useState<Dot[]>([]);
  const [rightDots, setRightDots] = useState<Dot[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnection, setActiveConnection] = useState<{ from: number; path: string } | null>(null);
  const [completed, setCompleted] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Initialize dots with random colors
    const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5);
    const left: Dot[] = [];
    const right: Dot[] = [];
    
    for (let i = 0; i < 3; i++) {
      left.push({
        id: i,
        x: 50,
        y: 30 + i * 40,
        color: shuffledColors[i],
        side: 'left'
      });
      right.push({
        id: i + 10, // Use different ID range for right side
        x: 50,
        y: 30 + i * 40,
        color: shuffledColors[i],
        side: 'right'
      });
    }

    // Shuffle right side colors to make it a puzzle
    const rightShuffled = [...right].sort(() => Math.random() - 0.5);
    setLeftDots(left);
    setRightDots(rightShuffled);
  }, []);

  const getSVGPoint = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
  };

  const getDotCenter = (dot: Dot, side: 'left' | 'right'): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const svg = svgRef.current;
    
    // Get viewBox dimensions (100x100)
    const sideOffset = side === 'left' ? 15 : 85;
    const verticalSpacing = 100 / 4; // Divide into 4 sections (3 dots + spacing)
    
    return {
      x: sideOffset,
      y: verticalSpacing * ((dot.id % 10) + 1)
    };
  };

  const handleTouchStart = (e: React.TouchEvent, dot: Dot) => {
    e.preventDefault();
    const point = getSVGPoint(e.touches[0].clientX, e.touches[0].clientY);
    const dotCenter = getDotCenter(dot, dot.side);
    setActiveConnection({
      from: dot.id,
      path: `M ${dotCenter.x} ${dotCenter.y} L ${point.x} ${point.y}`
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!activeConnection) return;
    e.preventDefault();
    const point = getSVGPoint(e.touches[0].clientX, e.touches[0].clientY);
    const fromDot = [...leftDots, ...rightDots].find(d => d.id === activeConnection.from);
    if (!fromDot) return;
    
    const dotCenter = getDotCenter(fromDot, fromDot.side);
    setActiveConnection({
      ...activeConnection,
      path: `M ${dotCenter.x} ${dotCenter.y} L ${point.x} ${point.y}`
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!activeConnection) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const point = getSVGPoint(touch.clientX, touch.clientY);
    
    // Check if released over a dot on the opposite side
    const fromDot = [...leftDots, ...rightDots].find(d => d.id === activeConnection.from);
    if (!fromDot) {
      setActiveConnection(null);
      return;
    }

    const targetSide = fromDot.side === 'left' ? 'right' : 'left';
    const targetDots = targetSide === 'left' ? leftDots : rightDots;
    
    let matchedDot: Dot | null = null;
    for (const dot of targetDots) {
      const dotCenter = getDotCenter(dot, dot.side);
      const distance = Math.sqrt(
        Math.pow(point.x - dotCenter.x, 2) + Math.pow(point.y - dotCenter.y, 2)
      );
      if (distance < 25) { // Touch radius
        matchedDot = dot;
        break;
      }
    }

    if (matchedDot && fromDot.color === matchedDot.color) {
      // Valid connection - same color on opposite sides
      const dotCenter = getDotCenter(matchedDot, matchedDot.side);
      const fromCenter = getDotCenter(fromDot, fromDot.side);
      
      setConnections([...connections, {
        from: activeConnection.from,
        to: matchedDot.id,
        path: `M ${fromCenter.x} ${fromCenter.y} L ${dotCenter.x} ${dotCenter.y}`
      }]);
      
      // Check if all connections are made
      if (connections.length + 1 === 3) {
        setCompleted(true);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }
    
    setActiveConnection(null);
  };

  const handleMouseDown = (e: React.MouseEvent, dot: Dot) => {
    const point = getSVGPoint(e.clientX, e.clientY);
    const dotCenter = getDotCenter(dot, dot.side);
    setActiveConnection({
      from: dot.id,
      path: `M ${dotCenter.x} ${dotCenter.y} L ${point.x} ${point.y}`
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!activeConnection) return;
    const point = getSVGPoint(e.clientX, e.clientY);
    const fromDot = [...leftDots, ...rightDots].find(d => d.id === activeConnection.from);
    if (!fromDot) return;
    
    const dotCenter = getDotCenter(fromDot, fromDot.side);
    setActiveConnection({
      ...activeConnection,
      path: `M ${dotCenter.x} ${dotCenter.y} L ${point.x} ${point.y}`
    });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!activeConnection) return;
    
    const point = getSVGPoint(e.clientX, e.clientY);
    
    const fromDot = [...leftDots, ...rightDots].find(d => d.id === activeConnection.from);
    if (!fromDot) {
      setActiveConnection(null);
      return;
    }

    const targetSide = fromDot.side === 'left' ? 'right' : 'left';
    const targetDots = targetSide === 'left' ? leftDots : rightDots;
    
    let matchedDot: Dot | null = null;
    for (const dot of targetDots) {
      const dotCenter = getDotCenter(dot, dot.side);
      const distance = Math.sqrt(
        Math.pow(point.x - dotCenter.x, 2) + Math.pow(point.y - dotCenter.y, 2)
      );
      if (distance < 25) {
        matchedDot = dot;
        break;
      }
    }

    if (matchedDot && fromDot.color === matchedDot.color) {
      const dotCenter = getDotCenter(matchedDot, matchedDot.side);
      const fromCenter = getDotCenter(fromDot, fromDot.side);
      
      setConnections([...connections, {
        from: activeConnection.from,
        to: matchedDot.id,
        path: `M ${fromCenter.x} ${fromCenter.y} L ${dotCenter.x} ${dotCenter.y}`
      }]);
      
      if (connections.length + 1 === 3) {
        setCompleted(true);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }
    
    setActiveConnection(null);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.gameContainer}>
        <div className={styles.header}>
          <h2>Connect the Wires</h2>
          <button className={styles.cancelButton} onClick={onCancel}>×</button>
        </div>
        
        <div className={styles.instructions}>
          Connect matching colored dots on each side
        </div>

        <svg
          ref={svgRef}
          className={styles.wireSvg}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setActiveConnection(null)}
        >
          {/* Existing connections */}
          {connections.map((conn, idx) => {
            const fromDot = [...leftDots, ...rightDots].find(d => d.id === conn.from);
            const toDot = [...leftDots, ...rightDots].find(d => d.id === conn.to);
            if (!fromDot || !toDot) return null;
            
            return (
              <path
                key={idx}
                d={conn.path}
                stroke={fromDot.color}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            );
          })}

          {/* Active connection being drawn */}
          {activeConnection && (
            <path
              d={activeConnection.path}
              stroke={[...leftDots, ...rightDots].find(d => d.id === activeConnection.from)?.color || '#fff'}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="5,5"
            />
          )}

          {/* Left dots */}
          {leftDots.map((dot, idx) => {
            const center = getDotCenter(dot, 'left');
            const isConnected = connections.some(c => c.from === dot.id || c.to === dot.id);
            return (
              <circle
                key={dot.id}
                cx={center.x}
                cy={center.y}
                r="4"
                fill={dot.color}
                stroke="#fff"
                strokeWidth="1"
                className={styles.dot}
                style={{ opacity: isConnected ? 0.5 : 1 }}
                onTouchStart={(e) => handleTouchStart(e, dot)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={(e) => handleMouseDown(e, dot)}
              />
            );
          })}

          {/* Right dots */}
          {rightDots.map((dot, idx) => {
            const center = getDotCenter(dot, 'right');
            const isConnected = connections.some(c => c.from === dot.id || c.to === dot.id);
            return (
              <circle
                key={dot.id}
                cx={center.x}
                cy={center.y}
                r="4"
                fill={dot.color}
                stroke="#fff"
                strokeWidth="1"
                className={styles.dot}
                style={{ opacity: isConnected ? 0.5 : 1 }}
                onTouchStart={(e) => handleTouchStart(e, dot)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={(e) => handleMouseDown(e, dot)}
              />
            );
          })}
        </svg>

        {completed && (
          <div className={styles.successMessage}>
            ✓ Task Complete!
          </div>
        )}
      </div>
    </div>
  );
}

