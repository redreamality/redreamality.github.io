# Translation Scripts Migration Guide

The translation debugging and automation scripts have been reorganized into a cleaner, more maintainable structure.

## 📁 New Organization

### Before (Root Directory)
```
debug-translation-api.mjs      ❌ Moved
test-translation-local.mjs     ❌ Moved  
trigger-batch-translation.mjs  ❌ Moved
translation-toolkit.mjs        ❌ Moved
debug-translation.ps1          ❌ Moved
debug-translation.bat          ❌ Moved
DEBUG-TRANSLATION.md           ❌ Moved
```

### After (Organized Structure)
```
scripts/translation/
├── debug/
│   ├── api-test.mjs           ✅ Was: debug-translation-api.mjs
│   └── translation-test.mjs   ✅ Was: test-translation-local.mjs
├── automation/
│   └── trigger-batch.mjs      ✅ Was: trigger-batch-translation.mjs
├── wrappers/
│   ├── debug.ps1              ✅ Was: debug-translation.ps1
│   └── debug.bat              ✅ Was: debug-translation.bat
├── toolkit.mjs                ✅ Was: translation-toolkit.mjs
└── README.md                  ✅ New comprehensive guide

docs/translation/
└── DEBUG-GUIDE.md             ✅ Was: DEBUG-TRANSLATION.md
```

## 🔄 Command Updates

### Debug Commands
```bash
# OLD
node debug-translation-api.mjs
node test-translation-local.mjs

# NEW
node scripts/translation/debug/api-test.mjs
node scripts/translation/debug/translation-test.mjs
```

### Automation Commands
```bash
# OLD
node trigger-batch-translation.mjs --target-lang en

# NEW
node scripts/translation/automation/trigger-batch.mjs --target-lang en
```

### Toolkit Commands
```bash
# OLD
node translation-toolkit.mjs

# NEW
node scripts/translation/toolkit.mjs
```

### Platform Wrappers
```powershell
# OLD
.\debug-translation.ps1

# NEW
.\scripts\translation\wrappers\debug.ps1
```

```cmd
# OLD
debug-translation.bat

# NEW
scripts\translation\wrappers\debug.bat
```

## 📚 Documentation Updates

### Old Documentation
- `DEBUG-TRANSLATION.md` → `docs/translation/DEBUG-GUIDE.md`

### New Documentation
- `scripts/translation/README.md` - Main guide for the script suite
- `docs/translation/DEBUG-GUIDE.md` - Comprehensive debugging guide

## ✅ Benefits of New Structure

### 1. **Better Organization**
- Scripts grouped by purpose (debug, automation, wrappers)
- Clear separation of concerns
- Easier to find the right tool

### 2. **Improved Maintainability**
- Logical directory structure
- Consistent naming conventions
- Centralized documentation

### 3. **Enhanced Discoverability**
- README files in each directory
- Clear usage examples
- Comprehensive guides

### 4. **Future-Proof**
- Easy to add new tools
- Scalable structure
- Version control friendly

## 🚀 Quick Migration

If you have existing scripts or documentation referencing the old paths:

### 1. Update Scripts/Automation
Replace old paths with new ones:
```bash
# Find and replace in your scripts
sed -i 's/debug-translation-api.mjs/scripts\/translation\/debug\/api-test.mjs/g' your-script.sh
sed -i 's/test-translation-local.mjs/scripts\/translation\/debug\/translation-test.mjs/g' your-script.sh
```

### 2. Update Documentation
Update any references in your documentation:
- `debug-translation-api.mjs` → `scripts/translation/debug/api-test.mjs`
- `test-translation-local.mjs` → `scripts/translation/debug/translation-test.mjs`
- `trigger-batch-translation.mjs` → `scripts/translation/automation/trigger-batch.mjs`
- `translation-toolkit.mjs` → `scripts/translation/toolkit.mjs`

### 3. Update Bookmarks/Shortcuts
If you have bookmarks or shortcuts to the old scripts, update them to use the new paths.

## 🔧 No Functional Changes

**Important**: The functionality of all scripts remains exactly the same. Only the file locations and organization have changed.

- ✅ Same API endpoints and configuration
- ✅ Same command-line options
- ✅ Same output and behavior
- ✅ Same environment variables

## 📋 Verification Checklist

After migration, verify everything works:

- [ ] API debug tests run successfully
- [ ] Translation tests pass
- [ ] Batch translation trigger works
- [ ] Platform wrappers execute correctly
- [ ] Toolkit interface loads properly
- [ ] Documentation is accessible

## 🆘 Need Help?

If you encounter issues after migration:

1. **Check paths**: Ensure you're using the new script locations
2. **Verify permissions**: Make sure scripts are executable
3. **Test functionality**: Run debug tools to verify everything works
4. **Review documentation**: Check the new README files for guidance

## 🎯 Next Steps

1. **Update your workflows** to use the new script paths
2. **Review the new documentation** for enhanced features
3. **Explore the toolkit** for improved management capabilities
4. **Share the new structure** with your team

---

**💡 The new organization makes the translation toolkit more professional, maintainable, and user-friendly while preserving all existing functionality.**
