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
    
    // Add dark border and bg and text for inputs/selects.
    // the safest approach is to add universal input styling when not already present
    contents = contents.replace(/border-gray-300(?! dark:)/g, "border-gray-300 dark:border-gray-600");
    contents = contents.replace(/bg-blue-50(?! dark:)/g, "bg-blue-50 dark:bg-blue-900/30");
    contents = contents.replace(/text-blue-500(?! dark:)/g, "text-blue-500 dark:text-blue-400");
    contents = contents.replace(/text-blue-600(?! dark:)/g, "text-blue-600 dark:text-blue-400");

    if (contents !== original) {
      fs.writeFileSync(filePath, contents, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
