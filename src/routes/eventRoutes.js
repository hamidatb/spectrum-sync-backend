const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes below
router.use(authMiddleware);

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', eventController.createEvent);

// @route   GET /api/events
// @desc    Get all events for the authenticated user
// @access  Private
router.get('/', eventController.getEvents);

// @route   GET /api/events/:id
// @desc    Get a specific event by ID
// @access  Private
router.get('/:id', eventController.getEventById);

// @route   PUT /api/events/:id
// @desc    Edit an event by ID
// @access  Private
router.put('/:id', eventController.updateEvent);

// @route   DELETE /api/events/:id
// @desc    Delete an event by ID
// @access  Private
router.delete('/:id', eventController.deleteEvent);

// @route   POST /api/events/:id/share
// @desc    Share an event with other users
// @access  Private
router.post('/:id/share', eventController.shareEvent);

// @route   POST /api/events/:id/attend
// @desc    RSVP to an event
// @access  Private
router.post('/:id/attend', eventController.attendEvent);

// @route   GET /api/events/invites
// @desc    Get event invitations for the authenticated user
// @access  Private
router.get('/invites', eventController.getInvites);
module.exports = router;