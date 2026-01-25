# Anti-Adblock Module

This module detects ad blockers and shows a modal message to users, encouraging them to disable their ad blocker to support the site.

## Features

- **Ad Block Detection**: Detects common ad blockers by checking if ad-related elements are blocked or hidden.
- **Full-Screen Modal**: Shows a modal that covers the content until the ad blocker is disabled.
- **Friendly Explanation**: Provides a polite explanation of why ads are necessary and how to whitelist the site.
- **Configurable**: Customize behavior, messages, and styling through configuration.
- **Privacy-Friendly**: Doesn't track users or collect personal data.
- **Mandatory Refresh**: Once disabled, users refresh the page to access the content.

## Installation

The module is already integrated into the project. It consists of:

1. **Component**: `src/components/AntiAdblock.astro` - The main component
2. **Configuration**: `src/config/antiAdblockConfig.ts` - Configuration options
3. **Integration**: Already added to `src/layouts/Layout.astro`

## Configuration

Edit `src/config/antiAdblockConfig.ts` to customize the behavior:

```typescript
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
```

## How It Works

1. **Detection**: The module creates a hidden test element with common ad-related class names (e.g., `adsbox`, `ad-unit`, `google-ads`).
2. **Analysis**: Checks if the element is hidden or removed from the DOM by ad blockers while it is still in the document.
3. **Response**: If blocked, shows a modal that covers the whole screen and prevents interaction with the underlying content.
4. **User Control**: In modal mode, the user must disable their ad blocker and refresh the page to continue.

## Testing

A test page is available at `/test-antiadblock` that:
- Shows debug information about ad block detection
- Provides test instructions
- Allows you to verify the functionality

## Browser Compatibility

The module works with all modern browsers:
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Android Chrome)

## Disabling the Module

To disable the anti-adblock module completely:

```typescript
// In src/config/antiAdblockConfig.ts
const defaultConfig: AntiAdblockConfig = {
  enabled: false, // Set to false to disable
  // ... rest of config
};
```

## Best Practices

1. **Be Polite**: The message should be friendly and non-confrontational.
2. **Explain Value**: Tell users why ads are important for your site (e.g., keeping content free).
3. **Provide Instructions**: Make it easy for users to whitelist your site for common blockers like uBlock Origin, AdBlock, and AdGuard.
4. **Consistency**: The current configuration enforces the modal on every page load if an ad blocker is detected to ensure support.

## Technical Details

### Detection Methods

The module uses multiple detection techniques:
- Element dimension checking (height, width, clientHeight, clientWidth)
- CSS display and visibility property checking
- Multiple common ad-related class names

### Performance Impact

- Minimal: The detection runs asynchronously after page load or after a short delay.
- Lightweight: Uses simple DOM operations.
- Non-blocking: Doesn't interfere with initial page rendering.

## Troubleshooting

**Issue**: Message doesn't appear even with ad blocker enabled
- **Solution**: Check browser console for errors.
- **Solution**: Verify the component is properly imported in `Layout.astro`.
- **Solution**: Ensure `enabled: true` in configuration.
- **Solution**: Some ad blockers might need a few seconds to trigger; the script waits 1 second by default.

**Issue**: Message appears when no ad blocker is active
- **Solution**: Ensure no other browser extensions (like privacy extensions) are blocking elements with "ad" in their class name.
- **Solution**: Check if the test element is being correctly added and analyzed before being removed.

## License

This module is part of the project and follows the same licensing terms.
