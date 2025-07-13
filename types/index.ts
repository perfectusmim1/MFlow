export interface User {
  _id: string;
  email: string;
  username: string;
  password?: string;
  role: 'user' | 'admin';
  avatar?: string;
  isActive: boolean;
  favorites: string[];
  readingHistory: ReadingHistory[];
  readingList: string[];
  customReadingLists: CustomReadingList[];
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  language: string;
  readingMode: 'horizontal' | 'vertical' | 'webtoon';
  autoTranslate: boolean;
  targetLanguage: string;
  notifications: {
    newChapters: boolean;
    favorites: boolean;
    system: boolean;
  };
}

export interface ReadingHistory {
  _id?: string;
  mangaId: string | any; // ObjectId veya populate edilmiş manga objesi
  chapterId: string | any; // ObjectId veya populate edilmiş chapter objesi
  pageNumber: number;
  readAt: Date;
  readingTime?: number; // Dakika cinsinden okuma süresi
}

export interface CustomReadingList {
  _id?: string;
  name: string;
  description?: string;
  isPublic: boolean;
  mangas: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Manga {
  _id: string;
  title: string;
  slug: string;
  titleAlternative: string[];
  description: string;
  author: string[];
  artist: string[];
  genres: string[];
  tags: string[];
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  type: 'manga' | 'manhwa' | 'manhua' | 'webtoon';
  coverImage: string;
  bannerImage?: string;
  rating: number;
  ratingCount: number;
  viewCount: number;
  favoriteCount: number;
  likeCount: number;
  dislikeCount: number;
  likes: string[];
  dislikes: string[];
  ratings?: Array<{
    userId: string;
    rating: number;
    createdAt: Date;
  }>;
  isNSFW: boolean;
  isPrivate: boolean;
  originalLanguage: string;
  chapters: string[];
  firstChapter?: string;
  lastChapter?: string;
  userLike?: 'like' | 'dislike' | null;
  userRating?: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface Chapter {
  _id: string;
  mangaId: string;
  title: string;
  chapterNumber: number;
  volume?: number;
  pages: Page[];
  publishedAt: Date;
  isPublished: boolean;
  viewCount: number;
  isTranslated: boolean;
  originalLanguage: string;
  translatedLanguages: string[];
  createdAt: Date;
  updatedAt: Date;
  slug: string;
}

export interface Page {
  _id: string;
  pageNumber: number;
  imageUrl: string;
  width: number;
  height: number;
  textRegions?: TextRegion[];
  translatedVersions?: TranslatedPage[];
}

export interface TextRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalText: string;
  confidence: number;
}

export interface TranslatedPage {
  language: string;
  imageUrl: string;
  textRegions: TranslatedTextRegion[];
}

export interface TranslatedTextRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalText: string;
  translatedText: string;
  confidence: number;
}

export interface Comment {
  _id: string;
  userId: string;
  mangaId?: string;
  chapterId?: string;
  parentId?: string;
  content: string;
  likes: number;
  dislikes: number;
  replies: string[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Translation {
  _id: string;
  chapterId: string;
  pageId: string;
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
  translatedText: string;
  confidence: number;
  method: 'gemini' | 'manual';
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchFilters {
  query?: string;
  genres?: string[];
  tags?: string[];
  status?: string[];
  type?: string[];
  rating?: number;
  sortBy?: 'title' | 'rating' | 'views' | 'updated' | 'created';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ReaderSettings {
  mode: 'horizontal' | 'vertical' | 'webtoon';
  zoom: number;
  autoScroll: boolean;
  autoTranslate: boolean;
  showComments: boolean;
  fullscreen: boolean;
}

export interface SystemSettings {
  geminiApiKey: string;
  defaultTargetLanguage: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  enableComments: boolean;
  enableRatings: boolean;
  maintenanceMode: boolean;
}