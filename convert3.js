const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/src/pages');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk(directoryPath, function(filePath) {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
    let contents = fs.readFileSync(filePath, 'utf8');
    let original = contents;
    
    contents = contents.replace(/text-gray-500(?! dark:)/g, "text-gray-500 dark:text-gray-400");
    contents = contents.replace(/text-gray-600(?! dark:)/g, "text-gray-600 dark:text-gray-300");
    contents = contents.replace(/bg-transparent(?! dark:)/g, "bg-transparent dark:text-white");
    
    // Specifically target inputs and selects that don't have dark mode text colors
    contents = contents.replace(/<input([^>]*?)className="(.*?)"/g, (match, prefix, classNames) => {
        if (!classNames.includes('dark:bg-') && !classNames.includes('bg-transparent')) {
            classNames += " dark:bg-gray-800 dark:text-white";
        }
        return `<input${prefix}className="${classNames}"`;
    });
    
    contents = contents.replace(/<select([^>]*?)className="(.*?)"/g, (match, prefix, classNames) => {
        if (!classNames.includes('dark:bg-') && !classNames.includes('bg-transparent')) {
            classNames += " dark:bg-gray-800 dark:text-white";
        }
        return `<select${prefix}className="${classNames}"`;
    });

    if (contents !== original) {
      fs.writeFileSync(filePath, contents, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
