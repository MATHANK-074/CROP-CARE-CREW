const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Scheme title is required'], 
    trim: true 
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'], 
    index: true 
  }, // e.g., 'PM-KISAN', 'Dairy Farming'
  state: { 
    type: String, 
    default: 'Central', 
    index: true 
  }, // 'Central' or specific state like 'Tamil Nadu'
  description: { 
    type: String, 
    required: [true, 'Description is required'] 
  },
  
  // Storing lists of strings for easy rendering on the frontend
  eligibility: [{ type: String }],
  benefits: [{ type: String }],
  requiredDocuments: [{ type: String }],
  
  applicationProcess: { type: String },
  officialWebsite: { type: String },
  
  // File paths if an admin uploads a document/image
  pdfUrl: { type: String }, 
  imageUrl: { type: String },
  
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  tags: [{ 
    type: String, 
    index: true 
  }], // Useful for filtering and AI RAG searches
  
  // Relationship: Keeping track of which users bookmarked this scheme
  bookmarks: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }]
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create a Text Index. 
// WHY: This is the secret sauce for our AI RAG feature. 
// It allows us to perform high-speed Google-like searches across the title, description, and tags when the chatbot needs to find a scheme.
schemeSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
});

module.exports = mongoose.model('Scheme', schemeSchema);
