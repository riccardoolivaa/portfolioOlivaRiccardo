const fs = require('fs');
const path = require('path');

// Read all markdown files from content/
const projectsDir = './content/projects';
const projects = [];

fs.readdirSync(projectsDir).forEach(file => {
  if (file.endsWith('.md')) {
    const content = fs.readFileSync(path.join(projectsDir, file), 'utf8');
    // Parse frontmatter and convert to JSON
    projects.push(parseProject(content));
  }
});

// Write to public JSON
fs.writeFileSync('./projects-data.json', JSON.stringify(projects, null, 2));