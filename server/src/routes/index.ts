import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { chatRouter } from './chat.routes.js';
import { messageRouter } from './message.routes.js';
import { contactRouter } from './contact.routes.js';
import { groupRouter } from './group.routes.js';
import { mediaRouter } from './media.routes.js';
import { settingsRouter } from './settings.routes.js';
import { adminRouter } from './admin.routes.js';
import { storyRouter } from './story.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/chats', chatRouter);
apiRouter.use('/messages', messageRouter);
apiRouter.use('/contacts', contactRouter);
apiRouter.use('/groups', groupRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/stories', storyRouter);

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'BecuGram Server',
    time: new Date().toISOString(),
  });
});


