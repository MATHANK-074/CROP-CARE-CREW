const Scheme = require('../models/Scheme');

// @desc    Get all active government schemes
// @route   GET /api/schemes
// @access  Public
exports.getAllSchemes = async (req, res) => {
  try {
    const { search, category, state } = req.query;
    
    // Build our MongoDB query object dynamically based on what the frontend asks for
    let query = { isActive: true };

    if (category) query.category = category;
    if (state) query.state = state;
    
    // If the user typed something in the search bar, use our Text Index!
    if (search) {
      query.$text = { $search: search };
    }

    // Execute the query. If it's a text search, we optionally sort by the text match score
    const schemes = await Scheme.find(query).sort(search ? { score: { $meta: "textScore" } } : { createdAt: -1 });

    res.status(200).json({
      success: true,
      count: schemes.length,
      data: schemes
    });
  } catch (error) {
    console.error('Error fetching schemes:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single scheme by ID
// @route   GET /api/schemes/:id
// @access  Public
exports.getSchemeById = async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id);

    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }

    res.status(200).json({
      success: true,
      data: scheme
    });
  } catch (error) {
    console.error('Error fetching scheme:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new scheme (Admin Only)
// @route   POST /api/schemes
// @access  Private/Admin
exports.createScheme = async (req, res) => {
  try {
    const scheme = await Scheme.create(req.body);
    res.status(201).json({ success: true, data: scheme });
  } catch (error) {
    console.error('Error creating scheme:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a scheme (Admin Only)
// @route   PUT /api/schemes/:id
// @access  Private/Admin
exports.updateScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Returns the updated document
      runValidators: true // Ensures the updated data still follows schema rules
    });

    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }
    res.status(200).json({ success: true, data: scheme });
  } catch (error) {
    console.error('Error updating scheme:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a scheme (Admin Only)
// @route   DELETE /api/schemes/:id
// @access  Private/Admin
exports.deleteScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findByIdAndDelete(req.params.id);

    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting scheme:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
