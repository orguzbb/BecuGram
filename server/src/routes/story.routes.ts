import { Router } from 'express';
import { getStoriesList, createStory, deleteStory } from '../controllers/story.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const storyRouter = Router();

storyRouter.use(requireAuth);

storyRouter.get('/', getStoriesList);
storyRouter.post('/', createStory);
storyRouter.delete('/:id', deleteStory);

