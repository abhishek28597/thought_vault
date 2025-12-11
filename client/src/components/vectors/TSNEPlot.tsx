import React, { useRef, useEffect, useState, useCallback } from "react";
import { EmbeddingData } from "@/lib/api";

interface TSNEPlotProps {
  embeddings: EmbeddingData[];
}

interface Point {
  id: string;
  x: number;
  y: number;
  content: string;
  timestamp: string;
  screenX?: number;
  screenY?: number;
}

export function TSNEPlot({ embeddings }: TSNEPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [transform, setTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Convert embeddings to points
  const points: Point[] = embeddings.map((emb, index) => {
    let x = 0, y = 0;
    
    if (emb.coords_tsne && emb.coords_tsne.length === 2) {
      x = emb.coords_tsne[0];
      y = emb.coords_tsne[1];
    } else if (emb.embedding && emb.embedding.length >= 2) {
      // Fallback to first 2 embedding dimensions
      x = (emb.embedding[0] * 2 - 1);
      y = (emb.embedding[1] * 2 - 1);
    } else {
      // Random fallback
      const angle = (index / embeddings.length) * Math.PI * 2;
      x = Math.cos(angle) * 0.5;
      y = Math.sin(angle) * 0.5;
    }
    
    return {
      id: emb.note_id,
      x,
      y,
      content: emb.content,
      timestamp: emb.timestamp
    };
  });

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Convert data coordinates to screen coordinates
  const toScreen = useCallback((x: number, y: number) => {
    const { width, height } = dimensions;
    const { scale, offsetX, offsetY } = transform;
    const padding = 60;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    
    const screenX = padding + ((x + 1) / 2) * plotWidth * scale + offsetX;
    const screenY = padding + ((1 - y) / 2) * plotHeight * scale + offsetY;
    
    return { screenX, screenY };
  }, [dimensions, transform]);

  // Draw the plot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = "rgba(34, 197, 94, 0.1)";
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw axes
    const centerX = width / 2 + transform.offsetX;
    const centerY = height / 2 + transform.offsetY;
    
    ctx.strokeStyle = "rgba(34, 197, 94, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Horizontal axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // Vertical axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Calculate screen positions for all points
    const screenPoints = points.map(p => {
      const { screenX, screenY } = toScreen(p.x, p.y);
      return { ...p, screenX, screenY };
    });
    
    // Draw connections between nearby points (clustering visualization)
    ctx.strokeStyle = "rgba(34, 197, 94, 0.15)";
    ctx.lineWidth = 1;
    
    for (let i = 0; i < screenPoints.length; i++) {
      for (let j = i + 1; j < screenPoints.length; j++) {
        const p1 = screenPoints[i];
        const p2 = screenPoints[j];
        const dist = Math.sqrt(
          Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2)
        );
        
        // Connect points that are close in t-SNE space
        if (dist < 0.3) {
          ctx.beginPath();
          ctx.moveTo(p1.screenX!, p1.screenY!);
          ctx.lineTo(p2.screenX!, p2.screenY!);
          ctx.stroke();
        }
      }
    }
    
    // Draw points
    screenPoints.forEach(point => {
      const isHovered = hoveredPoint?.id === point.id;
      const x = point.screenX!;
      const y = point.screenY!;
      const radius = isHovered ? 12 : 8;
      
      // Outer glow
      if (isHovered) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.5)");
        gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Main circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? "#4ade80" : "#22c55e";
      ctx.fill();
      
      // Border
      ctx.strokeStyle = isHovered ? "#86efac" : "#166534";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Inner highlight
      ctx.beginPath();
      ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fill();
    });
    
    // Draw labels for all points
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    
    screenPoints.forEach(point => {
      const isHovered = hoveredPoint?.id === point.id;
      const x = point.screenX!;
      const y = point.screenY!;
      const radius = isHovered ? 12 : 8;
      
      const label = point.content.length > 20 ? point.content.slice(0, 20) + "..." : point.content;
      ctx.fillStyle = isHovered ? "#4ade80" : "rgba(34, 197, 94, 0.7)";
      ctx.fillText(label, x, y + radius + 5);
    });
    
  }, [dimensions, points, hoveredPoint, transform, toScreen]);

  // Handle mouse move for hover detection
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x: e.clientX, y: e.clientY });
    
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        offsetX: prev.offsetX + (x - dragStart.x),
        offsetY: prev.offsetY + (y - dragStart.y)
      }));
      setDragStart({ x, y });
      return;
    }
    
    // Find hovered point
    let found: Point | null = null;
    
    for (const point of points) {
      const { screenX, screenY } = toScreen(point.x, point.y);
      const dist = Math.sqrt(Math.pow(x - screenX, 2) + Math.pow(y - screenY, 2));
      
      if (dist < 15) {
        found = { ...point, screenX, screenY };
        break;
      }
    }
    
    setHoveredPoint(found);
    canvas.style.cursor = found ? "pointer" : "grab";
  }, [points, toScreen, isDragging, dragStart]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    canvas.style.cursor = "grabbing";
  }, []);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hoveredPoint ? "pointer" : "grab";
    }
  }, [hoveredPoint]);

  // Handle wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * delta, 0.5), 3)
    }));
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* Hover tooltip */}
      {hoveredPoint && (
        <div 
          className="absolute z-20 max-w-sm p-4 border border-primary bg-background/95 backdrop-blur-sm shadow-lg shadow-primary/20"
          style={{ 
            left: Math.min(hoveredPoint.screenX! + 20, dimensions.width - 250),
            top: Math.min(hoveredPoint.screenY! - 10, dimensions.height - 150),
            pointerEvents: "none"
          }}
        >
          <div className="text-xs text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Thought Cluster Point
          </div>
          <p className="text-sm text-foreground font-mono leading-relaxed whitespace-pre-wrap">
            {hoveredPoint.content}
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            {new Date(hoveredPoint.timestamp).toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground/70">
            t-SNE: ({hoveredPoint.x.toFixed(3)}, {hoveredPoint.y.toFixed(3)})
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute top-4 right-4 p-3 border border-border bg-background/80 backdrop-blur-sm text-xs">
        <div className="text-primary uppercase tracking-wider mb-2">t-SNE Clustering</div>
        <div className="space-y-1 text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary border border-primary/50" />
            <span>Thought embedding</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-primary/30" />
            <span>Cluster proximity</span>
          </div>
          <div className="text-[10px] mt-2 text-muted-foreground/70">
            Similar thoughts cluster together
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={resetView}
          className="px-2 py-1 text-xs border border-border bg-background/80 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          Reset View
        </button>
        <span className="text-xs text-muted-foreground">
          Zoom: {(transform.scale * 100).toFixed(0)}%
        </span>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">
        Scroll to zoom • Drag to pan • Hover for details
      </div>
      
      {/* Stats */}
      <div className="absolute top-4 left-4 p-2 border border-border bg-background/80 backdrop-blur-sm text-xs">
        <span className="text-primary">{points.length}</span>
        <span className="text-muted-foreground"> vectors in t-SNE space</span>
      </div>
    </div>
  );
}

