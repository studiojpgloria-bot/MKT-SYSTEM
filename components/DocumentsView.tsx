
import React from 'react';
import { Document, User } from '../types';
import { Plus, FileText, Search, MoreVertical, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';

interface DocumentsViewProps {
  documents: Document[];
  users: User[];
  onCreate: () => void;
  onEdit: (doc: Document) => void;
  onDelete: (id: string) => void;
  themeColor: string;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ 
  documents, 
  users, 
  onCreate, 
  onEdit, 
  onDelete, 
  themeColor 
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeLabel = (type: string) => {
      switch(type) {
          case 'meeting': return 'Ata de Reunião';
          case 'project': return 'Projeto';
          case 'briefing': return 'Briefing';
          default: return 'Geral';
      }
  };

  const getTypeColor = (type: string) => {
      switch(type) {
          case 'meeting': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
          case 'project': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
          case 'briefing': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
          default: return 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300';
      }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Documentos</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-light">Gerencie atas, briefings e notas de projetos.</p>
          </div>
          <button 
            onClick={onCreate}
            className={`flex items-center gap-2 px-5 py-2.5 bg-${themeColor}-600 text-white rounded-full text-sm font-medium hover:bg-${themeColor}-700 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]`}
          >
              <Plus size={18} />
              Novo Documento
          </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
              type="text" 
              placeholder="Buscar documentos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#151a21] border border-gray-200 dark:border-[#2a303c] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-[#3b82f6] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
          />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDocs.map(doc => {
              const author = users.find(u => u.id === doc.authorId);
              return (
                  <div key={doc.id} className="group bg-white dark:bg-[#151a21] rounded-2xl border border-gray-200 dark:border-[#2a303c] overflow-hidden hover:border-[#3b82f6]/50 transition-all shadow-sm hover:shadow-lg flex flex-col h-[280px]">
                      {/* Cover Area */}
                      <div className={`h-24 relative bg-gray-100 dark:bg-gray-800`}>
                          {doc.coverImage ? (
                              <img src={doc.coverImage} alt="Cover" className="w-full h-full object-cover opacity-80" />
                          ) : (
                              <div className={`w-full h-full opacity-20 bg-gradient-to-tr from-${themeColor}-100 to-gray-200 dark:from-${themeColor}-900 dark:to-gray-900`}></div>
                          )}
                          <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-lg bg-white dark:bg-[#151a21] border border-gray-200 dark:border-[#2a303c] flex items-center justify-center text-2xl shadow-sm">
                              {doc.emoji || <FileText size={24} className="text-gray-400 dark:text-gray-500"/>}
                          </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 pt-8 flex-1 flex flex-col">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-[#3b82f6] transition-colors cursor-pointer" onClick={() => onEdit(doc)}>
                              {doc.title}
                          </h3>
                          
                          <div className="flex items-center gap-2 mb-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${getTypeColor(doc.type)}`}>
                                  {getTypeLabel(doc.type)}
                              </span>
                          </div>

                          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-[#2a303c] flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                  {author && <img src={author.avatar} className="w-5 h-5 rounded-full" alt="author"/>}
                                  <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => onEdit(doc)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2a303c] rounded text-gray-400 hover:text-gray-900 dark:hover:text-white"><Edit2 size={14}/></button>
                                  <button onClick={() => onDelete(doc.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2a303c] rounded text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                              </div>
                          </div>
                      </div>
                  </div>
              );
          })}

          {/* Empty State */}
          {filteredDocs.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 dark:border-[#2a303c] rounded-2xl bg-gray-50 dark:bg-[#151a21]/30">
                  <FileText size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhum documento encontrado</h3>
                  <p className="text-sm text-gray-500">Crie um novo documento para começar.</p>
              </div>
          )}
      </div>
    </div>
  );
};
