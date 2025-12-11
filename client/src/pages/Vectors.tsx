import React, { useState, useEffect, useMemo, useCallback } from "react";
import { TerminalLayout } from "@/components/layout/TerminalLayout";
import { api, EmbeddingData, SimilarityResponse } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  GitBranch, 
  Loader2, 
  Network, 
  CircleDot, 
  RefreshCw, 
  Filter,
  Calendar,
  Zap,
  AlertTriangle
} from "lucide-react";
import { NetworkGraph } from "@/components/vectors/NetworkGraph";
import { TSNEPlot } from "@/components/vectors/TSNEPlot";

type ViewMode = "network" | "tsne";

export default function Vectors() {
  const [viewMode, setViewMode] = useState<ViewMode>("network");
  const [embeddings, setEmbeddings] = useState<EmbeddingData[]>([]);
  const [similarityData, setSimilarityData] = useState<SimilarityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.5);

  // Get available years and months from embeddings
  const availableYears = useMemo(() => {
    const years = new Set(embeddings.map(e => new Date(e.timestamp).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [embeddings]);

  const availableMonths = useMemo(() => {
    if (!selectedYear) return [];
    const months = new Set(
      embeddings
        .filter(e => new Date(e.timestamp).getFullYear() === selectedYear)
        .map(e => new Date(e.timestamp).getMonth() + 1)
    );
    return Array.from(months).sort((a, b) => a - b);
  }, [embeddings, selectedYear]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fetch embeddings data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [embeddingsRes, similarityRes] = await Promise.all([
        api.embeddings.getAll(selectedYear || undefined, selectedMonth || undefined),
        api.embeddings.getSimilarity(similarityThreshold)
      ]);
      setEmbeddings(embeddingsRes.embeddings);
      setSimilarityData(similarityRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, similarityThreshold]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate embeddings for all notes
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await api.embeddings.generate();
      await api.embeddings.compute3D();
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate embeddings");
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter embeddings based on selected filters
  const filteredEmbeddings = useMemo(() => {
    return embeddings.filter(emb => {
      const date = new Date(emb.timestamp);
      if (selectedYear && date.getFullYear() !== selectedYear) return false;
      if (selectedMonth && date.getMonth() + 1 !== selectedMonth) return false;
      return true;
    });
  }, [embeddings, selectedYear, selectedMonth]);

  // Filter similarity data based on selected filters
  const filteredSimilarityData = useMemo(() => {
    if (!similarityData) return null;
    
    const filteredNodeIds = new Set(filteredEmbeddings.map(e => e.note_id));
    
    return {
      nodes: similarityData.nodes.filter(n => filteredNodeIds.has(n.id)),
      edges: similarityData.edges.filter(e => 
        filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
      )
    };
  }, [similarityData, filteredEmbeddings]);

  return (
    <TerminalLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-4"
        >
          <div className="flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary tracking-tight">VECTOR_SPACE</h1>
            <div className="text-xs text-muted-foreground px-2 py-1 border border-border bg-card/50">
              {filteredEmbeddings.length} vectors loaded
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-wider border border-primary/50 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>Generate Vectors</span>
            </button>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-wider border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </motion.div>

        {/* Controls Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-4 p-4 border border-border bg-card/30"
        >
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">View:</span>
            <div className="flex border border-border">
              <button
                onClick={() => setViewMode("network")}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-wider transition-all ${
                  viewMode === "network" 
                    ? "bg-primary text-background" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Network className="w-4 h-4" />
                <span>Network</span>
              </button>
              <button
                onClick={() => setViewMode("tsne")}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-wider transition-all ${
                  viewMode === "tsne" 
                    ? "bg-primary text-background" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <CircleDot className="w-4 h-4" />
                <span>t-SNE Clusters</span>
              </button>
            </div>
          </div>

          <div className="w-px h-6 bg-border hidden md:block" />

          {/* Date Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Filter:</span>
            
            <select
              value={selectedYear || ""}
              onChange={(e) => {
                setSelectedYear(e.target.value ? parseInt(e.target.value) : null);
                setSelectedMonth(null);
              }}
              className="bg-background border border-border text-sm px-2 py-1 text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              value={selectedMonth || ""}
              onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
              disabled={!selectedYear}
              className="bg-background border border-border text-sm px-2 py-1 text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="">All Months</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>{monthNames[month - 1]}</option>
              ))}
            </select>
          </div>

          {viewMode === "network" && (
            <>
              <div className="w-px h-6 bg-border hidden md:block" />
              
              {/* Similarity Threshold */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Similarity:</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.1"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                  className="w-24 accent-primary"
                />
                <span className="text-xs text-primary font-mono">{similarityThreshold.toFixed(1)}</span>
              </div>
            </>
          )}
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-4 border border-destructive/50 bg-destructive/10 text-destructive"
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {/* Visualization Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="border border-border bg-card/20 relative overflow-hidden"
          style={{ height: "calc(100vh - 340px)", minHeight: "400px" }}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-primary">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm uppercase tracking-wider">Loading vector space...</span>
              </div>
            </div>
          ) : filteredEmbeddings.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-muted-foreground max-w-md text-center p-8">
                <GitBranch className="w-16 h-16 opacity-30" />
                <h3 className="text-lg font-bold text-foreground">No Vectors Found</h3>
                <p className="text-sm">
                  No thought vectors available. Add some notes and click "Generate Vectors" to create embeddings for visualization.
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 text-sm uppercase tracking-wider border border-primary text-primary hover:bg-primary/20 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  <span>Generate Vectors</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {viewMode === "network" && filteredSimilarityData && (
                <NetworkGraph data={filteredSimilarityData} />
              )}
              {viewMode === "tsne" && (
                <TSNEPlot embeddings={filteredEmbeddings} />
              )}
            </>
          )}
          
          {/* Grid overlay for hacker aesthetic */}
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div 
              className="w-full h-full"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: "50px 50px"
              }}
            />
          </div>
        </motion.div>

        {/* Stats Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4"
        >
          <div className="flex items-center gap-4">
            <span>Vectors: {filteredEmbeddings.length}</span>
            {viewMode === "network" && filteredSimilarityData && (
              <>
                <span>Connections: {filteredSimilarityData.edges.length}</span>
                <span>Threshold: {similarityThreshold}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>
              {selectedYear ? `${selectedYear}` : "All Time"}
              {selectedMonth ? ` / ${monthNames[selectedMonth - 1]}` : ""}
            </span>
          </div>
        </motion.div>
      </div>
    </TerminalLayout>
  );
}

