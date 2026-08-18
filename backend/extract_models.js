const fs = require('fs');
const html = fs.readFileSync('C:/Users/herna/.gemini/antigravity-cli/brain/3ac32324-4f1c-4f86-a9e2-d0044388e0ff/.system_generated/steps/752/content.md', 'utf8');
const regex = /llama-[^\s"\'<>]+/ig;
const matches = [...new Set(html.match(regex))];
console.log(matches.join('\n'));
