const fs = require('fs');
const path = require('path');

const walk = (dir, callback) => {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

const replaceInFile = (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replacements
  content = content.replace(/text-white/g, 'text-slate-900');
  content = content.replace(/text-slate-200/g, 'text-slate-800');
  content = content.replace(/text-slate-300/g, 'text-slate-700');
  content = content.replace(/text-slate-400/g, 'text-slate-600');
  
  content = content.replace(/border-slate-700/g, 'border-slate-200');
  content = content.replace(/border-slate-800/g, 'border-slate-100');
  content = content.replace(/bg-slate-800/g, 'bg-slate-100');
  
  // Replace card borders
  content = content.replace(/border-slate-700\/50/g, 'border-slate-200 shadow-sm');

  // Fix buttons/icons on primary colored backgrounds that need white text
  // 1. bg-accent-blue text-slate-900 -> bg-accent-blue text-white
  content = content.replace(/bg-accent-blue([^"']*)text-slate-900/g, 'bg-accent-blue$1text-white');
  content = content.replace(/bg-accent-green([^"']*)text-slate-900/g, 'bg-accent-green$1text-white');
  content = content.replace(/bg-status-red([^"']*)text-slate-900/g, 'bg-status-red$1text-white');
  content = content.replace(/bg-status-amber([^"']*)text-slate-900/g, 'bg-status-amber$1text-white');

  // Fix standalone icons inside links with these backgrounds:
  if (content.includes('bg-accent-blue') || content.includes('bg-accent-green')) {
    // This is hard to regex perfectly. Let's just fix known specific cases.
    content = content.replace(/<Plus size=\{36\} className="text-slate-900"/g, '<Plus size={36} className="text-white"');
  }

  if (filePath.includes('Button.tsx')) {
    content = content.replace(/"bg-accent-green text-slate-900"/g, '"bg-accent-green text-white"');
    content = content.replace(/"bg-accent-blue text-slate-900"/g, '"bg-accent-blue text-white"');
    content = content.replace(/"border border-slate-600 text-slate-900 bg-transparent"/g, '"border border-slate-300 text-slate-900 bg-transparent"');
    content = content.replace(/"bg-status-red text-slate-900"/g, '"bg-status-red text-white"');
    content = content.replace(/"bg-brand-surface text-slate-900 border border-slate-200 shadow-sm"/g, '"bg-white text-slate-900 border border-slate-200 shadow-sm"');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
};

walk('./src', replaceInFile);
console.log('Done');
