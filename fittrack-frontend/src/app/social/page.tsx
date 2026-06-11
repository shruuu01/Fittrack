'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, MessageSquare, ThumbsUp, Send, 
  Upload, Sparkles, UserPlus, CheckCircle2 
} from 'lucide-react';

interface Comment {
  id: number;
  username: string;
  content: string;
  created_at: string;
}

interface Post {
  id: number;
  user: number;
  username: string;
  content: string;
  image?: string;
  likes_count: number;
  comments_count: number;
  comments: Comment[];
  created_at: string;
}

interface UserSuggestion {
  id: number;
  username: string;
  email: string;
}

export default function SocialPage() {
  const { user } = useAuth();
  
  const [feed, setFeed] = useState<Post[]>([]);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create Post states
  const [postContent, setPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [postLoading, setPostLoading] = useState(false);

  // Comments states keyed by Post ID
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [sentRequests, setSentRequests] = useState<number[]>([]);

  const fetchSocialData = async () => {
    try {
      setIsLoading(true);
      const feedData = await api.getSocialFeed();
      setFeed(feedData || []);
      const suggData = await api.getFriendSuggestions();
      setSuggestions(suggData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSocialData();
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !selectedFile) return;
    setPostLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', postContent);
      if (selectedFile) {
        formData.append('image', selectedFile);
      }
      await api.createPost(formData);
      setPostContent('');
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchSocialData();
    } catch (e) {
      console.error(e);
    } finally {
      setPostLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const res = await api.likePost(postId);
      setFeed(prev => prev.map(p => p.id === postId ? { ...p, likes_count: res.likes_count } : p));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentSubmit = async (postId: number) => {
    const content = commentInputs[postId];
    if (!content || !content.trim()) return;

    try {
      const newComment = await api.commentOnPost(postId, content);
      setFeed(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments_count: p.comments_count + 1,
            comments: [...(p.comments || []), newComment],
          };
        }
        return p;
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFriend = async (friendId: number) => {
    try {
      await api.sendFriendRequest(friendId);
      setSentRequests(prev => [...prev, friendId]);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {/* Left Columns: Feed & Share Form */}
      <div className="md:col-span-2 space-y-6">
        {/* Create Post Card */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">Share Fitness Milestone</h3>
          <form onSubmit={handlePostSubmit} className="space-y-4">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Completed a squat posture check! Share your daily streak or nutrition tips..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all resize-none"
            />
            
            {previewUrl && (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-800">
                <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  className="absolute top-2 right-2 bg-slate-950/80 px-2 py-1 rounded text-[10px] hover:bg-slate-900"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <label className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer transition-all flex items-center text-xs">
                <Upload className="h-4 w-4 mr-1.5" /> Attach Photo
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              <button
                type="submit"
                disabled={postLoading || (!postContent.trim() && !selectedFile)}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow disabled:opacity-50"
              >
                {postLoading ? 'Posting...' : 'Share Post'}
              </button>
            </div>
          </form>
        </div>

        {/* Social Feed Timeline */}
        <div className="space-y-6">
          {feed.length === 0 ? (
            <p className="text-center py-12 text-xs text-slate-500 glass-card">No community feed logs found yet. Start sharing!</p>
          ) : (
            feed.map(post => (
              <div key={post.id} className="glass-card p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm">
                    {post.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">{post.username}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">{post.content}</p>

                {post.image && (
                  <img src={`http://localhost:8000${post.image}`} alt="Feed visualizer" className="w-full max-h-80 object-cover rounded-xl border border-slate-850" />
                )}

                {/* Engagement totals */}
                <div className="flex space-x-6 text-xs text-slate-450 border-y border-slate-850 py-3">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="flex items-center hover:text-emerald-400 transition-colors"
                  >
                    <ThumbsUp className="h-4.5 w-4.5 mr-1.5" /> {post.likes_count} Likes
                  </button>
                  <span className="flex items-center">
                    <MessageSquare className="h-4.5 w-4.5 mr-1.5" /> {post.comments_count} Comments
                  </span>
                </div>

                {/* Comments Thread */}
                {post.comments && post.comments.length > 0 && (
                  <div className="space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-900/60 max-h-48 overflow-y-auto">
                    {post.comments.map(c => (
                      <div key={c.id} className="text-xs">
                        <span className="font-bold text-slate-200 mr-2">{c.username}:</span>
                        <span className="text-slate-400">{c.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Write comment input */}
                <div className="flex space-x-3 pt-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleCommentSubmit(post.id)}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Suggestions */}
      <div className="md:col-span-1 space-y-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-slate-400" /> Friend Suggestions
          </h3>
          <div className="divide-y divide-slate-850">
            {suggestions.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-500">No suggestions available.</p>
            ) : (
              suggestions.map(sugg => {
                const requestSent = sentRequests.includes(sugg.id);
                return (
                  <div key={sugg.id} className="flex justify-between items-center py-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                        {sugg.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{sugg.username}</p>
                        <p className="text-[10px] text-slate-500">{sugg.email}</p>
                      </div>
                    </div>
                    {requestSent ? (
                      <span className="text-emerald-500 flex items-center">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(sugg.id)}
                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
