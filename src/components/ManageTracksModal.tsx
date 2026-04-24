import { useState } from 'react';
import { Show, Episode, AudioTrack, SubtitleTrack } from '../types';
import { X, Plus, Trash2, Save, UploadCloud } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ManageTracksModalProps {
  show: Show;
  episode?: Episode; // If episode is provided, we edit episode tracks, else show tracks
  onClose: () => void;
  onSuccess: () => void;
}

export function ManageTracksModal({ show, episode, onClose, onSuccess }: ManageTracksModalProps) {
  const [dubs, setDubs] = useState<AudioTrack[]>(
    (episode ? episode.dubs : show.dubs) || []
  );
  const [subs, setSubs] = useState<SubtitleTrack[]>(
    (episode ? episode.subs : show.subs) || []
  );
  const [saving, setSaving] = useState(false);

  const [newDubLang, setNewDubLang] = useState('');
  const [newDubUrl, setNewDubUrl] = useState('');
  
  const [newSubLang, setNewSubLang] = useState('');
  const [newSubUrl, setNewSubUrl] = useState('');

  const handleAddDub = () => {
    if (!newDubLang || !newDubUrl) return;
    setDubs([...dubs, { language: newDubLang, url: newDubUrl }]);
    setNewDubLang('');
    setNewDubUrl('');
  };

  const handleAddSub = () => {
    if (!newSubLang || !newSubUrl) return;
    setSubs([...subs, { language: newSubLang, url: newSubUrl }]);
    setNewSubLang('');
    setNewSubUrl('');
  };

  const handleRemoveDub = (index: number) => {
    setDubs(dubs.filter((_, i) => i !== index));
  };

  const handleRemoveSub = (index: number) => {
    setSubs(subs.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (episode) {
        await updateDoc(doc(db, 'shows', show.id, 'episodes', episode.id), {
          dubs,
          subs,
        });
      } else {
        await updateDoc(doc(db, 'shows', show.id), {
          dubs,
          subs,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Failed to save tracks: ' + (err.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            Manage Dubs & Subs - {episode ? `Ep ${episode.episodeNumber}` : show.title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Audio Tracks (Dubs) */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-white/10 pb-2">Audio Tracks (Dubs)</h3>
            
            {dubs.length > 0 ? (
              <div className="space-y-2">
                {dubs.map((dub, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{dub.language}</p>
                      <p className="text-xs text-white/50 truncate" title={dub.url}>{dub.url}</p>
                    </div>
                    <button onClick={() => handleRemoveDub(i)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No additional audio tracks.</p>
            )}

            <div className="flex gap-2 items-start mt-4">
              <input 
                type="text" 
                placeholder="Language (e.g. English, Japanese)" 
                value={newDubLang}
                onChange={e => setNewDubLang(e.target.value)}
                className="w-1/3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm"
              />
              <input 
                type="url" 
                placeholder="Video/Audio File URL (mp4, m3u8)" 
                value={newDubUrl}
                onChange={e => setNewDubUrl(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm"
              />
              <button 
                onClick={handleAddDub}
                disabled={!newDubLang || !newDubUrl}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subtitles (Subs) */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-white/10 pb-2">Subtitles (.vtt files)</h3>
            
            {subs.length > 0 ? (
              <div className="space-y-2">
                {subs.map((sub, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{sub.language}</p>
                      <p className="text-xs text-white/50 truncate" title={sub.url}>{sub.url}</p>
                    </div>
                    <button onClick={() => handleRemoveSub(i)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No subtitle tracks.</p>
            )}

            <div className="flex gap-2 items-start mt-4">
              <input 
                type="text" 
                placeholder="Language (e.g. English)" 
                value={newSubLang}
                onChange={e => setNewSubLang(e.target.value)}
                className="w-1/3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm"
              />
              <input 
                type="url" 
                placeholder="Subtitle File URL (.vtt)" 
                value={newSubUrl}
                onChange={e => setNewSubUrl(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm"
              />
              <button 
                onClick={handleAddSub}
                disabled={!newSubLang || !newSubUrl}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-white/40">Note: For subtitles, you can provide a direct link to a .vtt file. Ensure the server allows CORS.</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
