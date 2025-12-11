import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { SimilarityResponse } from "@/lib/api";

interface NetworkGraphProps {
  data: SimilarityResponse;
}

interface GraphNode {
  id: string;
  content: string;
  timestamp: string;
  size: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  similarity: number;
}

// Fixed node size for consistency
const NODE_SIZE = 8;

export function NetworkGraph({ data }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Update dimensions on resize
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

  // Transform data for force graph - memoized to prevent unnecessary re-renders
  const graphData = useMemo(() => ({
    nodes: data.nodes.map(n => ({ ...n })) as GraphNode[],
    links: data.edges.map(e => ({
      source: e.source,
      target: e.target,
      similarity: e.similarity
    })) as GraphLink[]
  }), [data]);

  // Get hovered node for tooltip
  const hoveredNode = useMemo(() => 
    hoveredNodeId ? graphData.nodes.find(n => n.id === hoveredNodeId) : null
  , [hoveredNodeId, graphData.nodes]);

  // Custom node rendering - stable callback
  const drawNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHovered = hoveredNodeId === node.id;
    const x = node.x || 0;
    const y = node.y || 0;
    
    // Outer glow for hovered node
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(x, y, NODE_SIZE + 4, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(34, 197, 94, 0.3)";
      ctx.fill();
    }
    
    // Main node circle
    ctx.beginPath();
    ctx.arc(x, y, NODE_SIZE, 0, 2 * Math.PI);
    ctx.fillStyle = isHovered ? "#22c55e" : "#166534";
    ctx.fill();
    
    // Border
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.stroke();
    
    // Always show label (truncated)
    const label = node.content.length > 25 ? node.content.slice(0, 25) + "..." : node.content;
    const fontSize = Math.max(10 / globalScale, 3);
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = isHovered ? "#4ade80" : "#22c55e";
    ctx.fillText(label, x, y + NODE_SIZE + 3);
  }, [hoveredNodeId]);

  // Define the clickable/hoverable area for nodes
  const nodePointerAreaPaint = useCallback((node: GraphNode, color: string, ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.arc(node.x || 0, node.y || 0, NODE_SIZE + 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  // Custom link rendering - stable callback
  const drawLink = useCallback((link: GraphLink, ctx: CanvasRenderingContext2D) => {
    const source = link.source as GraphNode;
    const target = link.target as GraphNode;
    
    if (!source.x || !source.y || !target.x || !target.y) return;
    
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = `rgba(34, 197, 94, ${Math.max(link.similarity * 0.6, 0.2)})`;
    ctx.lineWidth = Math.max(link.similarity * 2, 0.5);
    ctx.stroke();
  }, []);

  // Handle node hover - just update the ID, don't store the whole node
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNodeId(node?.id || null);
  }, []);

  // Handle node click - gentle zoom, not aggressive
  const handleNodeClick = useCallback((node: GraphNode) => {
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 800);
      // Only zoom if currently zoomed out
      const currentZoom = graphRef.current.zoom();
      if (currentZoom < 1.5) {
        graphRef.current.zoom(1.5, 800);
      }
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={nodePointerAreaPaint}
        linkCanvasObject={drawLink}
        nodeRelSize={NODE_SIZE}
        linkWidth={link => Math.max((link as GraphLink).similarity * 2, 0.5)}
        linkColor={() => "rgba(34, 197, 94, 0.3)"}
        backgroundColor="transparent"
        onNodeHover={(node) => handleNodeHover(node as GraphNode | null)}
        onNodeClick={(node) => handleNodeClick(node as GraphNode)}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        minZoom={0.5}
        maxZoom={5}
      />
      
      {/* Hover tooltip */}
      {hoveredNode && (
        <div 
          className="absolute bottom-4 left-4 max-w-md p-4 border border-primary bg-background/95 backdrop-blur-sm z-10"
          style={{ pointerEvents: "none" }}
        >
          <div className="text-xs text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary animate-pulse" />
            Thought Vector
          </div>
          <p className="text-sm text-foreground font-mono leading-relaxed">
            {hoveredNode.content}
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            {new Date(hoveredNode.timestamp).toLocaleString()}
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute top-4 right-4 p-3 border border-border bg-background/80 backdrop-blur-sm text-xs">
        <div className="text-primary uppercase tracking-wider mb-2">Network Legend</div>
        <div className="space-y-1 text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/50 border border-primary" />
            <span>Thought node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-primary/50" />
            <span>Similarity link</span>
          </div>
        </div>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
        Scroll to zoom • Drag to pan • Click node to focus
      </div>
    </div>
  );
}

