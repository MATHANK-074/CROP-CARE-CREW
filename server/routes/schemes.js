const express = require('express');
const router = express.Router();
const { 
  getAllSchemes, 
  getSchemeById, 
  createScheme,
  updateScheme,
  deleteScheme
} = require('../controllers/schemeController');

// Route: /api/schemes
router.route('/')
  .get(getAllSchemes)
  .post(createScheme);

// Route: /api/schemes/:id
router.route('/:id')
  .get(getSchemeById)
  .put(updateScheme)
  .delete(deleteScheme);

module.exports = router;
