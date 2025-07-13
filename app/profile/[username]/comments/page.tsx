'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Calendar, ExternalLink, Book, FileText } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

interface UserComment {
  _id: string;
  content: string;
  createdAt: string;
  isEdited: boolean;
  likeCount: number;
  replyCount: number;
  manga?: {
    _id: string;
    title: string;
    slug: string;
    coverImage: string;
  };
  chapter?: {
    _id: string;
    title: string;
    chapterNumber: number;
    manga: {
      _id: string;
      title: string;
      slug: string;
    };
  };
}

interface CommentsData {
  username: string;
  comments: UserComment[];
  totalCount: number;
}

export default function UserCommentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<CommentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const username = params.username as string;
  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (username) {
      fetchComments();
    }
  }, [username]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/user/profile/${username}/comments`);

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getCommentLink = (comment: UserComment) => {
    if (comment.chapter) {
      return `/manga/${comment.chapter.manga.slug}/chapter-${comment.chapter.chapterNumber}#comment-${comment._id}`;
    } else if (comment.manga) {
      return `/manga/${comment.manga.slug}#comment-${comment._id}`;
    }
    return '#';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50 mb-4">
              Sayfa Bulunamadı
            </h1>
            <p className="text-light-700 dark:text-dark-400 mb-6">
              Aradığınız sayfa mevcut değil.
            </p>
            <Link href={`/profile/${username}`} className="btn btn-primary">
              Profile Dön
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-light-700 dark:text-dark-400 hover:text-dark-950 dark:hover:text-light-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark-950 dark:text-light-50">
                  {data.username} - Son Yorumlar
                </h1>
                <p className="text-light-700 dark:text-dark-400">
                  {data.totalCount} toplam yorum
                </p>
              </div>
            </div>
          </div>

          {/* Comments List */}
          {data.comments.length > 0 ? (
            <div className="space-y-6">
              {data.comments.map((comment) => (
                <div key={comment._id} className="card p-6">
                  {/* Comment Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Manga/Chapter Info */}
                    <div className="flex-1">
                      {comment.chapter ? (
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <Link 
                            href={`/manga/${comment.chapter.manga.slug}`}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {comment.chapter.manga.title}
                          </Link>
                          <span className="text-light-600 dark:text-dark-500">•</span>
                          <span className="text-sm text-light-700 dark:text-dark-400">
                            Bölüm {comment.chapter.chapterNumber}: {comment.chapter.title}
                          </span>
                        </div>
                      ) : comment.manga ? (
                        <div className="flex items-center gap-2 mb-2">
                          <Book className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <Link 
                            href={`/manga/${comment.manga.slug}`}
                            className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
                          >
                            {comment.manga.title}
                          </Link>
                          <span className="text-light-600 dark:text-dark-500">•</span>
                          <span className="text-sm text-light-700 dark:text-dark-400">
                            Manga Yorumu
                          </span>
                        </div>
                      ) : null}
                      
                      <div className="flex items-center gap-2 text-xs text-light-600 dark:text-dark-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(comment.createdAt)}</span>
                        {comment.isEdited && (
                          <>
                            <span>•</span>
                            <span>Düzenlendi</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Go to Comment Button */}
                    <Link
                      href={getCommentLink(comment)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Yoruma Git
                    </Link>
                  </div>

                  {/* Comment Content */}
                  <div className="bg-light-100 dark:bg-dark-800 rounded-lg p-4 mb-4">
                    <p className="text-dark-950 dark:text-light-50 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>

                  {/* Comment Stats */}
                  <div className="flex items-center gap-4 text-sm text-light-600 dark:text-dark-500">
                    <div className="flex items-center gap-1">
                      <span>👍</span>
                      <span>{comment.likeCount} beğeni</span>
                    </div>
                    {comment.replyCount > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{comment.replyCount} yanıt</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <MessageCircle className="w-16 h-16 text-light-400 dark:text-dark-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark-950 dark:text-light-50 mb-2">
                Henüz Yorum Yok
              </h3>
              <p className="text-light-700 dark:text-dark-400">
                {isOwnProfile 
                  ? "Henüz hiç yorum yapmadınız."
                  : `${data.username} henüz hiç yorum yapmamış.`
                }
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}