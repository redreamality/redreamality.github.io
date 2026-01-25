# Anti-Adblock Module

This module detects ad blockers and shows a friendly message to users encouraging them to disable their ad blocker to support the site.

## Features

- **Ad Block Detection**: Detects common ad blockers by checking if ad-related elements are blocked
- **User-Friendly Message**: Shows a polite, non-intrusive message asking users to whitelist the site
- **Configurable**: Customize behavior, messages, and styling through configuration
- **Privacy-Friendly**: Doesn't track users or collect personal data
- **Session Management**: Option to show message only once per session

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

1. **Detection**: The module creates a hidden test element with ad-related class names
2. **Analysis**: Checks if the element is hidden or modified by ad blockers
3. **Response**: If blocked, shows a friendly message with instructions
4. **User Control**: Users can dismiss the message with the close button

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

1. **Be Polite**: The message should be friendly and non-confrontational
2. **Explain Value**: Tell users why ads are important for your site
3. **Provide Instructions**: Make it easy for users to whitelist your site
4. **Respect Privacy**: Don't track users who dismiss the message
5. **Don't Overdo It**: Show the message only once per session

## Technical Details

### Detection Methods

The module uses multiple detection techniques:
- Element dimension checking (height, width)
- Position verification
- CSS display property checking
- Multiple ad-related class names

### Performance Impact

- Minimal: The detection runs asynchronously after page load
- Lightweight: Uses simple DOM operations
- Non-blocking: Doesn't interfere with page rendering

## Troubleshooting

**Issue**: Message doesn't appear even with ad blocker enabled
- **Solution**: Check browser console for errors
- **Solution**: Verify the component is properly imported in Layout.astro
- **Solution**: Ensure `enabled: true` in configuration

**Issue**: Message appears when no ad blocker is active
- **Solution**: Adjust sensitivity setting to 'low'
- **Solution**: Check for other browser extensions that might interfere

## Future Enhancements

- Multiple message templates
- A/B testing for different messages
- Analytics integration (opt-in)
- Localization support for different languages
- Custom styling themes

## License

This module is part of the project and follows the same licensing terms.