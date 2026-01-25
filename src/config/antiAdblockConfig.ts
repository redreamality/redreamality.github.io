/**
 * Anti-Adblock Configuration
 * 
 * This configuration file allows customization of the anti-adblock behavior
 */

export interface AntiAdblockConfig {
  // Whether to enable the anti-adblock detection
  enabled: boolean;
  
  // Message to show when ad blocker is detected
  message: {
    title: string;
    content: string;
    instructions: string;
  };
  
  // Styling options for the anti-adblock message
  styling: {
    mode: 'notification' | 'modal';
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    backgroundColor: string;
    textColor: string;
    borderColor: string;
  };
  
  // Detection sensitivity (how aggressively to detect ad blockers)
  sensitivity: 'low' | 'medium' | 'high';
  
  // Whether to show the message on every page load or only once per session
  showOncePerSession: boolean;
}

// Default configuration
const defaultConfig: AntiAdblockConfig = {
  enabled: true,
  message: {
    title: 'Ad Blocker Detected',
    content: 'We noticed that you are using an ad blocker. This site relies on advertisements to provide free content and stay operational.',
    instructions: 'To continue accessing our content, please disable your ad blocker or whitelist our site. Once you\'ve disabled it, please refresh the page.'
  },
  styling: {
    mode: 'modal',
    position: 'bottom-right',
    backgroundColor: '#f8f9fa',
    textColor: '#333',
    borderColor: '#dee2e6'
  },
  sensitivity: 'medium',
  showOncePerSession: false
};

export function getAntiAdblockConfig(): AntiAdblockConfig {
  return defaultConfig;
}

export function setAntiAdblockConfig(config: Partial<AntiAdblockConfig>): AntiAdblockConfig {
  return { ...defaultConfig, ...config };
}