const fs = require('fs');
const path = require('path');

// Funzione per parsare il frontmatter YAML
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { data: {}, content: content };
  }

  const frontmatterText = match[1];
  const bodyContent = content.slice(match[0].length);
  
  const data = {};
  const lines = frontmatterText.split('\n');
  let currentKey = null;
  let currentValue = '';
  let inList = false;
  let inMultiline = false;

  lines.forEach(line => {
    // Lista YAML (- item)
    if (line.trim().startsWith('- ')) {
      if (currentKey && Array.isArray(data[currentKey])) {
        data[currentKey].push(line.trim().substring(2).replace(/^["']|["']$/g, ''));
      }
      inList = true;
      return;
    }

    // Key: value normale
    const keyValueMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyValueMatch) {
      // Salva il valore precedente se in multiline
      if (inMultiline && currentKey) {
        data[currentKey] = currentValue.trim();
      }

      currentKey = keyValueMatch[1];
      let value = keyValueMatch[2].trim();
      
      // Multiline string (|)
      if (value === '|') {
        inMultiline = true;
        currentValue = '';
        data[currentKey] = [];
        inList = false;
        return;
      }
      
      // Lista vuota
      if (value === '') {
        data[currentKey] = [];
        inList = true;
        inMultiline = false;
        return;
      }

      // Boolean
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      
      // Number
      if (!isNaN(value) && value !== '') {
        value = Number(value);
      }
      
      // String (rimuovi quotes)
      if (typeof value === 'string') {
        value = value.replace(/^["']|["']$/g, '');
      }

      data[currentKey] = value;
      inList = false;
      inMultiline = false;
      return;
    }

    // Continua multiline
    if (inMultiline && line.trim()) {
      currentValue += (currentValue ? '\n' : '') + line.trimStart();
    }
  });

  // Salva l'ultimo valore multiline
  if (inMultiline && currentKey) {
    data[currentKey] = currentValue.trim();
  }

  return { data, content: bodyContent.trim() };
}

// Funzione per leggere e parsare progetti
function parseProjects() {
  const projectsDir = './content/projects';
  const projects = [];

  if (!fs.existsSync(projectsDir)) {
    console.warn('⚠️  Projects directory not found');
    return projects;
  }

  fs.readdirSync(projectsDir).forEach(file => {
    if (file.endsWith('.md')) {
      const filePath = path.join(projectsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data } = parseFrontmatter(content);
      
      // Aggiungi un ID basato sul filename
      data.id = path.basename(file, '.md');
      
      projects.push(data);
    }
  });

  // Ordina per order se presente, altrimenti per featured
  projects.sort((a, b) => {
    if (a.order && b.order) return a.order - b.order;
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });

  console.log(`✅ Parsed ${projects.length} projects`);
  return projects;
}

// Funzione per leggere e parsare esperienze lavorative
function parseExperiences() {
  const experiencesDir = './content/experiences';
  const experiences = [];

  if (!fs.existsSync(experiencesDir)) {
    console.warn('⚠️  Experiences directory not found');
    return experiences;
  }

  fs.readdirSync(experiencesDir).forEach(file => {
    if (file.endsWith('.md')) {
      const filePath = path.join(experiencesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data, content: bodyContent } = parseFrontmatter(content);
      
      // Aggiungi il contenuto del body come description se non presente
      if (!data.description && bodyContent) {
        data.description = bodyContent;
      }
      
      data.id = path.basename(file, '.md');
      experiences.push(data);
    }
  });

  // Ordina per order (più basso = più recente)
  experiences.sort((a, b) => (a.order || 999) - (b.order || 999));

  console.log(`✅ Parsed ${experiences.length} experiences`);
  return experiences;
}

// Funzione per leggere bio
function parseBio() {
  const bioPath = './content/bio.md';
  
  if (!fs.existsSync(bioPath)) {
    console.warn('⚠️  Bio file not found');
    return { about: '', tagline: '' };
  }

  const content = fs.readFileSync(bioPath, 'utf8');
  const { data } = parseFrontmatter(content);
  
  console.log('✅ Parsed bio');
  return data;
}

// Funzione per leggere skills
function parseSkills() {
  const skillsPath = './content/skills.json';
  
  if (!fs.existsSync(skillsPath)) {
    console.warn('⚠️  Skills file not found');
    return { skills: [] };
  }

  const content = fs.readFileSync(skillsPath, 'utf8');
  const data = JSON.parse(content);
  
  console.log(`✅ Parsed ${data.skills.length} skills`);
  return data;
}

// Main build function
function buildData() {
  console.log('🚀 Building professional portfolio data...\n');

  const siteData = {
    projects: parseProjects(),
    experiences: parseExperiences(),
    bio: parseBio(),
    skills: parseSkills(),
    buildDate: new Date().toISOString()
  };

  // Scrivi il file JSON
  const outputPath = './data/site-data.json';
  
  // Crea la directory data se non esiste
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(siteData, null, 2));
  
  console.log(`\n✅ Build complete! Data written to ${outputPath}`);
  console.log(`📊 Professional Portfolio Summary:
  - Projects: ${siteData.projects.length}
  - Work Experiences: ${siteData.experiences.length}
  - Skills: ${siteData.skills.skills.length}
  `);
}

// Esegui il build
try {
  buildData();
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}