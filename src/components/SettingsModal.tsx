import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Bell, Shield, CreditCard, Monitor, HelpCircle, Check, ToggleLeft, ToggleRight, Users, Trash2, Plus, Loader2 } from 'lucide-react';
import { getUserSettings, saveUserSettings } from '../utils/userSettings';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useCanUpload } from '../hooks/useCanUpload';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'account' | 'preferences' | 'notifications' | 'privacy' | 'billing' | 'help' | 'uploaders';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [settings, setSettings] = useState(getUserSettings());
  const { clearHistory } = useWatchHistory();
  const { isSuperAdmin } = useCanUpload();

  const [uploaders, setUploaders] = useState<{email: string, addedAt: string}[]>([]);
  const [newUploaderEmail, setNewUploaderEmail] = useState('');
  const [isManagingUploaders, setIsManagingUploaders] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getUserSettings());
      if (isSuperAdmin) {
        loadUploaders();
      }
    }
  }, [isOpen, isSuperAdmin]);

  const loadUploaders = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'allowedUploaders'));
      const list = snapshot.docs.map(doc => ({
        email: doc.id,
        addedAt: doc.data().addedAt
      }));
      setUploaders(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddUploader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUploaderEmail || !user?.email) return;
    setIsManagingUploaders(true);
    try {
      const email = newUploaderEmail.toLowerCase().trim();
      await setDoc(doc(db, 'allowedUploaders', email), {
        addedAt: new Date().toISOString(),
        addedBy: user.email
      });
      setNewUploaderEmail('');
      await loadUploaders();
    } catch (e) {
      console.error(e);
      alert('Failed to add uploader');
    } finally {
      setIsManagingUploaders(false);
    }
  };

  const handleRemoveUploader = async (email: string) => {
    if (!confirm(`Remove upload access for ${email}?`)) return;
    setIsManagingUploaders(true);
    try {
      await deleteDoc(doc(db, 'allowedUploaders', email));
      await loadUploaders();
    } catch (e) {
      console.error(e);
      alert('Failed to remove uploader');
    } finally {
      setIsManagingUploaders(false);
    }
  };

  const handleSave = () => {
    saveUserSettings(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] max-h-[800px]"
        >
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-white/5 border-r border-white/10 p-6 flex-shrink-0 flex flex-col">
            <h2 className="text-xl font-bold mb-8">Settings</h2>
            
            <nav className="space-y-2 flex-1 overflow-y-auto scrollbar-hide">
              <button 
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'account' ? 'bg-purple-500/20 text-purple-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
              >
                <User className="w-5 h-5" /> Account
              </button>
              <button 
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'preferences' ? 'bg-purple-500/20 text-purple-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
              >
                <Monitor className="w-5 h-5" /> Preferences
              </button>
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'notifications' ? 'bg-purple-500/20 text-purple-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
              >
                <Bell className="w-5 h-5" /> Notifications
              </button>
              <button 
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'privacy' ? 'bg-purple-500/20 text-purple-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
              >
                <Shield className="w-5 h-5" /> Privacy & Safety
              </button>
              <button 
                onClick={() => setActiveTab('billing')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'billing' ? 'bg-purple-500/20 text-purple-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
              >
                <CreditCard className="w-5 h-5" /> Billing
              </button>
              
              {isSuperAdmin && (
                <div className="pt-4 mt-4 border-t border-white/10">
                  <button 
                    onClick={() => setActiveTab('uploaders')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'uploaders' ? 'bg-purple-500/20 text-purple-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                  >
                    <Users className="w-5 h-5" /> Manage Uploaders
                  </button>
                </div>
              )}

              <div className="pt-4 mt-4 border-t border-white/10">
                <button 
                  onClick={() => setActiveTab('help')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'help' ? 'bg-purple-500/20 text-purple-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                >
                  <HelpCircle className="w-5 h-5" /> Help & Support
                </button>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 overflow-y-auto scrollbar-hide relative">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-w-xl">
              {activeTab === 'account' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold mb-6">Account Settings</h3>
                  
                  {/* Profile Section */}
                  <div className="mb-10">
                    <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Profile</h4>
                    <div className="flex items-center gap-6 mb-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
                        {settings.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                          Change Avatar
                        </button>
                        <p className="text-xs text-white/40 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1.5">Display Name</label>
                        <input 
                          type="text" 
                          value={settings.displayName}
                          onChange={(e) => setSettings({...settings, displayName: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-purple-500/50 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1.5">Email Address</label>
                        <input 
                          type="email" 
                          value={settings.email}
                          onChange={(e) => setSettings({...settings, email: e.target.value})}
                          placeholder="Enter your email"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-purple-500/50 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subscription Section */}
                  <div className="mb-10">
                    <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Subscription</h4>
                    <div className="bg-gradient-to-br from-white/5 to-white/5 border border-white/10 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h5 className="font-bold text-lg text-white">Free Plan</h5>
                          <p className="text-sm text-white/60 mt-1">Upgrade to Premium for more features.</p>
                        </div>
                        <span className="px-3 py-1 bg-white/10 text-white/60 text-xs font-bold rounded-full">ACTIVE</span>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors">
                          Upgrade to Premium
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div>
                    <h4 className="text-sm font-medium text-red-500/50 uppercase tracking-wider mb-4">Danger Zone</h4>
                    <div className="border border-red-500/20 rounded-xl p-6">
                      <h5 className="font-bold text-white mb-1">Delete Account</h5>
                      <p className="text-sm text-white/60 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                      <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-3">
                    <button 
                      onClick={onClose}
                      className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    >
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'uploaders' && isSuperAdmin && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold mb-6">Manage Uploaders</h3>
                  <p className="text-white/60 mb-8">Grant or revoke upload access for other users by entering their Google email address.</p>
                  
                  <form onSubmit={handleAddUploader} className="mb-8 flex gap-3">
                    <input 
                      type="email" 
                      required
                      value={newUploaderEmail}
                      onChange={(e) => setNewUploaderEmail(e.target.value)}
                      placeholder="Enter user's email address"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-purple-500/50 outline-none transition-colors"
                    />
                    <button 
                      type="submit"
                      disabled={isManagingUploaders}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isManagingUploaders ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Grant Access
                    </button>
                  </form>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Current Uploaders</h4>
                    
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                      <div>
                        <p className="font-medium text-white">simplynoone.writer@gmail.com</p>
                        <p className="text-xs text-white/50">Super Admin</p>
                      </div>
                      <span className="text-xs font-bold text-purple-400 bg-purple-500/20 px-2 py-1 rounded">OWNER</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                      <div>
                        <p className="font-medium text-white">pratham.tyagi369@gmail.com</p>
                        <p className="text-xs text-white/50">Super Admin</p>
                      </div>
                      <span className="text-xs font-bold text-purple-400 bg-purple-500/20 px-2 py-1 rounded">OWNER</span>
                    </div>

                    {uploaders.map((u) => (
                      <div key={u.email} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <div>
                          <p className="font-medium text-white">{u.email}</p>
                          <p className="text-xs text-white/50">Added on {new Date(u.addedAt).toLocaleDateString()}</p>
                        </div>
                        <button 
                          onClick={() => handleRemoveUploader(u.email)}
                          disabled={isManagingUploaders}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Revoke Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {uploaders.length === 0 && (
                      <p className="text-sm text-white/40 text-center py-4">No additional uploaders added.</p>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'preferences' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold mb-6">Playback Preferences</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                      <div>
                        <h5 className="font-bold text-white mb-1">Autoplay Next Episode</h5>
                        <p className="text-sm text-white/60">Automatically start the next episode when the current one ends.</p>
                      </div>
                      <button onClick={() => setSettings({...settings, autoplay: !settings.autoplay})} className="text-purple-400">
                        {settings.autoplay ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-white/40" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                      <div>
                        <h5 className="font-bold text-white mb-1">High Quality Streaming</h5>
                        <p className="text-sm text-white/60">Always stream in the highest available quality (uses more data).</p>
                      </div>
                      <button onClick={() => setSettings({...settings, highQuality: !settings.highQuality})} className="text-purple-400">
                        {settings.highQuality ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-white/40" />}
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Default Subtitle Language</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none appearance-none">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="jp">Japanese</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                    <button 
                      onClick={handleSave}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    >
                      Save Preferences
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold mb-6">Notification Settings</h3>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'notifyNewEpisodes', title: "New Episodes", desc: "Get notified when new episodes of your watchlist air." },
                      { id: 'notifyRecommendations', title: "Recommendations", desc: "Receive personalized show recommendations." },
                      { id: 'notifyAccountUpdates', title: "Account Updates", desc: "Important security and billing updates." },
                      { id: 'notifyMarketing', title: "Marketing", desc: "Special offers and promotions." }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <div>
                          <h5 className="font-bold text-white mb-1">{item.title}</h5>
                          <p className="text-sm text-white/60">{item.desc}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSettings({...settings, [item.id]: !settings[item.id as keyof typeof settings]})}
                            className={`p-2 rounded-lg border transition-colors ${settings[item.id as keyof typeof settings] ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-white/5 text-white/40 border-white/10'}`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                    <button 
                      onClick={handleSave}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    >
                      Save Notifications
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold mb-6">Privacy & Safety</h3>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                      <h5 className="font-bold text-white mb-2">Watch History</h5>
                      <p className="text-sm text-white/60 mb-4">Your watch history is used to improve recommendations and allow you to continue watching where you left off.</p>
                      <button 
                        onClick={() => {
                          clearHistory();
                          alert('Watch history cleared successfully.');
                        }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Clear Watch History
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-xl border border-white/10">
                      <div className="pr-8">
                        <h5 className="font-bold text-white mb-2">Data Collection</h5>
                        <p className="text-sm text-white/60">Allow us to collect usage data to improve your experience and provide personalized recommendations.</p>
                      </div>
                      <button onClick={() => setSettings({...settings, dataCollection: !settings.dataCollection})} className="text-purple-400 flex-shrink-0">
                        {settings.dataCollection ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-white/40" />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                    <button 
                      onClick={handleSave}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    >
                      Save Privacy Settings
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'billing' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold mb-6">Billing & Payments</h3>
                  
                  <div className="p-6 bg-white/5 rounded-xl border border-white/10 mb-6">
                    <h5 className="font-bold text-white mb-4">Payment Method</h5>
                    <div className="flex items-center gap-4 p-4 bg-black/20 rounded-lg border border-white/5">
                      <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white/50" />
                      </div>
                      <div>
                        <p className="font-medium text-white">No payment method added</p>
                        <p className="text-xs text-white/50">Add a card to upgrade to Premium</p>
                      </div>
                      <button className="ml-auto text-sm text-purple-400 hover:text-purple-300 font-medium">Add</button>
                    </div>
                  </div>

                  <h5 className="font-bold text-white mb-4">Billing History</h5>
                  <div className="p-8 bg-white/5 rounded-xl border border-white/10 text-center">
                    <p className="text-white/50">No billing history available.</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'help' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold mb-6">Help & Support</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <button className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left transition-colors">
                      <h5 className="font-bold text-white mb-2">FAQ</h5>
                      <p className="text-sm text-white/60">Find answers to common questions.</p>
                    </button>
                    <button className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-left transition-colors">
                      <h5 className="font-bold text-white mb-2">Contact Us</h5>
                      <p className="text-sm text-white/60">Get in touch with our support team.</p>
                    </button>
                  </div>

                  <div className="p-6 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <h5 className="font-bold text-purple-300 mb-2">System Status</h5>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-white/80">All systems operational</span>
                    </div>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
