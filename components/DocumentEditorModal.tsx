
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Image as ImageIcon, Smile, Type, Bold, Italic, Underline, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, CheckSquare, ChevronDown, Table, Link, Users, Check, Upload, Trash2 } from 'lucide-react';
import { Document, User, Task } from '../types';

interface DocumentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onSave: (doc: Partial<Document>) => void;
  themeColor: string;
  tasks: Task[];
  users: User[];
  currentUser: User;
}

const COMMON_EMOJIS = ['📅', '📈', '📋', '✅', '🔥', '💡', '🚀', '🎨', '📢', '💼', '📁', '📊', '📝', '🔒', '🔔', '⭐'];

export const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({ 
  isOpen, 
  onClose, 
  document, 
  onSave, 
  themeColor,
  tasks,
  users,
  currentUser
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [emoji, setEmoji] = useState<string | undefined>(undefined);
  const [docType, setDocType] = useState<Document['type']>('general');
  const [linkedTaskId, setLinkedTaskId] = useState<string | undefined>(undefined);
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI States
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showTextStyleMenu, setShowTextStyleMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const selectionRange = useRef<Range | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
      setCoverImage(document.coverImage);
      setEmoji(document.emoji);
      setDocType(document.type);
      setLinkedTaskId(document.linkedTaskId);
      setSharedWith(document.sharedWith || []);
      if (contentRef.current) {
        contentRef.current.innerHTML = document.content;
      }
    } else {
      // New Doc Defaults
      setTitle('');
      setContent('');
      setCoverImage(undefined);
      setEmoji(undefined);
      setDocType('general');
      setLinkedTaskId(undefined);
      setSharedWith([]);
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
      }
    }
  }, [document, isOpen]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        // Only save if selection is inside our editor
        if (contentRef.current && contentRef.current.contains(sel.anchorNode)) {
            selectionRange.current = sel.getRangeAt(0);
        }
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && selectionRange.current) {
      sel.removeAllRanges();
      sel.addRange(selectionRange.current);
    }
  };

  // Helper to compress images to avoid localStorage limits
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = window.document.createElement('canvas'); // Fix: Disambiguated global document from local prop shadowing
                const ctx = canvas.getContext('2d');
                const maxWidth = 1200; // Reasonable width for docs
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = height * (maxWidth / width);
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);
                // Compress to JPEG 0.7 quality
                resolve(canvas.toDataURL('image/jpeg', 0.7)); 
            };
        };
    });
  };

  // Basic Rich Text Command execution
  const execCmd = (command: string, value: string | undefined = undefined) => {
    restoreSelection();
    window.document.execCommand(command, false, value);
    if (contentRef.current) {
        contentRef.current.focus();
        saveSelection();
    }
  };

  const insertTable = () => {
    const rowsStr = prompt('Número de linhas:', '3');
    const colsStr = prompt('Número de colunas:', '3');
    
    if (!rowsStr || !colsStr) return;
    
    const rows = parseInt(rowsStr) || 3;
    const cols = parseInt(colsStr) || 3;

    restoreSelection();

    let tableHTML = `<table style="width:100%; border-collapse: collapse; margin-top: 1rem; margin-bottom: 1rem; border: 1px solid #cbd5e1;"><tbody>`;
    // Header Row
    tableHTML += `<tr>`;
    for(let j=0; j<cols; j++) {
        tableHTML += `<th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #f1f5f9; min-width: 50px; text-align: left;">Cabeçalho ${j+1}</th>`;
    }
    tableHTML += `</tr>`;

    // Data Rows
    for(let i=1; i<rows; i++) { // Start at 1 since we added header
        tableHTML += `<tr>`;
        for(let j=0; j<cols; j++) {
            tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 10px; min-width: 50px; height: 30px;"></td>`;
        }
        tableHTML += `</tr>`;
    }
    // Important: Add a paragraph with break after table to ensure cursor can escape
    tableHTML += `</tbody></table><p><br/></p>`;
    
    execCmd('insertHTML', tableHTML);
  };

  const handleEditorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressedDataUrl = await compressImage(file);
      restoreSelection();
      const imgHtml = `<img src="${compressedDataUrl}" style="max-width: 100%; border-radius: 8px; margin: 1rem 0; display: block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" />`;
      execCmd('insertHTML', imgHtml);
    }
    e.target.value = '';
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const compressedDataUrl = await compressImage(file);
          setCoverImage(compressedDataUrl);
      }
      e.target.value = '';
  };

  const toggleUserShare = (userId: string) => {
      setSharedWith(prev => 
          prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
  };

  const handleSave = () => {
    setIsSaving(true);
    const newContent = contentRef.current?.innerHTML || '';
    
    setTimeout(() => {
        onSave({
            title: title || 'Sem Título',
            content: newContent,
            coverImage,
            emoji,
            type: docType,
            linkedTaskId,
            sharedWith
        });
        setIsSaving(false);
        onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#151a21] w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-[#2a303c]">
        
        {/* Toolbar */}
        <div className="h-16 border-b border-gray-200 dark:border-[#2a303c] bg-gray-50 dark:bg-[#0b0e11] flex items-center justify-between px-6 shrink-0 gap-4 relative z-20">
            
            <div className="flex items-center gap-4">
                {/* Text Styles Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setShowTextStyleMenu(!showTextStyleMenu)}
                        className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1e232d] px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Texto Normal <ChevronDown size={14} />
                    </button>
                    {showTextStyleMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowTextStyleMenu(false)}></div>
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#1e232d] rounded-lg shadow-xl border border-gray-200 dark:border-[#2a303c] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                                <button onClick={() => { execCmd('formatBlock', 'P'); setShowTextStyleMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-[#2a303c] text-gray-700 dark:text-gray-200">Texto Normal</button>
                                <button onClick={() => { execCmd('formatBlock', 'H1'); setShowTextStyleMenu(false); }} className="w-full text-left px-4 py-3 text-2xl font-bold hover:bg-gray-100 dark:hover:bg-[#2a303c] text-gray-900 dark:text-white border-t border-gray-100 dark:border-[#2a303c]">Título 1</button>
                                <button onClick={() => { execCmd('formatBlock', 'H2'); setShowTextStyleMenu(false); }} className="w-full text-left px-4 py-3 text-xl font-bold hover:bg-gray-100 dark:hover:bg-[#2a303c] text-gray-800 dark:text-gray-100 border-t border-gray-100 dark:border-[#2a303c]">Título 2</button>
                                <button onClick={() => { execCmd('formatBlock', 'H3'); setShowTextStyleMenu(false); }} className="w-full text-left px-4 py-3 text-lg font-bold hover:bg-gray-100 dark:hover:bg-[#2a303c] text-gray-700 dark:text-gray-200 border-t border-gray-100 dark:border-[#2a303c]">Título 3</button>
                            </div>
                        </>
                    )}
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-[#2a303c]"></div>

                {/* Formatting */}
                <div className="flex items-center gap-1">
                    <button onClick={() => execCmd('bold')} className="p-2 hover:bg-gray-200 dark:hover:bg-[#1e232d] rounded text-gray-600 dark:text-gray-300 transition-colors" title="Negrito"><Bold size={18}/></button>
                    <button onClick={() => execCmd('italic')} className="p-2 hover:bg-gray-200 dark:hover:bg-[#1e232d] rounded text-gray-600 dark:text-gray-300 transition-colors" title="Itálico"><Italic size={18}/></button>
                    <button onClick={() => execCmd('underline')} className="p-2 hover:bg-gray-200 dark:hover:bg-[#1e232d] rounded text-gray-600 dark:text-gray-300 transition-colors" title="Sublinhado"><Underline size={18}/></button>
                    <button onClick={() => execCmd('strikeThrough')} className="p-2 hover:bg-gray-200 dark:hover:bg-[#1e232d] rounded text-gray-600 dark:text-gray-300 transition-colors" title="Tachado"><Strikethrough size={18}/></button>
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-[#2a303c]"></div>

                {/* Lists & Alignment */}
                <div className="flex items-center gap-1">
                    <button onClick={() => execCmd('insertUnorderedList')} className="p-2 hover:bg-gray-200 dark:hover:bg-[#1e232d] rounded text-gray-600 dark:text-gray-300 transition-colors" title="Lista com Marcadores"><List size={18}/></button>
                    <button onClick={() => execCmd('insertOrderedList')} className="p-2 hover:bg-gray-200 dark:hover:bg-[#1e232d] rounded text-gray-600 dark:text-gray-300 transition-colors" title="Lista Numerada"><ListOrdered size={18}/></button>
                    <div className="w-px h-4 bg-gray-300 dark:bg-[#2a303c] mx-1"></div>
                    <button onClick={() => execCmd('justifyLeft')} className="p-2 hover:bg-gray-200 dark:hover:bg-[#1e232d] rounded text-gray-600 dark:text-gray-300 transition-colors" title="Alinhar à Esquerda"><AlignLeft size={18}/></button>
                    <button onClick={() => execCmd('justifyCenter')} className="p-2 hover:bg-gray-200 dark:hover:bg-[#1e232d] rounded text-gray-600 dark:text-gray-300 transition-colors" title="Centralizar"><AlignCenter size={18}/></button>
                    <button onClick={() => execCmd('justifyRight')} className="p-2 hover:bg-gray-200 dark:hover:bg-[#1e232d] rounded text-gray-600 dark:text-gray-300 transition-colors" title="Alinhar à Direita"><AlignRight size={18}/></button>
                </div>
                
                <div className="w-px h-6 bg-gray-300 dark:bg-[#2a303c]"></div>

                {/* Insert Objects */}
                <div className="flex items-center gap-1">
                    <button onClick={insertTable} className="p-2 hover:bg-gray-200 dark:hover:bg-[#1e232d] rounded text-gray-600 dark:text-gray-300 transition-colors" title="Inserir Tabela"><Table size={18}/></button>
                    <label className="p-2 hover:bg-gray-200 dark:hover:bg-[#1e232d] rounded text-gray-600 dark:text-gray-300 transition-colors cursor-pointer" title="Inserir Imagem">
                        <input type="file" className="hidden" accept="image/*" onChange={handleEditorImageUpload} />
                        <ImageIcon size={18}/>
                    </label>
                </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
                <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">{isSaving ? 'Salvando...' : 'Não salvo'}</span>
                <button 
                    onClick={handleSave}
                    className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-${themeColor}-500/20`}
                >
                    <Save size={18} /> Salvar
                </button>
                <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#151a21] custom-scrollbar">
            
            {/* Cover Image */}
            <div className="relative w-full h-56 group bg-gray-100 dark:bg-[#0b0e11] border-b border-gray-200 dark:border-[#2a303c]">
                <input 
                    type="file" 
                    ref={coverInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleCoverUpload} 
                />
                
                {coverImage ? (
                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e232d] transition-colors" onClick={() => coverInputRef.current?.click()}>
                        <ImageIcon size={32} className="opacity-50" />
                        <span className="text-sm font-medium">Adicionar Capa</span>
                    </div>
                )}
                
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                        onClick={() => coverInputRef.current?.click()}
                        className="bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md transition-colors flex items-center gap-2 border border-white/10"
                    >
                        <Upload size={14} /> {coverImage ? 'Alterar' : 'Upload'}
                    </button>
                    {coverImage && (
                        <button 
                            onClick={() => setCoverImage(undefined)}
                            className="bg-red-500/80 hover:bg-red-600/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md transition-colors flex items-center gap-2 border border-white/10"
                        >
                            <Trash2 size={14} /> Remover
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-8 py-10 relative">
                {/* Meta Header / Icon */}
                <div className="relative -mt-20 mb-8 group inline-block z-20">
                    <div 
                         className="w-24 h-24 text-5xl bg-white dark:bg-[#151a21] rounded-full shadow-xl flex items-center justify-center cursor-pointer border-4 border-white dark:border-[#151a21] hover:bg-gray-50 dark:hover:bg-[#1e232d] transition-colors relative"
                         onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                         title="Alterar Ícone"
                    >
                        {emoji || <Smile size={40} className="text-gray-300 dark:text-slate-600"/>}
                        <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                            Editar
                        </div>
                    </div>
                    
                    {/* Emoji Picker Popover */}
                    {showEmojiPicker && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)}></div>
                            <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-[#1e232d] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a303c] z-40 w-64 animate-in fade-in zoom-in-95 duration-100">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-3">Escolha um ícone</div>
                                <div className="grid grid-cols-4 gap-2">
                                    {COMMON_EMOJIS.map(e => (
                                        <button 
                                            key={e}
                                            onClick={() => { setEmoji(e); setShowEmojiPicker(false); }}
                                            className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 dark:hover:bg-[#1e232d] rounded-lg transition-colors"
                                        >
                                            {e}
                                        </button>
                                    ))}
                                    <button 
                                        onClick={() => {
                                            const manual = prompt('Cole um emoji aqui:');
                                            if (manual) setEmoji(manual);
                                            setShowEmojiPicker(false);
                                        }}
                                        className="col-span-4 mt-2 text-xs bg-gray-100 dark:bg-[#2a303c] py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#374151]"
                                    >
                                        Usar outro...
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Title Input */}
                <input 
                    type="text" 
                    placeholder="Título do Documento" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-5xl font-black bg-transparent border-none focus:ring-0 placeholder-gray-300 dark:placeholder-gray-700 text-gray-900 dark:text-white p-0 mb-6 leading-tight"
                />

                {/* Meta info row */}
                <div className="flex flex-wrap items-center gap-6 mb-10 text-sm text-gray-500 border-b border-gray-100 dark:border-[#2a303c] pb-6 relative z-10">
                    <div className="flex items-center gap-2">
                        <Type size={16} />
                        <select 
                            value={docType} 
                            onChange={(e) => setDocType(e.target.value as any)}
                            className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 text-gray-600 dark:text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors"
                        >
                            <option value="general">Geral</option>
                            <option value="meeting">Ata de Reunião</option>
                            <option value="project">Projeto</option>
                            <option value="briefing">Briefing</option>
                        </select>
                    </div>
                    
                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
                    
                    {/* Task Link */}
                    <div className="flex items-center gap-2">
                        <Link size={16} />
                        <select 
                            value={linkedTaskId || ''} 
                            onChange={(e) => setLinkedTaskId(e.target.value || undefined)}
                            className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 text-gray-600 dark:text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors max-w-[150px] truncate"
                        >
                            <option value="">Vincular a Tarefa</option>
                            {tasks.map(t => (
                                <option key={t.id} value={t.id}>#{t.id.slice(0,4)} - {t.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>

                    {/* Sharing */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-500 font-medium"
                        >
                            <Users size={16} />
                            <span>{sharedWith.length === 0 ? 'Público' : `${sharedWith.length} Membros`}</span>
                            <ChevronDown size={14} />
                        </button>
                        
                        {showShareMenu && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1e232d] rounded-xl shadow-xl border border-gray-200 dark:border-[#2a303c] p-2 z-50">
                                <div className="text-xs font-bold text-gray-400 uppercase p-2 mb-1">Compartilhar com</div>
                                {users.filter(u => u.id !== currentUser.id).map(user => (
                                    <div 
                                        key={user.id} 
                                        onClick={() => toggleUserShare(user.id)}
                                        className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-[#2a303c] rounded-lg cursor-pointer transition-colors"
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${sharedWith.includes(user.id) ? `bg-${themeColor}-500 border-${themeColor}-500` : 'border-gray-400'}`}>
                                            {sharedWith.includes(user.id) && <Check size={12} className="text-white" />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <img src={user.avatar} className="w-6 h-6 rounded-full" alt={user.name}/>
                                            <span className="text-sm text-gray-700 dark:text-gray-200">{user.name}</span>
                                        </div>
                                    </div>
                                ))}
                                {users.length <= 1 && (
                                    <div className="p-2 text-xs text-gray-500 text-center">Sem outros membros</div>
                                )}
                            </div>
                        )}
                        {/* Overlay to close share menu */}
                        {showShareMenu && (
                            <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)}></div>
                        )}
                    </div>

                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>

                    <div className="flex items-center gap-2">
                        <span>Criado em {new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>

                {/* Editable Content */}
                <div 
                    ref={contentRef}
                    contentEditable
                    // Fix: placeholder on div is not standard React prop; changed to data-attribute for CSS attr() compatibility
                    onBlur={saveSelection}
                    onMouseUp={saveSelection}
                    onKeyUp={saveSelection}
                    className="min-h-[400px] outline-none text-lg text-gray-800 dark:text-gray-300 leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 document-editor-content pb-20"
                    data-placeholder="Comece a digitar ou digite '/' para comandos..."
                />
            </div>
        </div>
      </div>
      <style>{`
        .document-editor-content h1 { font-size: 2.5em; font-weight: 800; margin-bottom: 0.5em; margin-top: 1.5em; color: inherit; line-height: 1.2; }
        .document-editor-content h2 { font-size: 2em; font-weight: 700; margin-bottom: 0.5em; margin-top: 1.5em; color: inherit; line-height: 1.3; }
        .document-editor-content h3 { font-size: 1.5em; font-weight: 600; margin-bottom: 0.5em; margin-top: 1.2em; color: inherit; line-height: 1.4; }
        .document-editor-content ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .document-editor-content ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        .document-editor-content li { margin-bottom: 0.5em; }
        .document-editor-content p { margin-bottom: 1em; }
        .document-editor-content b { font-weight: 700; }
        .document-editor-content i { font-style: italic; }
        .document-editor-content u { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 2px; }
        .document-editor-content strike { opacity: 0.6; }
        .document-editor-content table { width: 100%; border-collapse: collapse; margin: 1em 0; }
        .document-editor-content th, .document-editor-content td { border: 1px solid #555; padding: 8px; }
        .document-editor-content th { background-color: #2a303c; font-weight: bold; text-align: left; color: white; }
        .document-editor-content img { max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
      `}</style>
    </div>
  );
};
