import { Router } from 'express';
import { generateStory, getStories, getStoryById, deleteStory } from '../controllers/storyController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/generate', generateStory);
router.get('/', getStories);
router.get('/:id', getStoryById);
router.delete('/:id', deleteStory);

export default router;