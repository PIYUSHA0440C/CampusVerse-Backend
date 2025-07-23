// controllers/resourceController.js
const Resource = require('../models/Resource');

exports.addResource = async (req, res) => {
  try {
    const { title, link, subject } = req.body;
    const resource = await Resource.create({
      title, link, subject, createdBy: req.userId
    });
    res.status(201).json(resource);
  } catch (err) {
    console.error('Add resource error:', err);
    res.status(500).json({ message: 'Add resource failed' });
  }
};

exports.getResources = async (_req, res) => {
  try {
    const resources = await Resource.find().sort('-createdAt');
    res.json(resources);
  } catch (err) {
    console.error('Fetch resources error:', err);
    res.status(500).json({ message: 'Fetch resources failed' });
  }
};
