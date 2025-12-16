#!/usr/bin/env node
/**
 * Generate PWA icons for StrategyHub
 * Run with: node generate-icons.js
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, size, size);
  
  // Bitcoin orange gradient overlay
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(247, 147, 26, 0.2)');
  gradient.addColorStop(1, 'rgba(247, 147, 26, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Bitcoin symbol - positioned higher to make room for HUB text
  ctx.fillStyle = '#f7931a';
  ctx.font = `bold ${Math.floor(size * 0.55)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('₿', size/2, size * 0.45);
  
  // HUB text at bottom
  ctx.fillStyle = '#f7931a';
  ctx.font = `bold ${Math.floor(size * 0.14)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HUB', size/2, size * 0.82);
  
  return canvas;
}

try {
  // Generate 192x192 icon
  const icon192 = generateIcon(192);
  const buffer192 = icon192.toBuffer('image/png');
  fs.writeFileSync('icon-192x192.png', buffer192);
  console.log('✓ Generated icon-192x192.png');
  
  // Generate 512x512 icon
  const icon512 = generateIcon(512);
  const buffer512 = icon512.toBuffer('image/png');
  fs.writeFileSync('icon-512x512.png', buffer512);
  console.log('✓ Generated icon-512x512.png');
  
  console.log('\nIcons generated successfully!');
} catch (error) {
  if (error.message.includes('Cannot find module')) {
    console.log('Canvas module not found. Install with: npm install canvas');
    console.log('Or use generate-icons.html in a browser to generate icons.');
  } else {
    console.error('Error generating icons:', error.message);
  }
  process.exit(1);
}

