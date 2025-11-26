import React, { useState } from 'react';
import { Client } from '../types';
import { Plus, MoreVertical, Edit, Trash2, X, Building, Search, Mail, User } from 'lucide-react';

type ClientFormData = Omit<Client, 'id' | 'creator_id'>;

interface ClientManagementProps {
  clients: Client[];
  onAddClient: (clientData: ClientFormData) => void;
  onUpdateClient: (clientId: string, clientData: ClientFormData) => void;
  onDeleteClient: (clientId: string) => void;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({ clients, onAddClient, onUpdateClient, onDeleteClient }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    logo_url: '',
    contact_person: '',
    contact_email: '',
    status: 'active',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const openModalForCreate = () => {
    setEditingClient(null);
    setFormData({ name: '', logo_url: '', contact_person: '', contact_email: '', status: 'active' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      logo_url: client.logo_url || '',
      contact_person: client.contact_person || '',
      contact_email: client.contact_email || '',
      status: client.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      onUpdateClient(editingClient.id, formData);
    } else {
      onAddClient(formData);
    }
    setIsModalOpen(false);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.contact_person || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-500">View, add, and edit your clients.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={openModalForCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 group relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden">
                  {client.logo_url ? (
                    <img src={client.logo_url} alt={client.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building size={20} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{client.name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    client.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {client.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <User size={14} />
                <span>{client.contact_person || 'No contact person'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Mail size={14} />
                <span>{client.contact_email || 'No contact email'}</span>
              </div>
            </div>
            <div className="absolute top-4 right-4">
                <button onClick={() => openModalForEdit(client)} className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                    <Edit size={16} />
                </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-900">{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-500" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleFormChange} required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Person</label>
                        <input type="text" name="contact_person" value={formData.contact_person} onChange={handleFormChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Email</label>
                        <input type="email" name="contact_email" value={formData.contact_email} onChange={handleFormChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                    </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logo URL</label>
                  <input type="text" name="logo_url" value={formData.logo_url} onChange={handleFormChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleFormChange} className="w-full p-3 border border-gray-200 rounded-lg text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="p-4 bg-gray-50 flex justify-end items-center gap-3">
                {editingClient && (
                    <button type="button" onClick={() => {
                        if (confirm('Are you sure you want to delete this client?')) {
                            onDeleteClient(editingClient.id);
                            setIsModalOpen(false);
                        }
                    }} className="text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg">
                        Delete Client
                    </button>
                )}
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-sm font-bold text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};