import React, { useState, useRef, useEffect } from 'react';
import { Camera, Save, User, Mail } from 'lucide-react';
import { User as UserType } from '../types';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  onUpdateProfile: (updatedUser: Partial<UserType>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setAvatar(currentUser.avatar);
    }
  }, [isOpen, currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      email,
      avatar
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Perfil"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-[#2a303c] shadow-lg">
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={24} />
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Clique para alterar foto</p>
        </div>

        <div className="space-y-4">
          <Input
            label="Nome Completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            icon={<User size={18} />}
          />

          <Input
            label="Endereço de Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@empresa.com"
            icon={<Mail size={18} />}
          />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            fullWidth
            leftIcon={<Save size={18} />}
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
};
