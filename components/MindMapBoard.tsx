
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, Minus, Move, Image as ImageIcon, Trash2, X, StickyNote, Type, 
  Layout, MousePointer2, ArrowLeft, Save, Square, Circle, Triangle, 
  MessageSquare, Smile, Diamond, BoxSelect, Undo, Redo, Share2
} from 'lucide-react';
import { MindMapNode, MindMapDocument } from '../types';

interface MindMapBoardProps {
  themeColor: string;
  initialData: MindMapDocument;
  onBack: () => void;
  onSave: (id: string, nodes: MindMapNode[]) => void;
}

type ToolType = 'select' | 'note' | 'text' | 'shape' | 'sticker' | 'comment';

const EMOJI_LIST = ['👍', '👎', '🔥', '❤️', '✅', '⚠️', '⭐', '🎉', '🚀', '💡', '❓', '👀'];

export const MindMapBoard: React.FC<MindMapBoardProps> = ({ themeColor, initialData, onBack, onSave }) => {
  const [nodes, setNodes] = useState<MindMapNode[]>(initialData.nodes || []);
  const [history, setHistory] = useState<MindMapNode[][]>([initialData.nodes || []]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [title, setTitle] = useState(initialData.title);
  
  // Canvas State
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Interaction State
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  
  // Tool Options
  const [selectedShapeType, setSelectedShapeType] = useState<'rectangle' | 'circle' | 'diamond' | 'triangle'>('rectangle');
  const [pendingSticker, setPendingSticker] = useState<string | null>(null);
  
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Center initial view
  useEffect(() => {
    if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setOffset({ x: width / 2, y: height / 2 });
    }
  }, []);

  // Update History stack
  const updateNodesAndHistory = useCallback((newNodes: MindMapNode[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newNodes);
      // Limit history to 50 steps
      if (newHistory.length > 50) newHistory.shift();
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setNodes(newNodes);
      onSave(initialData.id, newNodes);
  }, [history, historyIndex, initialData.id, onSave]);

  const handleUndo = () => {
      if (historyIndex > 0) {
          const prev = history[historyIndex - 1];
          setHistoryIndex(historyIndex - 1);
          setNodes(prev);
          onSave(initialData.id, prev);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const next = history[historyIndex + 1];
          setHistoryIndex(historyIndex + 1);
          setNodes(next);
          onSave(initialData.id, next);
      }
  };

  // --- Tool Handlers ---

  const handleToolClick = (tool: ToolType) => {
      setActiveTool(tool);
      setSelectedNodeId(null);
      setPendingSticker(null);
      setShowShapeMenu(tool === 'shape');
      setShowEmojiMenu(tool === 'sticker');
  };

  const selectEmoji = (emoji: string) => {
      setPendingSticker(emoji);
      setShowEmojiMenu(false);
  };

  // --- Canvas Interaction ---

  const handleCanvasClick = (e: React.MouseEvent) => {
      if (isDraggingCanvas || draggingNodeId) return;
      if ((e.target as HTMLElement).id !== 'canvas-bg') return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;

      let newNode: MindMapNode | null = null;
      const baseId = `n-${Date.now()}`;

      if (activeTool === 'note') {
          newNode = { id: baseId, type: 'note', label: '', x: x - 80, y: y - 70, parentId: null, color: 'yellow', width: 160, height: 140 };
      } else if (activeTool === 'text') {
          newNode = { id: baseId, type: 'text', label: 'Novo Texto', x: x - 60, y: y - 15, parentId: null, color: 'transparent', width: 150, height: 40 };
      } else if (activeTool === 'shape') {
          newNode = { id: baseId, type: 'shape', label: '', x: x - 75, y: y - 50, parentId: null, color: 'white', width: 150, height: 100, shapeType: selectedShapeType };
      } else if (activeTool === 'sticker' && pendingSticker) {
          newNode = { id: baseId, type: 'sticker', label: pendingSticker, x: x - 40, y: y - 40, parentId: null, color: 'transparent', width: 80, height: 80 };
          setPendingSticker(null);
          setActiveTool('select');
      } else if (activeTool === 'comment') {
          newNode = { id: baseId, type: 'comment', label: '...', x: x - 20, y: y - 20, parentId: null, color: 'blue', width: 40, height: 40 };
          setActiveTool('select');
      } else {
          setSelectedNodeId(null);
      }

      if (newNode) {
          updateNodesAndHistory([...nodes, newNode]);
          setSelectedNodeId(newNode.id);
          if (activeTool !== 'note' && activeTool !== 'shape') setActiveTool('select');
      }
  };

  const handleWheel = (e: React.WheelEvent) => {
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, scale + delta), 5);
      setScale(newScale);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
      if (activeTool !== 'select') return;
      e.stopPropagation();
      setDraggingNodeId(id);
      setSelectedNodeId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDraggingCanvas) {
          const dx = e.clientX - dragStart.x;
          const dy = e.clientY - dragStart.y;
          setOffset({ x: offset.x + dx, y: offset.y + dy });
          setDragStart({ x: e.clientX, y: e.clientY });
      } else if (draggingNodeId) {
          const dx = e.movementX / scale;
          const dy = e.movementY / scale;
          setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: n.x + dx, y: n.y + dy } : n));
      }
  };

  const handleMouseUp = () => {
      if (draggingNodeId) {
          onSave(initialData.id, nodes); // Persist final pos
      }
      setIsDraggingCanvas(false);
      setDraggingNodeId(null);
  };

  const handleUpdateNode = (id: string, updates: Partial<MindMapNode>) => {
      const newNodes = nodes.map(n => n.id === id ? { ...n, ...updates } : n);
      setNodes(newNodes);
      onSave(initialData.id, newNodes);
  };

  const handleDeleteNode = () => {
      if (!selectedNodeId) return;
      const deleteIds = new Set([selectedNodeId]);
      let changed = true;
      while(changed) {
          changed = false;
          nodes.forEach(n => {
              if (n.parentId && deleteIds.has(n.parentId) && !deleteIds.has(n.id)) {
                  deleteIds.add(n.id);
                  changed = true;
              }
          });
      }
      updateNodesAndHistory(nodes.filter(n => !deleteIds.has(n.id)));
      setSelectedNodeId(null);
  };

  const getPath = (p: MindMapNode, c: MindMapNode) => {
      const pW = p.width || 150; const pH = p.height || 50;
      const cW = c.width || 150; const cH = c.height || 50;
      const startX = p.x + pW / 2; const startY = p.y + pH / 2;
      const endX = c.x + cW / 2; const endY = c.y + cH / 2;
      const cp1x = startX + (endX - startX) / 2;
      const cp2x = startX + (endX - startX) / 2;
      return `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;
  };

  const getShapeClasses = (node: MindMapNode) => {
      let classes = "w-full h-full flex items-center justify-center transition-all ";
      if (node.type === 'shape') {
          switch (node.shapeType) {
              case 'circle': classes += "rounded-full aspect-square "; break;
              case 'diamond': classes += "rotate-45 "; break;
              case 'triangle': classes += "clip-triangle bg-white "; break;
              default: classes += "rounded-lg "; break;
          }
          classes += "border-2 border-gray-400 bg-white shadow-sm ";
      } else if (node.type === 'note') {
          classes += "shadow-lg ";
          if (node.color === 'yellow') classes += "bg-yellow-200 text-yellow-900";
          else if (node.color === 'blue') classes += "bg-blue-200 text-blue-900";
          else if (node.color === 'green') classes += "bg-green-200 text-green-900";
          else if (node.color === 'pink') classes += "bg-pink-200 text-pink-900";
          else classes += "bg-yellow-200 text-yellow-900";
      } else if (node.type === 'comment') {
          classes += "bg-blue-500 text-white rounded-tr-xl rounded-tl-xl rounded-bl-xl shadow-md";
      } else if (node.type === 'root') {
          classes += "bg-indigo-600 text-white rounded-full shadow-xl border-2 border-indigo-400";
      } else if (node.type === 'node') {
          classes += "bg-white border-2 border-gray-300 rounded-lg shadow-sm";
      } else if (node.type === 'text') {
          classes += "bg-transparent";
      }
      return classes;
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#f0f2f5] flex flex-col font-sans select-none">
        <style>{`
            .clip-triangle { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
            .font-handwriting { font-family: 'Comic Sans MS', 'Chalkboard SE', cursive; }
        `}</style>

        {/* --- HEADER --- */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
            <button onClick={onBack} className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <ArrowLeft size={20} />
            </button>
            <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 font-bold text-gray-700">
                {title}
            </div>
        </div>

        {/* --- LEFT TOOLBAR --- */}
        <div className="absolute left-4 top-24 flex flex-col bg-white rounded-xl shadow-xl border border-gray-200 p-1.5 z-40 gap-1">
            <button onClick={() => handleToolClick('select')} className={`p-2.5 rounded-lg transition-all ${activeTool === 'select' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Selecionar (V)"><MousePointer2 size={20} /></button>
            <button onClick={() => handleToolClick('note')} className={`p-2.5 rounded-lg transition-all ${activeTool === 'note' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Nota Adesiva (N)"><StickyNote size={20} /></button>
            <button onClick={() => handleToolClick('shape')} className={`p-2.5 rounded-lg transition-all ${activeTool === 'shape' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Formas (S)"><Layout size={20} /></button>
            <button onClick={() => handleToolClick('text')} className={`p-2.5 rounded-lg transition-all ${activeTool === 'text' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Texto (T)"><Type size={20} /></button>
            <button onClick={() => handleToolClick('sticker')} className={`p-2.5 rounded-lg transition-all ${activeTool === 'sticker' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Adesivos (E)"><Smile size={20} /></button>
            <button onClick={() => handleToolClick('comment')} className={`p-2.5 rounded-lg transition-all ${activeTool === 'comment' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Comentário (C)"><MessageSquare size={20} /></button>
        </div>

        {/* --- SUB-MENUS --- */}
        {showShapeMenu && activeTool === 'shape' && (
            <div className="absolute left-20 top-40 bg-white rounded-xl shadow-xl border border-gray-200 p-2 flex flex-col gap-2 z-50 animate-in fade-in slide-in-from-left-2">
                {(['rectangle', 'circle', 'diamond', 'triangle'] as const).map(shape => (
                    <button key={shape} onClick={() => setSelectedShapeType(shape)} className={`p-2 rounded hover:bg-gray-100 ${selectedShapeType === shape ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>
                        {shape === 'rectangle' ? <Square size={20} /> : shape === 'circle' ? <Circle size={20} /> : shape === 'diamond' ? <Diamond size={20} /> : <Triangle size={20} />}
                    </button>
                ))}
            </div>
        )}

        {showEmojiMenu && activeTool === 'sticker' && (
            <div className="absolute left-20 top-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3 grid grid-cols-4 gap-2 z-50 animate-in fade-in slide-in-from-left-2 w-64">
                {EMOJI_LIST.map(e => (
                    <button key={e} onClick={() => selectEmoji(e)} className="text-2xl hover:bg-gray-100 p-2 rounded text-center transition-transform hover:scale-125">{e}</button>
                ))}
            </div>
        )}

        {/* --- UNDO/REDO & ZOOM --- */}
        <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-1 flex items-center gap-1">
                <button onClick={handleUndo} disabled={historyIndex === 0} className="p-2.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-50"><Undo size={18}/></button>
                <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-2.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-50"><Redo size={18}/></button>
            </div>
        </div>

        <div className="absolute bottom-4 right-4 z-30 flex items-center gap-3 bg-white p-2 rounded-xl shadow-lg border border-gray-200">
            <button onClick={() => setScale(s => Math.max(s - 0.1, 0.1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><Minus size={18}/></button>
            <span className="text-sm font-mono font-bold w-12 text-center text-gray-700">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(s + 0.1, 5))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><Plus size={18}/></button>
        </div>

        {/* --- MAIN CANVAS --- */}
        <div 
            ref={containerRef}
            className="w-full h-full cursor-grab active:cursor-grabbing bg-[#f0f2f5] overflow-hidden"
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
            onMouseDown={(e) => {
                if ((e.target as HTMLElement).id === 'canvas-bg' && activeTool === 'select') {
                    setIsDraggingCanvas(true);
                    setDragStart({ x: e.clientX, y: e.clientY });
                }
            }}
        >
            <div 
                id="canvas-bg"
                className="w-full h-full transform-origin-0-0"
                style={{ 
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            >
                <svg className="absolute top-[-5000px] left-[-5000px] w-[10000px] h-[10000px] pointer-events-none overflow-visible">
                    {nodes.filter(n => n.parentId).map(node => {
                        const parent = nodes.find(p => p.id === node.parentId);
                        if (!parent) return null;
                        return <path key={`line-${node.id}`} d={getPath(parent, node)} stroke="#94a3b8" strokeWidth="2" fill="none" />;
                    })}
                </svg>

                {nodes.map(node => {
                    const isSelected = selectedNodeId === node.id;
                    const isShapeDiamond = node.shapeType === 'diamond';
                    return (
                        <div
                            key={node.id}
                            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                            className={`absolute ${isSelected ? 'z-20 ring-2 ring-blue-500 ring-offset-2' : 'z-10'} group`}
                            style={{ left: node.x, top: node.y, width: node.width || 150, height: node.height || 50 }}
                        >
                            <div className={getShapeClasses(node)}>
                                <div className={`w-full h-full flex flex-col items-center justify-center p-2 ${isShapeDiamond ? '-rotate-45' : ''}`}>
                                    {node.type === 'sticker' ? (
                                        <div className="text-6xl">{node.label}</div>
                                    ) : node.type === 'comment' ? (
                                        <MessageSquare size={20} className="text-white"/>
                                    ) : (
                                        <textarea
                                            value={node.label}
                                            onChange={(e) => handleUpdateNode(node.id, { label: e.target.value })}
                                            className={`bg-transparent w-full h-full resize-none border-none focus:ring-0 overflow-hidden ${
                                                node.type === 'text' ? 'text-left' : 'text-center'
                                            } ${node.type === 'note' ? 'font-handwriting leading-relaxed' : 'font-medium'}`}
                                            placeholder={node.type === 'text' ? "Digite..." : ""}
                                        />
                                    )}
                                </div>
                            </div>
                            {isSelected && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteNode(); }}
                                    className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-md border border-gray-200 text-red-500 hover:bg-red-50"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
        
        {activeTool === 'sticker' && pendingSticker && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-xl z-50 text-sm font-bold flex items-center gap-2 animate-bounce">
                <span>Clique no quadro para colar: {pendingSticker}</span>
                <button onClick={() => handleToolClick('select')}><X size={14}/></button>
            </div>
        )}
    </div>
  );
};
