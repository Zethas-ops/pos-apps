const fs = require('fs');
let file = fs.readFileSync('./pos-apps/frontend/src/pages/Dashboard.jsx', 'utf8');

file = file.replace(/dark:[a-zA-Z0-9-\/]+/g, '');

file = file.replace('className="p-8 ">Loading dashboard...</div>', 'className="p-8 dark:bg-gray-900 dark:text-gray-100 min-h-screen">Loading dashboard...</div>');
file = file.replace('<div className="p-8 space-y-6 bg-gray-50  min-h-screen">', '<div className="p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">');
file = file.replace('<h1 className="text-3xl font-bold text-gray-900 ">Dashboard</h1>', '<h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>');

file = file.replace(/text-xl sm:text-2xl font-bold/g, 'text-base lg:text-lg font-bold');

fs.writeFileSync('./pos-apps/frontend/src/pages/Dashboard.jsx', file);
