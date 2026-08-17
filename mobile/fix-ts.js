const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/herna/Music/smart-toy/mobile/src/screens/dashboard';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix Label style={{ color: ... }} -> Use ' as any'
  content = content.replace(/<Label([^>]*?)style=\{\{(.*?color:.*?)\}\}/g, '<Label$1style={{$2} as any}');

  // In RutinasScreen.tsx
  if (file === 'RutinasScreen.tsx') {
    content = content.replace(/trackColor=\{\{\s*false:\s*muted,\s*true:\s*'#6366F1'\s*\}\}/g, 
                              "trackColor={{ false: muted as any, true: '#6366F1' }}");
  }

  // In ConfiguracionScreen.tsx
  if (file === 'ConfiguracionScreen.tsx') {
    content = content.replace(/personality:\s*personality\s*,?/g, ''); 
  }

  // In MusicaScreen.tsx
  if (file === 'MusicaScreen.tsx') {
    content = content.replace(/color:\s*foreground/g, "color: '#101218'");
  }

  fs.writeFileSync(filePath, content);
}
console.log('Fixed typings');
