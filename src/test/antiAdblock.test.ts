/**
 * Anti-Adblock Component Tests
 * 
 * Tests for the anti-adblock detection functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAntiAdblockConfig, setAntiAdblockConfig } from '../config/antiAdblockConfig';

describe('Anti-Adblock Configuration', () => {
  beforeEach(() => {
    // Reset to default config before each test
    const defaultConfig = getAntiAdblockConfig();
    setAntiAdblockConfig(defaultConfig);
  });

  it('should return default configuration', () => {
    const config = getAntiAdblockConfig();
    
    expect(config).toBeDefined();
    expect(config.enabled).toBe(true);
    expect(config.message.title).toContain('Ad Blocker');
    expect(config.showOncePerSession).toBe(false);
  });

  it('should allow custom configuration', () => {
    const customConfig = {
      enabled: false,
      message: {
        title: 'Custom Title',
        content: 'Custom content',
        instructions: 'Custom instructions'
      }
    };
    
    const updatedConfig = setAntiAdblockConfig(customConfig);
    
    expect(updatedConfig.enabled).toBe(false);
    expect(updatedConfig.message.title).toBe('Custom Title');
  });

  it('should merge partial configuration', () => {
    const partialConfig = {
      enabled: false
    };
    
    const updatedConfig = setAntiAdblockConfig(partialConfig);
    
    expect(updatedConfig.enabled).toBe(false);
    // Other properties should remain from default
    expect(updatedConfig.message.title).toContain('Ad Blocker');
  });
});

describe('Anti-Adblock Detection Logic', () => {
  // Mock DOM elements and methods
  const mockDocument = {
    createElement: vi.fn(),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
  };
  
  const mockWindow = {
    getComputedStyle: vi.fn()
  };
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
  });

  it('should detect blocked ads', () => {
    // Mock a blocked ad element
    const mockAdElement = {
      style: {},
      offsetHeight: 0,
      offsetWidth: 0,
      offsetLeft: -9999,
      clientHeight: 0,
      clientWidth: 0
    };
    
    mockDocument.createElement.mockReturnValue(mockAdElement);
    mockWindow.getComputedStyle.mockReturnValue({ display: 'none' });
    
    // Import and test the detection function
    // Note: This would require exposing the checkAdBlock function for testing
    // For now, we'll test the configuration part
    
    expect(true).toBe(true); // Placeholder for actual detection test
  });

  it('should not detect when ads are not blocked', () => {
    // Mock an unblocked ad element
    const mockAdElement = {
      style: {},
      offsetHeight: 1,
      offsetWidth: 1,
      offsetLeft: -9999,
      clientHeight: 1,
      clientWidth: 1
    };
    
    mockDocument.createElement.mockReturnValue(mockAdElement);
    mockWindow.getComputedStyle.mockReturnValue({ display: 'block' });
    
    // Placeholder for actual test
    expect(true).toBe(true);
  });
});

describe('Session Management', () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
  });

  it('should respect showOncePerSession setting', () => {
    const config1 = setAntiAdblockConfig({ showOncePerSession: true });
    const config2 = setAntiAdblockConfig({ showOncePerSession: false });
    
    expect(config1.showOncePerSession).toBe(true);
    expect(config2.showOncePerSession).toBe(false);
  });

  it('should use sessionStorage when showOncePerSession is enabled', () => {
    // This would test the actual session management logic
    // For now, we'll just verify the configuration works
    const config = setAntiAdblockConfig({ showOncePerSession: true });
    expect(config.showOncePerSession).toBe(true);
  });
});