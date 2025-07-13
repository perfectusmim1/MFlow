'use client';

import { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  Edit, 
  Trash2, 
  Send,
  X,
  MoreVertical
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface User {
  _id: string;
  username: string;
  avatar?: string;
}

interface Comment {
  _id: string;
  userId: User;
  content: string;
  likes: string[];
  dislikes: string[];
  replies: Comment[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  dislikeCount: number;
  replyCount: number;
}

interface CommentSystemProps {
  mangaId?: string;
  chapterId?: string;
  targetType?: string;
  targetId?: string;
  title?: string;
  user?: any;
  showReactions?: boolean;
}

export default function CommentSystem({ mangaId, chapterId, targetType, targetId, title, user, showReactions = false }: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isCommentFocused, setIsCommentFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Reaction system states
  const [reactions, setReactions] = useState<any[]>([]);
  const [reactionLoading, setReactionLoading] = useState<string | null>(null);

  const AVAILABLE_REACTIONS = [
    { emoji: '😍', name: 'love', label: 'Harika' },
    { emoji: '😂', name: 'funny', label: 'Komik' },
    { emoji: '😢', name: 'sad', label: 'Üzücü' },
    { emoji: '😱', name: 'shocked', label: 'Şaşırtıcı' },
    { emoji: '🔥', name: 'fire', label: 'Mükemmel' }
  ];

  useEffect(() => {
    fetchComments();
    if (showReactions) {
      fetchReactions();
    }
  }, [mangaId, chapterId]);

  const fetchComments = async (pageNum: number = 1) => {
    try {
      setLoading(pageNum === 1);
      
      const params = new URLSearchParams();
      if (mangaId) params.append('mangaId', mangaId);
      if (chapterId) params.append('chapterId', chapterId);
      params.append('page', pageNum.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/comments?${params}`);
      const data = await response.json();

      if (data.success) {
        if (pageNum === 1) {
          setComments(data.data);
        } else {
          setComments(prev => [...prev, ...data.data]);
        }
        setHasMore(data.pagination.page < data.pagination.totalPages);
      } else {
        toast.error(data.error || 'Yorumlar yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Comments fetch error:', error);
      toast.error('Yorumlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchReactions = async () => {
    try {
      const headers: any = {};
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const reactionTargetType = targetType || (mangaId ? 'manga' : 'chapter');
      const reactionTargetId = targetId || mangaId || chapterId;

      const response = await fetch(`/api/reactions?targetType=${reactionTargetType}&targetId=${reactionTargetId}`, {
        headers,
      });
      const data = await response.json();

      if (data.success) {
        setReactions(data.data);
      }
    } catch (error) {
      console.error('Reactions fetch error:', error);
    }
  };

  const handleReaction = async (reactionName: string) => {
    if (reactionLoading) return;

    try {
      setReactionLoading(reactionName);
      
      const headers: any = {
        'Content-Type': 'application/json',
      };

      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const reactionTargetType = targetType || (mangaId ? 'manga' : 'chapter');
      const reactionTargetId = targetId || mangaId || chapterId;

      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetType: reactionTargetType,
          targetId: reactionTargetId,
          reactionName
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchReactions();
        toast.success(data.message || 'Tepki başarıyla güncellendi');
      } else {
        toast.error(data.error || 'Tepki eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Reaction error:', error);
      toast.error('Tepki eklenirken hata oluştu');
    } finally {
      setReactionLoading(null);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Yorum yapmak için giriş yapmalısınız');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Yorum içeriği boş olamaz');
      return;
    }

    try {
      setSubmitting(true);
    const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum süreniz dolmuş, lütfen tekrar giriş yapın');
        return;
      }
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mangaId,
          chapterId,
          content: newComment.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setComments(prev => [data.data, ...prev]);
        setNewComment('');
        setIsTyping(false);
        setIsCommentFocused(false);
        toast.success('Yorum başarıyla eklendi');
      } else {
        toast.error(data.error || 'Yorum eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Comment submit error:', error);
      toast.error('Yorum eklenirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);
    setIsTyping(value.length > 0);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast.error('Yanıt vermek için giriş yapmalısınız');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('Yanıt içeriği boş olamaz');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum süreniz dolmuş, lütfen tekrar giriş yapın');
        return;
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mangaId,
          chapterId,
          parentId,
          content: replyContent.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add reply to parent comment
        setComments(prev => prev.map(comment => 
          comment._id === parentId 
            ? { ...comment, replies: [...comment.replies, data.data] }
            : comment
        ));
        setReplyContent('');
        setReplyTo(null);
        toast.success('Yanıt başarıyla eklendi');
      } else {
        toast.error(data.error || 'Yanıt eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Reply submit error:', error);
      toast.error('Yanıt eklenirken hata oluştu');
    }
  };

  const handleLikeComment = async (commentId: string, action: 'like' | 'dislike' | 'remove_like' | 'remove_dislike') => {
    if (!user) {
      toast.error('Bu işlem için giriş yapmalısınız');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum süreniz dolmuş, lütfen tekrar giriş yapın');
        return;
      }

      const response = await fetch('/api/comments/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          commentId,
          action
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update comment in state
        setComments(prev => prev.map(comment => {
          if (comment._id === commentId) {
            return {
              ...comment,
              likes: data.data.userLiked ? [...comment.likes, user._id] : comment.likes.filter(id => id !== user._id),
              dislikes: data.data.userDisliked ? [...comment.dislikes, user._id] : comment.dislikes.filter(id => id !== user._id),
              likeCount: data.data.likeCount,
              dislikeCount: data.data.dislikeCount
            };
          }
          // Also update replies
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply._id === commentId 
                ? {
                    ...reply,
                    likes: data.data.userLiked ? [...reply.likes, user._id] : reply.likes.filter(id => id !== user._id),
                    dislikes: data.data.userDisliked ? [...reply.dislikes, user._id] : reply.dislikes.filter(id => id !== user._id),
                    likeCount: data.data.likeCount,
                    dislikeCount: data.data.dislikeCount
                  }
                : reply
            )
          };
        }));
      } else {
        toast.error(data.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Like comment error:', error);
      toast.error('İşlem sırasında hata oluştu');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Yorum içeriği boş olamaz');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum süreniz dolmuş, lütfen tekrar giriş yapın');
        return;
      }

      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: editContent.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update comment in state
        setComments(prev => prev.map(comment => {
          if (comment._id === commentId) {
            return { ...comment, content: data.data.content, isEdited: true };
          }
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply._id === commentId 
                ? { ...reply, content: data.data.content, isEdited: true }
                : reply
            )
          };
        }));
        setEditingComment(null);
        setEditContent('');
        toast.success('Yorum başarıyla güncellendi');
      } else {
        toast.error(data.error || 'Yorum güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Edit comment error:', error);
      toast.error('Yorum güncellenirken hata oluştu');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum süreniz dolmuş, lütfen tekrar giriş yapın');
        return;
      }

      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Update comment in state immediately
        setComments(prev => prev.map(comment => {
          if (comment._id === commentId) {
            return { ...comment, content: '[Silinen yorum]', isDeleted: true };
          }
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply._id === commentId
                ? { ...reply, content: '[Silinen yorum]', isDeleted: true }
                : reply
            )
          };
        }));
        setShowDropdown(null); // Close dropdown
        toast.success('Yorum başarıyla silindi');
      } else {
        toast.error(data.error || 'Yorum silinirken hata oluştu');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      toast.error('Yorum silinirken hata oluştu');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Az önce';
    } else if (diffInHours < 24) {
      return `${diffInHours} saat önce`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} gün önce`;
    } else {
      return date.toLocaleDateString('tr-TR');
    }
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const isOwner = user && comment.userId._id === user._id;
    const userLiked = user && comment.likes.includes(user._id);
    const userDisliked = user && comment.dislikes.includes(user._id);

    return (
      <div className={`${isReply ? 'ml-8 border-l-2 border-light-200 dark:border-dark-700 pl-4' : ''}`}>
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {comment.userId.avatar ? (
                <img 
                  src={comment.userId.avatar} 
                  alt={comment.userId.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                comment.userId.username.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href={`/profile/${comment.userId.username}`}
                className="font-medium text-dark-950 dark:text-light-50 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
              >
                {comment.userId.username}
              </Link>
              <span className="text-xs text-light-600 dark:text-dark-400">
                {formatDate(comment.createdAt)}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-light-500 dark:text-dark-500">
                  (düzenlendi)
                </span>
              )}
              {isOwner && (
                <div className="relative ml-auto">
                  <button
                    onClick={() => setShowDropdown(showDropdown === comment._id ? null : comment._id)}
                    className="p-1 hover:bg-light-200 dark:hover:bg-dark-700 rounded"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {showDropdown === comment._id && (
                    <div className="absolute right-0 top-8 bg-white dark:bg-dark-800 border border-light-200 dark:border-dark-700 rounded-lg shadow-lg z-10 min-w-32">
                      <button
                        onClick={() => {
                          setEditingComment(comment._id);
                          setEditContent(comment.content);
                          setShowDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-light-100 dark:hover:bg-dark-700 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Düzenle
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteComment(comment._id);
                          setShowDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-light-100 dark:hover:bg-dark-700 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Sil
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {editingComment === comment._id ? (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border border-light-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-dark-950 dark:text-light-50 resize-none transition-all duration-300 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-1 focus:ring-primary-200 dark:focus:ring-primary-800 focus:shadow-md"
                    rows={3}
                    maxLength={1000}
                    autoFocus
                  />
                  {editContent.length > 0 && (
                    <div className="absolute top-1 right-1">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs transition-colors duration-200 ${
                    editContent.length > 900 
                      ? 'text-red-500' 
                      : editContent.length > 700 
                        ? 'text-yellow-500' 
                        : 'text-light-600 dark:text-dark-400'
                  }`}>
                    {editContent.length}/1000
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditComment(comment._id)}
                      disabled={!editContent.trim()}
                      className={`btn btn-primary btn-sm disabled:opacity-50 transition-all duration-300 ${
                        editContent.trim() ? 'transform scale-105 shadow-md' : ''
                      }`}
                    >
                      <Edit className={`w-4 h-4 transition-transform duration-200 ${
                        editContent.trim() ? 'transform rotate-12' : ''
                      }`} />
                      Kaydet
                    </button>
                    <button
                      onClick={() => {
                        setEditingComment(null);
                        setEditContent('');
                      }}
                      className="btn btn-ghost btn-sm hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-all duration-200"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-dark-800 dark:text-light-200 mb-2 whitespace-pre-wrap">
                {comment.content}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={() => handleLikeComment(comment._id, userLiked ? 'remove_like' : 'like')}
                className={`flex items-center gap-1 transition-colors ${
                  userLiked 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-light-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{comment.likeCount || comment.likes.length}</span>
              </button>
              
              <button
                onClick={() => handleLikeComment(comment._id, userDisliked ? 'remove_dislike' : 'dislike')}
                className={`flex items-center gap-1 transition-colors ${
                  userDisliked 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-light-600 dark:text-dark-400 hover:text-red-600 dark:hover:text-red-400'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span>{comment.dislikeCount || comment.dislikes.length}</span>
              </button>
              
              {!isReply && (
                <button
                  onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                  className="flex items-center gap-1 text-light-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  Yanıtla
                </button>
              )}
            </div>
            
            {replyTo === comment._id && (
              <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Yanıtınızı yazın..."
                    className="w-full p-2 border border-light-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-dark-950 dark:text-light-50 resize-none transition-all duration-300 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-1 focus:ring-primary-200 dark:focus:ring-primary-800 focus:shadow-md"
                    rows={3}
                    maxLength={1000}
                    autoFocus
                  />
                  {replyContent.length > 0 && (
                    <div className="absolute top-1 right-1">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-primary-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs transition-colors duration-200 ${
                    replyContent.length > 900 
                      ? 'text-red-500' 
                      : replyContent.length > 700 
                        ? 'text-yellow-500' 
                        : 'text-light-600 dark:text-dark-400'
                  }`}>
                    {replyContent.length}/1000
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSubmitReply(comment._id)}
                      disabled={!replyContent.trim()}
                      className={`btn btn-primary btn-sm disabled:opacity-50 transition-all duration-300 flex items-center gap-2 ${
                        replyContent.trim() ? 'transform scale-[1.02] shadow-sm' : ''
                      }`}
                    >
                      <Send className={`w-4 h-4 transition-transform duration-200 ${
                        replyContent.trim() ? 'transform rotate-12' : ''
                      }`} />
                      Yanıtla
                    </button>
                    <button
                      onClick={() => {
                        setReplyTo(null);
                        setReplyContent('');
                      }}
                      className="btn btn-ghost btn-sm hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-all duration-200"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 space-y-4">
                {comment.replies.map((reply) => (
                  <CommentItem key={reply._id} comment={reply} isReply={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading && comments.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50">
          Yorumlar ({comments.length})
        </h3>
      </div>

      {/* Reaction System */}
      {showReactions && (
        <div className="mb-6 p-4 bg-light-50 dark:bg-dark-800 rounded-lg border border-light-200 dark:border-dark-700">
          <h4 className="text-md font-semibold text-dark-950 dark:text-light-50 mb-4 flex items-center justify-center gap-2">
            <span>🎭</span>
            Tepkiler
          </h4>
          
          <div className="flex flex-wrap gap-3 justify-center items-center min-h-[80px]">
            {AVAILABLE_REACTIONS.map((availableReaction) => {
              const reaction = reactions.find(r => r.name === availableReaction.name);
              const count = reaction?.count || 0;
              const userReacted = reaction?.userReacted || false;
              const isReactionLoading = reactionLoading === availableReaction.name;

              return (
                <button
                  key={availableReaction.name}
                  onClick={() => handleReaction(availableReaction.name)}
                  disabled={reactionLoading !== null}
                  className={`
                    flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-full border transition-all duration-200 transform hover:scale-105 min-w-[60px] h-[70px] cursor-pointer relative
                    ${userReacted
                      ? 'bg-primary-600 border-primary-500 text-white shadow-lg'
                      : 'bg-light-100 dark:bg-dark-700 border-light-300 dark:border-dark-600 text-light-700 dark:text-light-300 hover:bg-light-200 dark:hover:bg-dark-600 hover:border-light-400 dark:hover:border-dark-500'
                    }
                    ${reactionLoading !== null ? 'opacity-70' : ''}
                  `}
                  title={availableReaction.label}
                >
                  {isReactionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <>
                      <span className={`text-2xl transition-transform duration-200 ${userReacted ? 'animate-bounce' : ''}`}>
                        {availableReaction.emoji}
                      </span>
                      <div className="h-4 flex items-center justify-center">
                        {count > 0 && (
                          <span className="font-medium text-xs">
                            {count}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
          
          {reactions.length === 0 && (
            <p className="text-light-600 dark:text-dark-400 text-sm mt-4 text-center">
              İlk tepkiyi siz verin!
            </p>
          )}
        </div>
      )}

      {/* New Comment Form */}
      {user ? (
        <div className={`transition-all duration-300 ease-in-out ${
          isCommentFocused ? 'transform scale-[1.005] shadow-md' : ''
        }`}>
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium transition-all duration-300 ${
                  isCommentFocused ? 'ring-2 ring-primary-300 ring-offset-2' : ''
                }`}>
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    value={newComment}
                    onChange={handleCommentChange}
                    onFocus={() => setIsCommentFocused(true)}
                    onBlur={() => setIsCommentFocused(false)}
                    placeholder="Yorumunuzu yazın..."
                    className={`w-full p-3 border rounded-lg bg-white dark:bg-dark-800 text-dark-950 dark:text-light-50 resize-none transition-all duration-300 ease-in-out ${
                      isCommentFocused 
                        ? 'border-primary-500 dark:border-primary-400 shadow-md ring-1 ring-primary-200 dark:ring-primary-800' 
                        : 'border-light-300 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-600'
                    } ${isTyping ? 'bg-primary-50 dark:bg-primary-950/20' : ''}`}
                    rows={isCommentFocused ? 4 : 3}
                    maxLength={1000}
                  />
                  {isTyping && (
                    <div className="absolute top-2 right-2">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`flex justify-between items-center mt-2 transition-all duration-300 ${
                  isCommentFocused ? 'opacity-100 transform translate-y-0' : 'opacity-70'
                }`}>
                  <span className={`text-xs transition-colors duration-200 ${
                    newComment.length > 900 
                      ? 'text-red-500' 
                      : newComment.length > 700 
                        ? 'text-yellow-500' 
                        : 'text-light-600 dark:text-dark-400'
                  }`}>
                    {newComment.length}/1000
                  </span>
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className={`btn btn-primary btn-sm disabled:opacity-50 transition-all duration-300 flex items-center gap-2 ${
                      isCommentFocused && newComment.trim() 
                        ? 'transform scale-[1.02] shadow-sm' 
                        : ''
                    }`}
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send className={`w-4 h-4 transition-transform duration-200 ${
                          isCommentFocused && newComment.trim() ? 'transform rotate-12' : ''
                        }`} />
                        Gönder
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-light-100 dark:bg-dark-800 rounded-lg text-center">
          <p className="text-light-700 dark:text-dark-300">
            Yorum yapmak için <a href="/login" className="text-primary-600 hover:underline">giriş yapın</a>
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-light-400 dark:text-dark-600 mx-auto mb-3" />
            <p className="text-light-600 dark:text-dark-400">
              Henüz yorum yapılmamış. İlk yorumu siz yapın!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} />
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && comments.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              fetchComments(nextPage);
            }}
            className="btn btn-outline"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            ) : (
              'Daha Fazla Yorum Yükle'
            )}
          </button>
        </div>
      )}
    </div>
  );
}