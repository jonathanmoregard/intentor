#!/bin/bash

echo "🚀 Building Intender Extension..."

# 1. Clear output directory
echo "🧹 Clearing previous build..."
rm -rf .output

# Build the extension
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# 2. Create temp directory structure
echo "📦 Creating distribution package..."
mkdir -p temp/intender-chrome/chrome-mv3

# Copy chrome-mv3 contents to temp directory
cp -r .output/chrome-mv3/* temp/intender-chrome/chrome-mv3/

# 3. Create zip file in .output folder
cd temp
zip -r ../.output/intender-chrome.zip intender-chrome/

# 4. Clean up temp directory
cd ..
rm -rf temp

echo "✅ Distribution package created: .output/intender-chrome.zip"
echo "📁 Contents: intender-chrome/chrome-mv3/ (containing all extension files)"
echo "🎉 Ready to share with your peeps!" 