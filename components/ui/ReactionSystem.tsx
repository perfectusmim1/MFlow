'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Reaction {
  _id: string;
  emoji: string;
  name: string;
  count: number;
  userReacted: boolean;
}

interface ReactionSystemProps {
  targetType: 'manga' | 'chapter';
  targetId: string;
  user?: any;
}

const AVAILABLE_REACTIONS = [
  { emoji: '😍', name: 'love', label: 'Harika' },
  { emoji: '😂', name: 'funny', label: 'Komik' },
  { emoji: '😢', name: 'sad', label: 'Üzücü' },
  { emoji: '😱', name: 'shocked', label: 'Şaşırtıcı' },
  { emoji: '🔥', name: 'fire', label: 'Mükemmel' }
];

export default function ReactionSystem({ targetType, targetId, user }: ReactionSystemProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactionLoading, setReactionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchReactions();
  }, [targetId]);

  const fetchReactions = async () => {
    try {
      setLoading(true);
      
      // Prepare headers
      const headers: any = {};
      
      // Add auth header if user is logged in
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/reactions?targetType=${targetType}&targetId=${targetId}`, {
        headers,
      });
      const data = await response.json();

      if (data.success) {
        setReactions(data.data);
      }
    } catch (error) {
      console.error('Reactions fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (reactionName: string) => {
    if (reactionLoading) return;

    try {
      setReactionLoading(reactionName);
      
      // Prepare headers
      const headers: any = {
        'Content-Type': 'application/json',
      };

      // Add auth header if user is logged in
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetType,
          targetId,
          reactionName
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Fetch all reactions again to ensure consistency
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

  return (
    <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
      <h3 className="text-lg font-semibold text-light-50 mb-4 flex items-center justify-center gap-2">
        <span>🎭</span>
        Tepkiler
      </h3>
      
      <div className="flex flex-wrap gap-3 justify-center items-center h-[80px]">
        {loading ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          AVAILABLE_REACTIONS.map((availableReaction) => {
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
                    : 'bg-dark-700 border-dark-600 text-light-300 hover:bg-dark-600 hover:border-dark-500'
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
          })
        )}
      </div>
      
      {!loading && reactions.length === 0 && (
        <p className="text-dark-400 text-sm mt-4 text-center">
          İlk tepkiyi siz verin!
        </p>
      )}
    </div>
  );
}