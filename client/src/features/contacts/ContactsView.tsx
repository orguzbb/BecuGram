import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, Plus, Share2, Compass, MessageSquare } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { api } from '../../services/api';
import { Contact, Group } from '../../types';
import { useToast } from '../../components/Toast';
import { AddContactModal } from '../../components/AddContactModal';
import { CreateGroupModal } from '../../components/CreateGroupModal';

interface ContactsViewProps {
  onSelectUserToChat: (userId: string) => void;
  onOpenGroupChat?: (conversationId: string) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  onSelectUserToChat,
  onOpenGroupChat,
}) => {
  const { showToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [communities, setCommunities] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  const loadData = async () => {
    try {
      const [contactsData, groupsData] = await Promise.all([
        api.getContacts(),
        api.getGroups(),
      ]);
      setContacts(contactsData);
      setGroups(groupsData.myGroups);
      setCommunities(groupsData.communities);
    } catch (err) {
      console.error('Failed to load contacts/groups:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInviteFriends = () => {
    const inviteLink = 'https://t.me/becugrambot';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink);
      showToast('Taklif havolasi nusxalandi! Do\'stlaringizga yuboring.', 'success');
    } else {
      showToast('Havola: ' + inviteLink, 'info');
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.customName.toLowerCase().includes(q) ||
      c.user.username.toLowerCase().includes(q) ||
      (c.user.phoneNumber && c.user.phoneNumber.includes(q))
    );
  });

  // Group contacts by first letter
  const groupedContacts: Record<string, Contact[]> = {};
  filteredContacts.forEach((c) => {
    const letter = (c.customName[0] || '#').toUpperCase();
    if (!groupedContacts[letter]) groupedContacts[letter] = [];
    groupedContacts[letter].push(c);
  });

  const alphabet = Object.keys(groupedContacts).sort();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0E1715] select-none text-zinc-900 dark:text-[#EDF4F1] border-r border-zinc-200 dark:border-[#1B2A25] overflow-y-auto pb-20 sm:pb-6 relative">
      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={(convId) => {
            loadData();
            if (convId && onOpenGroupChat) {
              onOpenGroupChat(convId);
            }
          }}
        />
      )}

      {/* Top Header & Search matching Screen 04 */}
      <div className="p-4 sm:p-5 pb-2">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">Contacts & Communities</h2>

        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-[#8DA39A]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Contacts & Communities"
            className="w-full bg-zinc-100 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] rounded-full pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-[#8DA39A] focus:outline-none focus:border-emerald-500 dark:focus:border-cyan-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="px-4 sm:px-5 space-y-6">
        {/* SHORTCUTS Section matching Screen 04 */}
        <div>
          <h3 className="text-xs font-bold text-zinc-500 dark:text-[#8DA39A] uppercase tracking-wider mb-2.5">
            Shortcuts
          </h3>
          <div className="space-y-1.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] hover:bg-zinc-100 dark:hover:bg-[#1A2E26] hover:border-emerald-500/30 dark:hover:border-cyan-500/30 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <UserPlus className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">Add Contact</span>
            </button>

            <button
              onClick={handleInviteFriends}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] hover:bg-zinc-100 dark:hover:bg-[#1A2E26] hover:border-pink-500/30 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">Invite Friends</span>
            </button>
          </div>
        </div>

        {/* MY CONTACTS Section with Alphabetical Index matching Screen 04 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-[#8DA39A] uppercase tracking-wider">
              My Contacts ({filteredContacts.length})
            </h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs text-emerald-600 dark:text-cyan-400 font-semibold hover:underline"
            >
              + Add
            </button>
          </div>

          {filteredContacts.length === 0 ? (
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] text-center text-xs text-zinc-500 dark:text-[#8DA39A]">
              <p className="mb-2">Hozircha kontaktlar saqlanmagan</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-transform"
              >
                + Kontakt qo'shish
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {alphabet.map((letter) => (
                <div key={letter}>
                  <div className="text-xs font-bold text-emerald-600 dark:text-cyan-400 px-1 mb-1.5">{letter}</div>
                  <div className="space-y-1">
                    {groupedContacts[letter].map((contact) => (
                      <div
                        key={contact._id}
                        onClick={() => onSelectUserToChat(contact.user._id)}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-[#14231E] border border-transparent hover:border-zinc-200 dark:hover:border-[#20362E] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            name={contact.customName}
                            src={contact.user.avatar}
                            size="md"
                            isOnline={contact.user.isOnline}
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                              {contact.customName}
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-[#8DA39A] truncate">
                              {contact.user.phoneNumber || `@${contact.user.username}`}
                            </p>
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-zinc-100 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-[#15231F] dark:text-cyan-400 dark:hover:bg-cyan-500 dark:hover:text-black flex items-center justify-center transition-colors shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COMMUNITIES & GROUPS Section matching Screen 04 */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-[#8DA39A] uppercase tracking-wider">
              Communities & Groups
            </h3>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="text-xs text-pink-500 dark:text-pink-400 font-semibold hover:underline"
            >
              + Create
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {groups.length === 0 && communities.length === 0 ? (
              <div className="col-span-2 p-5 rounded-2xl bg-zinc-50 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] text-center text-xs text-zinc-500 dark:text-[#8DA39A]">
                <p className="mb-2">Hali guruhlar yo'q</p>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="text-pink-500 dark:text-pink-400 font-bold hover:underline"
                >
                  + Birinchi guruhni yarating
                </button>
              </div>
            ) : (
              [...groups, ...communities].map((group) => (
                <div
                  key={group._id}
                  onClick={() => onOpenGroupChat && onOpenGroupChat(`conv_${group._id}`)}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] hover:border-pink-500/40 hover:bg-zinc-100 dark:hover:bg-[#192B25] cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={group.name} src={group.avatar} size="sm" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">{group.name}</h4>
                      <p className="text-[10px] text-zinc-500 dark:text-[#8DA39A]">
                        {group.memberCount} a'zo
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-[#5D736A] truncate">
                    {group.description || 'Guruh suhbati'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Create Community Full-width Button */}
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="w-full mt-3 py-3 rounded-2xl bg-zinc-50 dark:bg-[#14231E] border border-emerald-500/30 dark:border-cyan-500/30 hover:border-emerald-500/60 dark:hover:border-cyan-500/60 hover:bg-zinc-100 dark:hover:bg-[#182C25] text-emerald-700 dark:text-cyan-400 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Community
          </button>
        </div>
      </div>
    </div>
  );
};
