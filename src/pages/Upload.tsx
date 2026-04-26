import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Upload as UploadIcon, Video, Link as LinkIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCanUpload } from '../hooks/useCanUpload';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export function Upload() {
  const { user } = useAuth();
  const { canUpload, loading: checkingUploadAccess } = useCanUpload();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Movie' | 'Series' | 'Shorts' | 'Music'>('Movie');
  const [tier, setTier] = useState<'Free' | 'Premium'>('Free');
  const [tags, setTags] = useState<string[]>([]);
  const [videoSource, setVideoSource] = useState<'file' | 'link'>('link');
  const [videoLink, setVideoLink] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLink, setImageLink] = useState('');
  const [imageSource, setImageSource] = useState<'file' | 'link'>('link');

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  if (checkingUploadAccess) {
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
    setError('');
    setIsUploading(true);
    setProgress(0);

    try {
      if (!title || !description) {
        throw new Error('Title and description are required.');
      }

      let finalVideoUrl = videoLink;
      let finalImageUrl = imageLink;

      // Convert YouTube link to embed if necessary
      let ytId = '';
      if (videoSource === 'link' && videoLink) {
        if (!videoLink.startsWith('http')) {
          finalVideoUrl = 'https://' + videoLink;
        }
        if (finalVideoUrl.includes('youtube.com/watch')) {
          const urlObj = new URL(finalVideoUrl);
          const v = urlObj.searchParams.get('v');
          if (v) {
            ytId = v;
            finalVideoUrl = `https://www.youtube.com/embed/${v}`;
          }
        } else if (finalVideoUrl.includes('youtu.be/')) {
          const v = finalVideoUrl.split('youtu.be/')[1]?.split('?')[0];
          if (v) {
            ytId = v;
            finalVideoUrl = `https://www.youtube.com/embed/${v}`;
          }
        }
      }

      // Upload Image if file
      if (imageSource === 'file' && imageFile) {
        try {
          const url = `https://api.cloudinary.com/v1_1/dvwhm68lg/image/upload`;
          const formData = new FormData();
          formData.append("file", imageFile);
          formData.append("upload_preset", "Vedio_Uplod");
          const res = await fetch(url, { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || "Image upload failed");
          finalImageUrl = data.secure_url;
        } catch (err: any) {
          console.error("Image upload failed:", err);
          throw new Error(err.message || "Failed to upload image to Cloudinary.");
        }
      } else if (!finalImageUrl && ytId) {
        finalImageUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
      } else if (!finalImageUrl) {
        // Fallback image
        finalImageUrl = `https://picsum.photos/seed/${encodeURIComponent(title)}/800/450`;
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

      const showId = `show_${Date.now()}`;
      
      const newShow = {
        id: showId,
        title,
        description,
        imageUrl: finalImageUrl,
        bannerUrl: finalImageUrl,
        type,
        tier,
        tags,
        meta: new Date().getFullYear().toString(),
        videoUrl: finalVideoUrl,
        authorId: user.uid,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'shows', showId), newShow);

      // Automatically create Episode 1 if it's a Series and has a video
      if (type === 'Series' && finalVideoUrl) {
        const episodeId = `ep_${Date.now()}`;
        const newEpisode = {
          id: episodeId,
          title: "Episode 1",
          description: "Pilot",
          videoUrl: finalVideoUrl,
          episodeNumber: 1,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'shows', showId, 'episodes', episodeId), newEpisode);
      }

      // Create notification
      const notifId = `notif_${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        title: `New Release: ${title}`,
        message: `Watch "${title}" now!`,
        target: 'all',
        type: 'System',
        showId: showId,
        link: `/details/${showId}`,
        createdAt: new Date().toISOString()
      });

      navigate(`/player/${showId}`);
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
      <div className="glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <UploadIcon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Upload Content</h1>
            <p className="text-white/50 text-sm">Add a new show or video to the platform</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Title</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none transition-colors"
                placeholder="Enter show title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none transition-colors resize-none"
                placeholder="What is this show about?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none appearance-none"
                >
                  <option value="Movie">Movie</option>
                  <option value="Series">Series</option>
                  <option value="Shorts">Shorts</option>
                  <option value="Music">Music</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Access Tier</label>
                <select 
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none appearance-none"
                >
                  <option value="Free">Free (All Users)</option>
                  <option value="Premium">Premium / Casual Only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Sub Categories / Tags</label>
                <div className="flex flex-wrap gap-2">
                  {['Original', 'Music', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Sci-Fi', 'Romance', 'Thriller', 'Documentary', 'Nature'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${tags.includes(tag) ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/10 my-8" />

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">Thumbnail Image</label>
            <div className="flex gap-4 mb-4">
              <button 
                type="button"
                onClick={() => setImageSource('link')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${imageSource === 'link' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'}`}
              >
                <LinkIcon className="w-4 h-4" /> Image URL
              </button>
              <button 
                type="button"
                onClick={() => setImageSource('file')}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${imageSource === 'file' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'}`}
              >
                <ImageIcon className="w-4 h-4" /> Upload File
              </button>
            </div>

            {imageSource === 'link' ? (
              <input 
                type="url" 
                value={imageLink}
                onChange={(e) => setImageLink(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none transition-colors"
                placeholder="https://example.com/image.jpg"
              />
            ) : (
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-400 hover:file:bg-purple-500/30"
              />
            )}
          </div>

          <div className="h-px bg-white/10 my-8" />

          {/* Video Source */}
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

{/* Firebase CORS warning removed as we use Cloudinary now */}

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
                Publish Content
              </>
            )}
          </button>
        </form>
      </div>

      <div className="glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl mt-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Broadcast Notification</h2>
            <p className="text-white/50 text-sm">Send a message to all users</p>
          </div>
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          const p = e.target as HTMLFormElement;
          const notifTitle = (p.elements.namedItem('notifTitle') as HTMLInputElement).value;
          const notifMessage = (p.elements.namedItem('notifMessage') as HTMLTextAreaElement).value;
          const notifLink = (p.elements.namedItem('notifLink') as HTMLInputElement).value;
          
          if (!notifTitle || !notifMessage) return;
          try {
            const notifId = `notif_${Date.now()}`;
            await setDoc(doc(db, 'notifications', notifId), {
              id: notifId,
              title: notifTitle,
              message: notifMessage,
              target: 'all',
              type: 'System',
              link: notifLink || null,
              createdAt: new Date().toISOString()
            });
            p.reset();
            alert('Notification sent!');
          } catch(err) {
            console.error(err);
            alert('Failed to send notification');
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Notification Title</label>
            <input 
              name="notifTitle"
              type="text" 
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500/50 outline-none transition-colors"
              placeholder="e.g. New Feature Released!"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Message</label>
            <textarea 
              name="notifMessage"
              required
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500/50 outline-none transition-colors resize-none"
              placeholder="Type your message here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Link (Optional)</label>
            <input 
              name="notifLink"
              type="text" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500/50 outline-none transition-colors"
              placeholder="/ (e.g. valid route) or let empty"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold transition-colors mt-4"
          >
            Send Notification
          </button>
        </form>
      </div>
    </motion.div>
  );
}
