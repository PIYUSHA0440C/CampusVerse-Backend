// routes/resource.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { addResource, getResources } = require('../controllers/resourceController');

router.get('/',   getResources);
router.post('/',  protect, addResource);

module.exports = router;
