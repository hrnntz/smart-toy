const fs = require('fs');
const html = fs.readFileSync('C:/Users/herna/.gemini/antigravity-cli/brain/3ac32324-4f1c-4f86-a9e2-d0044388e0ff/.system_generated/steps/815/content.md', 'utf8');
console.log('Llama:', [...new Set(html.match(/llama-[^\s"\'<>]+/ig))].join(', '));
console.log('Gemma:', [...new Set(html.match(/gemma-[^\s"\'<>]+/ig))].join(', '));
console.log('Mixtral:', [...new Set(html.match(/mixtral-[^\s"\'<>]+/ig))].join(', '));
console.log('Other:', [...new Set(html.match(/[a-z0-9]+-[0-9]+b[^\s"\'<>]+/ig))].join(', '));
