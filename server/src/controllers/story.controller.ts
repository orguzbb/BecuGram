import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const storiesFile = path.resolve(process.cwd(), 'data', 'stories.json');

interface StoryItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  mediaUrl?: string;
  caption?: string;
  bgColor?: string;
  createdAt: string;
}

function getStories(): StoryItem[] {
  try {
    if (!fs.existsSync(storiesFile)) {
      const initial: StoryItem[] = [
        {
          id: 'story_official',
          userId: 'admin_official',
          userName: 'BecuGram Rasmiy',
          caption: 'BecuGram platformasiga xush kelibsiz! 🚀',
          bgColor: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          createdAt: new Date().toISOString(),
        },
      ];
      fs.mkdirSync(path.dirname(storiesFile), { recursive: true });
      fs.writeFileSync(storiesFile, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(storiesFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStories(stories: StoryItem[]) {
  try {
    fs.mkdirSync(path.dirname(storiesFile), { recursive: true });
    fs.writeFileSync(storiesFile, JSON.stringify(stories, null, 2));
  } catch (err) {
    console.error('Failed to save stories:', err);
  }
}

export const getStoriesList = (req: Request, res: Response) => {
  const stories = getStories();
  res.json({ success: true, data: stories });
};

export const createStory = (req: Request, res: Response) => {
  const { caption, mediaUrl, bgColor } = req.body;
  const user = (req as any).user;

  const newStory: StoryItem = {
    id: `story_${Date.now()}`,
    userId: user?._id || 'user_default',
    userName: user?.displayName || 'Foydalanuvchi',
    userAvatar: user?.avatar,
    caption: caption || undefined,
    mediaUrl: mediaUrl || undefined,
    bgColor: bgColor || 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
    createdAt: new Date().toISOString(),
  };

  const stories = getStories();
  stories.unshift(newStory);
  saveStories(stories);

  res.status(201).json({ success: true, data: newStory });
};

export const deleteStory = (req: Request, res: Response) => {
  const { id } = req.params;
  const stories = getStories().filter((s) => s.id !== id);
  saveStories(stories);
  res.json({ success: true, message: 'Story deleted' });
};

