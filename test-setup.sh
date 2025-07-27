#!/bin/bash

echo "🚀 Testing ShareIt Cross-Platform Setup"
echo "========================================="

echo ""
echo "1. TypeScript compilation check..."
echo "   📝 Checking TypeScript compilation..."
npm run type-check
if [ $? -eq 0 ]; then
    echo "   ✅ TypeScript compilation successful"
else
    echo "   ❌ TypeScript compilation failed"
    exit 1
fi

echo ""
echo "2. Electron build check..."
echo "   🔧 Building Electron main process..."
npm run build:electron
if [ $? -eq 0 ]; then
    echo "   ✅ Electron build successful"
else
    echo "   ❌ Electron build failed"
    exit 1
fi

echo ""
echo "3. Project structure verification..."
echo "   📁 Checking project structure..."

# Check key files exist
key_files=(
    "App.tsx"
    "tsconfig.json"
    "src/types/index.ts"
    "src/utils/platform.ts"
    "src/store/hooks.ts"
    "src/store/index.ts"
    "electron/main.ts"
    "electron/preload.ts"
    "dist/electron/main.js"
    "dist/electron/preload.js"
)

for file in "${key_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing"
    fi
done

echo ""
echo "4. Available scripts:"
echo "   📱 Mobile: npm start, npm run android, npm run ios"
echo "   🌐 Web: npm run web"
echo "   🖥️  Desktop: npm run electron:dev"
echo "   📦 Build: npm run package:electron"

echo ""
echo "🎉 Cross-platform setup verification complete!"
echo ""
echo "Next steps:"
echo "1. For mobile development: npm start"
echo "2. For web development: npm run web"
echo "3. For desktop development: npm run electron:dev"
echo "4. For production builds: npm run package:electron"
echo ""
echo "📖 See CROSS_PLATFORM_SETUP.md for detailed instructions"