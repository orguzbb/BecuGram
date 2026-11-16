import React, { useState, useEffect } from 'react';
import { Phone, Video, Search, ArrowLeft, PhoneCall, PhoneIncoming, PhoneOutgoing, UserPlus } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Contact, User } from '../../types';

interface CallsViewProps {
  onBack: () => void;
  onStartCall: (user: User, type: 'audio' | 'video') => void;
}

export const CallsView: React.FC<CallsViewProps> = ({ onBack, onStartCall }) => {
  const { user: currentUser } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getContacts()
      .then((c) => setContacts(c))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = contacts.filter((c) => {
    const name = c.customName || c.user?.displayName || '';
    const phone = c.user?.phoneNumber || '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || phone.includes(q);
  });

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#212121] text-zinc-900 dark:text-white select-none">
      {/* Header */}
      <div className="h-14 px-4 bg-white dark:bg-[#212121] border-b border-[#DADCE0] dark:border-[#303030] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Qo‘ng‘iroqlar</h2>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2 border-b border-[#DADCE0]/50 dark:border-[#303030]/50 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#707579] dark:text-[#AAAAAA]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kontaktlarni qidirish..."
            className="w-full pl-9 pr-4 py-2 bg-[#F4F4F5] dark:bg-[#181818] border border-transparent focus:border-[#3390EC] dark:focus:border-[#8774E1] rounded-full text-xs text-zinc-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Call Contacts List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#DADCE0]/40 dark:divide-[#303030]/40">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#707579] dark:text-[#AAAAAA]">
            Kontaktlar yuklanmoqda...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#707579] dark:text-[#AAAAAA] space-y-2">
            <Phone className="w-8 h-8 mx-auto opacity-30 text-[#3390EC]" />
            <p>Hech qanday kontakt topilmadi</p>
          </div>
        ) : (
          filtered.map((c) => {
            const u = c.user || {
              _id: c._id,
              displayName: c.customName || 'Kontakt',
              phoneNumber: '',
              username: '',
              isOnline: false,
              isVerified: false,
              createdAt: '',
            };

            return (
              <div
                key={c._id}
                className="px-4 py-3 flex items-center justify-between hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.displayName} src={u.avatar} size="md" isOnline={u.isOnline} />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold truncate text-zinc-900 dark:text-white">
                      {u.displayName}
                    </h4>
                    <span className="text-[11px] text-[#707579] dark:text-[#AAAAAA] truncate block">
                      {u.phoneNumber || `@${u.username || 'user'}`}
                    </span>
                  </div>
                </div>

                {/* Call buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onStartCall(u as User, 'audio')}
                    className="p-2.5 rounded-full hover:bg-emerald-500/10 text-emerald-500 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="Audio qo‘ng‘iroq"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onStartCall(u as User, 'video')}
                    className="p-2.5 rounded-full hover:bg-[#3390EC]/10 text-[#3390EC] dark:text-[#8774E1] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="Video qo‘ng‘iroq"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
