---
title: 'Tailwind CSS Tips and Tricks'
pubDate: 2025-07-24T00:00:00.000Z
description: 'Collection of useful Tailwind CSS tips and tricks for common styling challenges. Master responsive design, component patterns, utility-first approach, and advanced techniques to boost your frontend development productivity.'
author: 'Remy'
tags: ['Tailwind', 'Frontend', 'Web Development']
---


> This document will be continuously updated.



## How to make text smaller than `text-xs` in Tailwind CSS?

In Tailwind CSS, the smallest built-in font size is `text-xs`, which corresponds to `0.75rem` (12px). However, if you need a **smaller font size** than `text-xs`, you can do it in a few ways:


✅ **Option 1: Use Arbitrary Value**

Tailwind supports arbitrary values for font size using square brackets:

```html
<p class="text-[10px]">Tiny text</p>
```

You can specify any size like `text-[9px]`, `text-[0.6rem]`, etc.

✅ **Option 2: Extend Tailwind Config**

You can define custom sizes in your Tailwind config (`tailwind.config.js`):

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontSize: {
        'xxs': '0.625rem', // 10px
      },
    },
  },
}
```

Then use it like:

```html
<p class="text-xxs">Smaller than xs</p>
```

✅ **Option 3: Use Utility with Custom Class**

You can also define a utility class directly:

```css
/* styles.css */
.text-xxs {
  font-size: 10px;
}
```

And use it with Tailwind classes:

```html
<p class="text-xxs text-gray-500">Really small text</p>
```

