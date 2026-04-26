import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Upload as UploadIcon, Video, Link as LinkIcon, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCanUpload } from '../hooks/useCanUpload';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export function UploadEpisode() {
  const { user } = useAuth();
  const { canUpload, loading: checkingUploadAccess } = useCanUpload();
  const navigate = useNavigate();
  const { showId } = useParams<{ showId: string }>();

  const [showTitle, setShowTitle] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState<number>(1);
  const [videoSource, setVideoSource] = useState<'file' | 'link'>('link');
  const [videoLink, setVideoLink] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!showId) return;
    const fetchShow = async () => {
      try {
        const d = await getDoc(doc(db, 'shows', showId));
        if (d.exists()) {
          setShowTitle(d.data().title);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShow();
  }, [showId]);

  if (checkingUploadAccess || loading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user || !canUpload) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-white/60 mb-6">Only administrators can upload content to this platform.</p>
        </div>
      </div>
    );
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showId) return;

    setError('');
    setIsUploading(true);
    setProgress(0);

    try {
      if (!title) {
        throw new Error('Title is required.');
      }

      let finalVideoUrl = videoLink;

      // Convert YouTube link to embed if necessary
      if (videoSource === 'link' && videoLink) {
        if (!videoLink.startsWith('http')) {
          finalVideoUrl = 'https://' + videoLink;
        }
        if (finalVideoUrl.includes('youtube.com/watch')) {
          const urlObj = new URL(finalVideoUrl);
          const v = urlObj.searchParams.get('v');
          if (v) finalVideoUrl = `https://www.youtube.com/embed/${v}`;
        } else if (finalVideoUrl.includes('youtu.be/')) {
          const v = finalVideoUrl.split('youtu.be/')[1]?.split('?')[0];
          if (v) finalVideoUrl = `https://www.youtube.com/embed/${v}`;
        }
      }

      // Upload Video if file
      if (videoSource === 'file' && videoFile) {
        try {
          finalVideoUrl = await new Promise<string>((resolve, reject) => {
            const url = `https://api.cloudinary.com/v1_1/dvwhm68lg/video/upload`;
            const xhr = new XMLHttpRequest();
            
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                setProgress((e.loaded / e.total) * 100);
              }
            };

            xhr.onload = () => {
              if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                resolve(response.secure_url);
              } else {
                let errorMsg = `Upload failed: ${xhr.statusText}`;
                try {
                  const response = JSON.parse(xhr.responseText);
                  if (response.error?.message) errorMsg = response.error.message;
                } catch (e) {}
                reject(new Error(errorMsg));
              }
            };

            xhr.onerror = () => reject(new Error("Network error during upload"));

            xhr.open("POST", url, true);
            const formData = new FormData();
            formData.append("file", videoFile);
            formData.append("upload_preset", "Vedio_Uplod");
            xhr.send(formData);
          });
        } catch (err: any) {
          console.error("Video upload failed:", err);
          throw new Error(err.message || "Failed to upload video to Cloudinary.");
        }
      }

      const episodeId = `ep_${Date.now()}`;
      
      const newEpisode = {
        id: episodeId,
        title,
        description,
        videoUrl: finalVideoUrl,
        episodeNumber,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'shows', showId, 'episodes', episodeId), newEpisode);

      // Create notification for users tracking this show
      const notifId = `notif_${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        title: `New Episode for ${showTitle || 'a show'}`,
        message: `Episode ${episodeNumber}: ${title} is out now.`,
        target: 'all',
        type: 'NewEpisode',
        showId: showId,
        link: `/player/${showId}?ep=${episodeId}`,
        createdAt: new Date().toISOString()
      });

      navigate(`/details/${showId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during upload.');
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen pt-28 pb-20 px-6 max-w-3xl mx-auto"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Show
      </button>
      <div className="glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Video className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Add Episode</h1>
            <p className="text-white/50 text-sm">For Series: {showTitle}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-white/70 mb-1.5">Episode No.</label>
              <input 
                type="number" 
                min="1"
                required
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none transition-colors"
                placeholder="1"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-white/70 mb-1.5">Episode Title</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none transition-colors"
                placeholder="Pilot"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Description (Optional)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none transition-colors resize-none"
              placeholder="What happens in this episode?"
            />
          </div>

          <div className="h-px bg-white/10 my-8" />

          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">Video Source</label>
            <div className="flex gap-4 mb-4">
              <button 
                type="button"
                onClick={() => setVideoSource('link')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${videoSource === 'link' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'}`}
              >
                <LinkIcon className="w-4 h-4" /> YouTube / Embed Link
              </button>
              <button 
                type="button"
                onClick={() => setVideoSource('file')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${videoSource === 'file' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'}`}
              >
                <Video className="w-4 h-4" /> Upload Video File
              </button>
            </div>

            {videoSource === 'link' ? (
              <input 
                type="url" 
                required
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none transition-colors"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            ) : (
              <input 
                type="file" 
                required
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-400 hover:file:bg-purple-500/30"
              />
            )}
          </div>

          {isUploading && videoSource === 'file' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1 text-white/70">
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={isUploading}
            className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-8"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <UploadIcon className="w-5 h-5" />
                Publish Episode
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
