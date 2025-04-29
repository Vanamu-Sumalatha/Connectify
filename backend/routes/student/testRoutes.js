import express from 'express';
import { protect, isStudent } from '../../middleware/auth.js';
import {
  startTest,
  submitTest,
  getStudentAttempts,
  getStudentCertificates,
  downloadCertificate
} from '../../controllers/testController.js';

const router = express.Router();

// Apply authentication middleware
router.use(protect);
router.use(isStudent);

// Test attempts routes
router.post('/:id/start', startTest);
router.post('/:id/submit', submitTest);
router.get('/:id/attempts', getStudentAttempts);

// Certificate routes
router.get('/certificates', getStudentCertificates);
router.get('/certificates/:id/download', downloadCertificate);

export default router; 