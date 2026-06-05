const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/src/pages');

fs.readdirSync(directoryPath).forEach(f => {
  let filePath = path.join(directoryPath, f);
  if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
    let contents = fs.readFileSync(filePath, 'utf8');
    
    // Replace standard h1 with a beautiful gradient
    contents = contents.replace(
      /<h1 className="text-3xl font-bold text-gray-(800|900)( dark:text-(gray-100|white))?">/g,
      '<h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-blue-400 dark:to-indigo-300">'
    );
    
    fs.writeFileSync(filePath, contents, 'utf8');
  }
});
