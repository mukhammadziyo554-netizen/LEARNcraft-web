/**
 * Access Control System for LEARNcraft
 * Manages founder admin access and pro version requirements
 */

const FOUNDER_EMAIL = 'mukhammadziyo554@gmail.com';
const PRO_FEATURES = ['ai', 'course_creation', 'advanced_analytics', 'custom_paths'];

/**
 * Check if user is the founder admin
 * @param {string} email - User email to check
 * @returns {boolean} - True if user is founder
 */
const isFounder = (email) => {
  return email && email.toLowerCase() === FOUNDER_EMAIL.toLowerCase();
};

/**
 * Get user profile from localStorage
 * @returns {object} - User profile object
 */
const getCurrentUserProfile = () => {
  try {
    const profileJson = localStorage.getItem('learncraft_current_user');
    return profileJson ? JSON.parse(profileJson) : null;
  } catch (e) {
    console.error('Error parsing user profile:', e);
    return null;
  }
};

/**
 * Check if current user is founder
 * @returns {boolean} - True if current user is founder
 */
const isCurrentUserFounder = () => {
  const profile = getCurrentUserProfile();
  return profile && isFounder(profile.email);
};

/**
 * Check if user has pro version
 * @param {object} userProfile - User profile object
 * @returns {boolean} - True if user has pro access
 */
const hasProVersion = (userProfile) => {
  if (!userProfile) return false;
  
  // Founder always has pro access
  if (isFounder(userProfile.email)) {
    return true;
  }
  
  // Check subscription status
  if (userProfile.isPremium || userProfile.subscription === 'premium') {
    return true;
  }
  
  // Check if pro trial/period is still valid
  if (userProfile.proDemoExpiry) {
    const expiryDate = new Date(userProfile.proDemoExpiry);
    if (new Date() <= expiryDate) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check if feature is accessible for user
 * @param {string} feature - Feature to check (e.g., 'ai', 'course_creation')
 * @param {object} userProfile - User profile object (optional, uses current if not provided)
 * @returns {boolean} - True if feature is accessible
 */
const canAccessFeature = (feature, userProfile = null) => {
  const profile = userProfile || getCurrentUserProfile();
  
  if (!profile) return false;
  
  // Founder has access to all features
  if (isFounder(profile.email)) {
    return true;
  }
  
  // If feature requires pro and user has it
  if (PRO_FEATURES.includes(feature)) {
    return hasProVersion(profile);
  }
  
  // Free features are accessible to all authenticated users
  return true;
};

/**
 * Check if AI feature is accessible
 * @param {object} userProfile - User profile object (optional)
 * @returns {boolean} - True if AI is accessible
 */
const canAccessAI = (userProfile = null) => {
  return canAccessFeature('ai', userProfile);
};

/**
 * Get access status message for feature
 * @param {string} feature - Feature name
 * @param {object} userProfile - User profile object (optional)
 * @returns {object} - {hasAccess: boolean, message: string}
 */
const getAccessStatus = (feature, userProfile = null) => {
  const profile = userProfile || getCurrentUserProfile();
  
  if (!profile) {
    return {
      hasAccess: false,
      message: 'Please log in to access this feature'
    };
  }
  
  if (canAccessFeature(feature, profile)) {
    return {
      hasAccess: true,
      message: 'Access granted'
    };
  }
  
  if (isFounder(profile.email)) {
    return {
      hasAccess: true,
      message: 'Access granted (Founder)'
    };
  }
  
  return {
    hasAccess: false,
    message: `This feature requires a pro subscription. Upgrade now to access ${feature}.`
  };
};

/**
 * Set pro demo for user (for trial periods)
 * @param {string} daysValid - Number of days the demo is valid
 * @param {object} userProfile - User profile to update (optional, uses current if not provided)
 */
const setProDemo = (daysValid = 7, userProfile = null) => {
  let profile = userProfile || getCurrentUserProfile();
  
  if (!profile) {
    console.error('No user profile found');
    return false;
  }
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysValid);
  
  profile.proDemoExpiry = expiryDate.toISOString();
  profile.proDemoStartDate = new Date().toISOString();
  
  localStorage.setItem('learncraft_current_user', JSON.stringify(profile));
  return true;
};

/**
 * Get remaining pro trial days
 * @param {object} userProfile - User profile (optional)
 * @returns {number|null} - Days remaining or null if no trial
 */
const getProTrialDaysRemaining = (userProfile = null) => {
  const profile = userProfile || getCurrentUserProfile();
  
  if (!profile || !profile.proDemoExpiry) {
    return null;
  }
  
  const expiryDate = new Date(profile.proDemoExpiry);
  const now = new Date();
  
  if (now > expiryDate) {
    return 0;
  }
  
  const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  return daysRemaining;
};

/**
 * Handle feature access denial with UI feedback
 * @param {string} feature - Feature name
 * @param {HTMLElement} container - Container to show message in (optional)
 */
const showAccessDenialMessage = (feature, container = null) => {
  const profile = getCurrentUserProfile();
  const status = getAccessStatus(feature, profile);
  
  if (status.hasAccess) return;
  
  const message = `
    <div style="
      background: #ff6b6b;
      color: white;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
      text-align: center;
      font-weight: 500;
    ">
      ${status.message}
    </div>
  `;
  
  if (container) {
    container.insertAdjacentHTML('beforeend', message);
  } else {
    console.warn('Feature Access Denied:', status.message);
  }
};

// Export functions
window.accessControl = {
  isFounder,
  isCurrentUserFounder,
  hasProVersion,
  canAccessFeature,
  canAccessAI,
  getAccessStatus,
  setProDemo,
  getProTrialDaysRemaining,
  showAccessDenialMessage,
  getCurrentUserProfile,
  FOUNDER_EMAIL,
  PRO_FEATURES
};

export {
  isFounder,
  isCurrentUserFounder,
  hasProVersion,
  canAccessFeature,
  canAccessAI,
  getAccessStatus,
  setProDemo,
  getProTrialDaysRemaining,
  showAccessDenialMessage,
  getCurrentUserProfile,
  FOUNDER_EMAIL,
  PRO_FEATURES
};
