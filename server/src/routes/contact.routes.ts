import { Router } from 'express';
import { getContacts, addContact, removeContact, toggleBlockUser } from '../controllers/contact.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const contactRouter = Router();

contactRouter.use(requireAuth);

contactRouter.get('/', getContacts);
contactRouter.post('/', addContact);
contactRouter.delete('/:id', removeContact);
contactRouter.post('/block', toggleBlockUser);

