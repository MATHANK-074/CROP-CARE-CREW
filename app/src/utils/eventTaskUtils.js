import axios from 'axios';

/**
 * Utility to convert crop events to tasks and save them to MongoDB
 */
export const saveEventAsTask = async (cropId, userId, eventType, eventData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Validate and sanitize event data
    const sanitizedEventData = sanitizeEventData(eventType, eventData);
    // Create a standardized task object from the event data
    const task = {
      // userId is not needed as it's extracted from the auth token on the server
      crop: cropId, // Changed from cropId to crop to match backend expectations
      title: generateTaskTitle(eventType, sanitizedEventData),
      description: generateTaskDescription(eventType, sanitizedEventData),
      dueDate: sanitizedEventData.date || new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: 'pending',
      source: 'system_generated',
      category: mapEventTypeToCategory(eventType),
      tags: ['crop-event', eventType],
    };

    // Send the task to the server
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/tasks`, task, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Also save the event to the crop
    await saveEventToCrop(cropId, eventType, sanitizedEventData, token);

    return response.data;
  } catch (error) {
    console.error('Error saving event as task:', error);
    if (error.response && error.response.data) {
      console.error('Error details:', error.response.data);
    }
    throw error;
  }
};

/**
 * Save the event directly to the crop's specific event history collection
 */
const saveEventToCrop = async (cropId, eventType, eventData, token) => {
  try {
    // For activity type, we'll use the activities API route instead of crops
    if (eventType === 'activity') {
      const activityData = {
        cropId,
        title: eventData.title || 'Crop Activity',
        description: eventData.description || '',
        activityType: eventData.activityType || 'general',
        duration: eventData.duration || 0,
        date: eventData.date || new Date().toISOString().split('T')[0],
        personnel: eventData.personnel || [],
        tags: eventData.tags || []
      };

      await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/activities`, activityData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return;
    }

    // Map event type to the appropriate endpoint based on the Crop model schema
    const endpointMap = {
      'irrigation': 'irrigation',
      'fertilization': 'fertilization',
      'pestDisease': 'pest-disease',
      'growth': 'growth',
      'harvest': 'harvest',
      'weather': 'weather',
      'cost': 'costs',     // Plural as per the endpoint
      'labor': 'labor',
      'note': 'notes',     // Plural as per the endpoint
    };

    const endpoint = endpointMap[eventType];
    if (!endpoint) {
      console.error(`Unknown event type: ${eventType}`);
      return;
    }

    // Format the event data - different endpoints expect different data structures
    let event;

    // Special handling for cost events to match server expectations
    if (eventType === 'cost') {
      event = {
        date: eventData.date || new Date().toISOString().split('T')[0],
        category: eventData.category || 'other',
        amount: parseFloat(eventData.amount) || 0,
        description: eventData.description || 'No description provided'
      };

      // Validate the cost data before sending
      if (!event.category || event.amount === undefined || isNaN(event.amount)) {
        console.error('Invalid cost data:', event);
        throw new Error('Cost data is invalid: category and amount are required');
      }
    } else {
      // For other event types, just send the raw event data
      event = {
        ...eventData,
        date: eventData.date || new Date().toISOString().split('T')[0]
      };
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/crops/${cropId}/${endpoint}`, event, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (axiosError) {
      console.error(`Error saving ${eventType} event to crop:`, axiosError);
      if (axiosError.response) {
        console.error('Response status:', axiosError.response.status);
        console.error('Response data:', axiosError.response.data);

        // For cost events, provide detailed debugging
        if (eventType === 'cost') {
          console.error('Cost event that failed:', JSON.stringify(event));
        }
      }
      // We don't throw here to avoid preventing task creation if this fails
    }
  } catch (error) {
    console.error('Error in saveEventToCrop function:', error);
    // We don't throw here to avoid preventing task creation if this fails
  }
};

/**
 * Generate a title for the task based on event type and data
 */
const generateTaskTitle = (eventType, eventData) => {
  switch (eventType) {
    case 'irrigation':
      return `Irrigation: ${eventData.method || 'Water'} ${eventData.amount ? `(${eventData.amount} units)` : ''}`;
    case 'fertilization':
      return `Fertilize: ${eventData.fertilizer || 'Apply fertilizer'}`;
    case 'pestDisease':
      return `Pest Control: ${eventData.pestType || 'Treat'} ${eventData.severity ? `(Severity: ${eventData.severity})` : ''}`;
    case 'growth':
      return `Growth Check: ${eventData.stage || 'Record measurements'}`;
    case 'harvest':
      return `Harvest: ${eventData.yield ? `${eventData.yield} units` : 'Collect crops'}`;
    case 'cost':
      return `Expense: ${eventData.category} - ₹${eventData.amount || '0'}`;
    case 'labor':
      return `Work: ${eventData.task || 'Perform labor'} (${eventData.hours || '0'} hours)`;
    case 'note':
      return `Note: ${eventData.text ? eventData.text.substring(0, 30) + (eventData.text.length > 30 ? '...' : '') : 'Review note'}`;
    case 'activity':
      return `Activity: ${eventData.title || eventData.activityType || 'Perform task'}`;
    default:
      return `Crop Task: ${eventType}`;
  }
};

/**
 * Generate a description for the task based on event type and data
 */
const generateTaskDescription = (eventType, eventData) => {
  // Start with any notes field
  let baseDescription = eventData.notes || '';

  // Add event-specific details
  switch (eventType) {
    case 'irrigation':
      return `${baseDescription}\n\nMethod: ${eventData.method || 'Not specified'}\nAmount: ${eventData.amount || 'Not specified'}\nWater source: ${eventData.waterSource || 'Not specified'}`;

    case 'fertilization':
      return `${baseDescription}\n\nFertilizer: ${eventData.fertilizer || 'Not specified'}\nAmount: ${eventData.amount || 'Not specified'}\nMethod: ${eventData.method || 'Not specified'}`;

    case 'pestDisease':
      return `${baseDescription}\n\nType: ${eventData.pestType || 'Not specified'}\nSeverity: ${eventData.severity || 'Not specified'}\nTreatment: ${eventData.treatment || 'Not specified'}`;

    case 'growth':
      return `${baseDescription}\n\nStage: ${eventData.stage || 'Not specified'}\nHeight: ${eventData.height || 'Not specified'}\nObservations: ${eventData.observations || 'None recorded'}`;

    case 'harvest':
      return `${baseDescription}\n\nYield: ${eventData.yield || 'Not specified'}\nQuality: ${eventData.quality || 'Not specified'}\nMethod: ${eventData.method || 'Not specified'}`;

    default:
      // For other event types, just return any notes or a generic message
      return baseDescription || `Task related to ${eventType} for the crop`;
  }
};

/**
 * Map event types to task categories based on the Task model's allowed values:
 * ['irrigation', 'fertilization', 'pest_control', 'disease_treatment',
 *  'harvesting', 'planting', 'pruning', 'soil_management', 'weather_response', 'general']
 */
const mapEventTypeToCategory = (eventType) => {
  switch (eventType) {
    case 'irrigation':
      return 'irrigation';
    case 'fertilization':
      return 'fertilization';
    case 'pestDisease':
      return 'pest_control';
    case 'growth':
      return 'general';
    case 'harvest':
      return 'harvesting';
    case 'weather':
      return 'weather_response';
    case 'cost':
      return 'general';
    case 'labor':
      return 'general';
    case 'note':
    case 'activity':
    default:
      return 'general';
  }
};

/**
 * Sanitizes and validates event data to prevent NaN values and ensure proper data types
 * @param {string} eventType - The type of event
 * @param {object} eventData - The event data to sanitize
 * @returns {object} - The sanitized event data
 */
const sanitizeEventData = (eventType, eventData) => {
  if (!eventData) {
    return {};
  }

  // Create a copy of the event data to avoid modifying the original
  const sanitized = { ...eventData };

  // Handle common fields
  if (sanitized.date === undefined) {
    sanitized.date = new Date().toISOString().split('T')[0];
  }

  // Type-specific validation
  switch (eventType) {
    case 'cost':
      // Ensure category matches the server's enum values
      const validCategories = ['seeds', 'fertilizer', 'pesticide', 'labor', 'equipment', 'other'];
      const categoryLower = (sanitized.category || '').toLowerCase();

      // Try to map to a valid category
      sanitized.category = validCategories.includes(categoryLower) ? categoryLower : 'other';

      // Ensure amount is a valid number
      if (sanitized.amount !== undefined) {
        const parsedAmount = parseFloat(sanitized.amount);
        sanitized.amount = isNaN(parsedAmount) ? 0 : parsedAmount;
      } else {
        sanitized.amount = 0;
      }

      // Ensure description exists
      if (!sanitized.description) {
        sanitized.description = 'Expense';
      }
      break;

    case 'irrigation':
    case 'fertilization':
      // Ensure amount is a valid number
      if (sanitized.amount !== undefined) {
        const parsedAmount = parseFloat(sanitized.amount);
        sanitized.amount = isNaN(parsedAmount) ? 0 : parsedAmount;
      }
      break;

    case 'growth':
      // Ensure height is a valid number
      if (sanitized.height !== undefined) {
        const parsedHeight = parseFloat(sanitized.height);
        sanitized.height = isNaN(parsedHeight) ? 0 : parsedHeight;
      }
      break;

    case 'harvest':
      // Ensure yield is a valid number
      if (sanitized.yield !== undefined) {
        const parsedYield = parseFloat(sanitized.yield);
        sanitized.yield = isNaN(parsedYield) ? 0 : parsedYield;
      }
      break;

    case 'labor':
      // Ensure hours is a valid number
      if (sanitized.hours !== undefined) {
        const parsedHours = parseFloat(sanitized.hours);
        sanitized.hours = isNaN(parsedHours) ? 0 : parsedHours;
      }
      break;
  }

  return sanitized;
};