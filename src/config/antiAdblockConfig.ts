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
    title: '👋 Hello there!',
    content: 'It looks like you\'re using an ad blocker. We understand - ads can be annoying! However, ads help us keep this site running and provide free content.',
    instructions: 'Please consider supporting us by whitelisting this site in your ad blocker.'
  },
  styling: {
    position: 'bottom-right',
    backgroundColor: '#f8f9fa',
    textColor: '#333',
    borderColor: '#dee2e6'
  },
  sensitivity: 'medium',
  showOncePerSession: true
};

export function getAntiAdblockConfig(): AntiAdblockConfig {
  return defaultConfig;
}

export function setAntiAdblockConfig(config: Partial<AntiAdblockConfig>): AntiAdblockConfig {
  return { ...defaultConfig, ...config };
}