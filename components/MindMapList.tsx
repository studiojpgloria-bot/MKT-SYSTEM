
import React, { useState } from 'react';
import { Plus, Trash2, Network, User as UserIcon, Calendar, FolderOpen, ArrowRight } from 'lucide-react';
import { MindMapDocument, User } from '../types';

interface MindMapListProps {
  mindMaps: MindMapDocument[];
  users: User[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  themeColor: string;
}

export const MindMapList: React.FC<MindMapListProps> = ({ 
  mindMaps, 
  users, 
  onCreate, 
  onOpen, 
  onDelete,
  themeColor 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMaps = mindMaps.filter(map => 
    map.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getThumbnailColor = (color: string) => {
      const colors: any = {
          orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
          cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600',
          indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
          purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
          emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
      };
      return colors[color] || colors.indigo;
  };

  return (
    <div className="space-y-8 p-8 h-full bg-[#0b0e11] text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Boards neste time</h1>
              <p className="text-sm text-gray-400 mt-1 font-light">Organize ideias e planeje estratégias visualmente.</p>
          </div>
          
          <div className="flex items-center gap-4">
              <input 
                  type="text" 
                  placeholder="Filtrar por nome..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#151a21] border border-[#2a303c] text-sm text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500 w-64"
              />
              <button 
                onClick={onCreate}
                className={`flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20`}
              >
                  <Plus size={18} />
                  Criar novo
              </button>
          </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMaps.map(map => {
              const author = users.find(u => u.id === map.authorId);
              const colorClass = getThumbnailColor(map.thumbnailColor);
              
              return (
                  <div 
                    key={map.id} 
                    onClick={() => onOpen(map.id)}
                    className="group bg-white dark:bg-[#151a21] rounded-2xl border border-gray-200 dark:border-[#2a303c] overflow-hidden hover:border-blue-500/50 cursor-pointer transition-all shadow-sm hover:shadow-xl flex flex-col h-[280px] relative"
                  >
                      {/* Visual Thumbnail */}
                      <div className={`h-32 ${colorClass} relative p-6 flex flex-col justify-between transition-colors`}>
                          <div className="flex justify-between items-start">
                              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                                  <Network size={24} />
                              </div>
                              <span className="px-2 py-1 bg-black/20 text-white text-[10px] font-bold rounded uppercase backdrop-blur-md">
                                  Somente Leitura
                              </span>
                          </div>
                          
                          {/* Folder Icon Style */}
                          <div className="absolute bottom-0 left-6 translate-y-1/2">
                              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-lg border-2 border-[#151a21]">
                                  <FolderOpen size={20} />
                              </div>
                          </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 pt-8 flex-1 flex flex-col justify-between">
                          <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-500 transition-colors">
                                  {map.title}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(map.updatedAt).toLocaleDateString()} • por {author?.name.split(' ')[0].toUpperCase() || 'DESCONHECIDO'}
                              </p>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#2a303c]">
                              <div className="flex -space-x-2">
                                  {author && (
                                      <img 
                                        src={author.avatar} 
                                        alt={author.name} 
                                        className="w-6 h-6 rounded-full border-2 border-[#151a21]" 
                                        title={author.name}
                                      />
                                  )}
                              </div>
                              
                              <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(confirm('Tem certeza de que deseja excluir este board?')) {
                                        onDelete(map.id);
                                    }
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      </div>
                  </div>
              );
          })}
      </div>
    </div>
  );
};
