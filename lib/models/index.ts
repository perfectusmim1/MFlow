import mongoose from 'mongoose';

// Model registry to ensure models are always available in serverless environment
const modelRegistry = new Map();

export function registerModel(name: string, schema: mongoose.Schema, options?: any) {
  if (!modelRegistry.has(name)) {
    try {
      // Check if model already exists in mongoose
      if (mongoose.models[name]) {
        modelRegistry.set(name, mongoose.models[name]);
      } else {
        const model = mongoose.model(name, schema, options);
        modelRegistry.set(name, model);
      }
    } catch (error) {
      console.error(`Error registering model ${name}:`, error);
    }
  }
  return modelRegistry.get(name);
}

export function getModel(name: string) {
  // First try to get from registry
  if (modelRegistry.has(name)) {
    return modelRegistry.get(name);
  }
  
  // Then try mongoose.models
  if (mongoose.models[name]) {
    modelRegistry.set(name, mongoose.models[name]);
    return mongoose.models[name];
  }
  
  // If not found, try to re-import and register
  try {
    switch (name) {
      case 'Manga':
        const MangaModel = require('./Manga').default;
        return MangaModel;
      case 'Chapter':
        const ChapterModel = require('./Chapter').default;
        return ChapterModel;
      case 'User':
        const UserModel = require('./User').default;
        return UserModel;
      case 'Comment':
        const CommentModel = require('./Comment').default;
        return CommentModel;
      case 'Reaction':
        const ReactionModel = require('./Reaction').default;
        return ReactionModel;
      case 'Session':
        const SessionModel = require('./Session').default;
        return SessionModel;
      default:
        throw new Error(`Unknown model: ${name}`);
    }
  } catch (error) {
    console.error(`Error getting model ${name}:`, error);
    throw error;
  }
}

// Initialize all models
export function initializeModels() {
  try {
    getModel('User');
    getModel('Manga');
    getModel('Chapter');
    getModel('Comment');
    getModel('Reaction');
    getModel('Session');
    console.log('All models initialized successfully');
  } catch (error) {
    console.error('Error initializing models:', error);
  }
}