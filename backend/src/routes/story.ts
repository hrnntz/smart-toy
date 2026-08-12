import { Router } from 'express';
import { generateStory, getStories, getStoryById, deleteStory } from '../controllers/storyController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generateStorySchema } from '../validators';

const router = Router();

router.use(authenticateToken);

router.post('/generate', validate(generateStorySchema), generateStory); // VULN-007 fix
router.get('/', getStories);
router.get('/:id', getStoryById);
router.delete('/:id', deleteStory);

export default router;