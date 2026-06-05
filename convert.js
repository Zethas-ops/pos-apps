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
    
    // Replace classNames with text-gray-800 to have dark:text-gray-100
    // and text-gray-900 to have dark:text-white
    contents = contents.replace(/text-gray-800(?! dark:)/g, "text-gray-800 dark:text-gray-100");
    contents = contents.replace(/text-gray-900(?! dark:)/g, "text-gray-900 dark:text-white");
    contents = contents.replace(/text-gray-700(?! dark:)/g, "text-gray-700 dark:text-gray-200");
    contents = contents.replace(/bg-white(?! dark:)/g, "bg-white dark:bg-gray-800");
    contents = contents.replace(/bg-gray-50(?! dark:)/g, "bg-gray-50 dark:bg-gray-900");
    contents = contents.replace(/bg-gray-100(?! dark:)/g, "bg-gray-100 dark:bg-gray-700");
    contents = contents.replace(/bg-gray-200(?! dark:)/g, "bg-gray-200 dark:bg-gray-600");
    
    // Borders
    contents = contents.replace(/border-gray-200(?! dark:)/g, "border-gray-200 dark:border-gray-700");

    if (contents !== original) {
      fs.writeFileSync(filePath, contents, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
