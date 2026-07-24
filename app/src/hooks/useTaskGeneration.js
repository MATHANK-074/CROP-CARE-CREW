import { useState, useEffect } from 'react';

/**
 * Hook to handle automatic task generation when user visits the site
 * Only generates if user hasn't received tasks in the last 24 hours
 */
const useTaskGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [error, setError] = useState(null);

  const generateTasks = async (userId, location = null) => {
    if (!userId || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/generate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          location,
          diseaseRisks: {} // Could be enhanced with real disease data
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to generate tasks');
      }

      setGenerationResult(result);

      if (result.generated) {
        console.log(`✅ Task generation successful: ${result.data.taskCount} tasks generated`);
      } else {
        console.log(`ℹ️ Task generation skipped: ${result.message}`);
      }

      return result;
    } catch (err) {
      console.error('❌ Task generation error:', err.message);
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate tasks on mount if user ID is available
  const autoGenerateOnVisit = async () => {
    try {
      // Get user ID from localStorage
      let userId = null;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          userId = user.id || user._id;
        }
      } catch (parseError) {
        console.warn('Could not parse user from localStorage');
        return;
      }

      if (!userId) {
        console.log('No user ID found, skipping task generation');
        return;
      }

      // Check if we should generate (not generated recently)
      const lastGeneration = localStorage.getItem(`lastTaskGeneration_${userId}`);
      const now = new Date().getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (lastGeneration && (now - parseInt(lastGeneration)) < twentyFourHours) {
        console.log('Tasks generated recently, skipping auto-generation');
        return;
      }

      console.log('🚀 Auto-generating tasks for user visit...');
      const result = await generateTasks(userId);

      // Update last generation timestamp
      if (result.generated) {
        localStorage.setItem(`lastTaskGeneration_${userId}`, now.toString());
      }

    } catch (error) {
      console.warn('Auto task generation failed:', error.message);
      // Don't throw error for auto-generation, just log it
    }
  };

  return {
    generateTasks,
    autoGenerateOnVisit,
    isGenerating,
    generationResult,
    error,
    resetError: () => setError(null)
  };
};

export default useTaskGeneration;