import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Upload as UploadIcon, Video, Link as LinkIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCanUpload } from '../hooks/useCanUpload';
import { db, storage } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export function Upload() {
  const { user } = useAuth();
  const { canUpload, loading: checkingUploadAccess } = useCanUpload();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Originals' | 'Movie' | 'Series' | 'Shorts'>('Originals');
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
      if (videoSource === 'link' && videoLink.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(videoLink).search);
        const v = urlParams.get('v');
        if (v) {
          finalVideoUrl = `https://www.youtube.com/embed/${v}`;
        }
      } else if (videoSource === 'link' && videoLink.includes('youtu.be/')) {
        const v = videoLink.split('youtu.be/')[1].split('?')[0];
        if (v) {
          finalVideoUrl = `https://www.youtube.com/embed/${v}`;
        }
      }

      // Upload Image if file
      if (imageSource === 'file' && imageFile) {
        try {
          const imageRef = ref(storage, `images/${Date.now()}_${imageFile.name}`);
          const imageUpload = await uploadBytes(imageRef, imageFile);
          finalImageUrl = await getDownloadURL(imageUpload.ref);
        } catch (err: any) {
          console.error("Image upload failed:", err);
          throw new Error("Failed to upload image. This might be due to CORS configuration on the Storage bucket. Please use an Image URL instead.");
        }
      } else if (!finalImageUrl) {
        // Fallback image
        finalImageUrl = `https://picsum.photos/seed/${encodeURIComponent(title)}/800/450`;
      }

      // Upload Video if file
      if (videoSource === 'file' && videoFile) {
        const videoRef = ref(storage, `videos/${Date.now()}_${videoFile.name}`);
        const uploadTask = uploadBytesResumable(videoRef, videoFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(p);
            },
            (err) => reject(err),
            async () => {
              finalVideoUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      const showId = `show_${Date.now()}`;
      
      const newShow = {
        id: showId,
        title,
        description,
        imageUrl: finalImageUrl,
        bannerUrl: finalImageUrl,
        type,
        meta: new Date().getFullYear().toString(),
        videoUrl: finalVideoUrl,
        authorId: user.uid,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'shows', showId), newShow);

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

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Category</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none appearance-none"
              >
                <option value="Originals">Originals</option>
                <option value="Movie">Movie</option>
                <option value="Series">Series</option>
                <option value="Shorts">Shorts</option>
              </select>
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
    </motion.div>
  );
}
