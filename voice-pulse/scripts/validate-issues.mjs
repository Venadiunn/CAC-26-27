import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(currentDir, '../data/issues-data.js');
const source = fs.readFileSync(dataPath, 'utf8');

const match = source.match(/const issueCatalog = (\[[\s\S]*?\]);\s*const issueCategories =/);
if (!match) {
  throw new Error('Unable to find the issue catalog in the data file.');
}

const issues = Function(`return ${match[1]};`)();
const categories = issueCatalogFromSource(issues);

function issueCatalogFromSource(catalog) {
  return catalog.map((issue) => ({
    id: issue.id,
    title: issue.title,
    category: issue.category,
    summary: issue.summary,
    sources: Array.isArray(issue.sources) ? issue.sources.length : 0,
  }));
}

const countsByCategory = categories.reduce((acc, issue) => {
  acc[issue.category] = (acc[issue.category] || 0) + 1;
  return acc;
}, {});

if (issues.length !== 100) {
  throw new Error(`Expected 100 issues, found ${issues.length}.`);
}

const requiredCategories = [
  'Education',
  'Mental Health',
  'Technology and AI',
  'Environment',
  'Government and Civic Engagement',
];

for (const category of requiredCategories) {
  if ((countsByCategory[category] || 0) !== 20) {
    throw new Error(`${category} expected 20 issues, found ${countsByCategory[category] || 0}.`);
  }
}

const ids = issues.map((issue) => issue.id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) {
  throw new Error(`Duplicate issue IDs detected: ${duplicateIds.join(', ')}`);
}

const titles = issues.map((issue) => issue.title);
const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index);
if (duplicateTitles.length) {
  throw new Error(`Duplicate issue titles detected: ${duplicateTitles.join(', ')}`);
}

for (const issue of issues) {
  if (!issue.id || !issue.title || !issue.summary || !issue.category) {
    throw new Error(`Missing required data for issue: ${JSON.stringify(issue)}`);
  }
  if (!Array.isArray(issue.keywords) || issue.keywords.length === 0) {
    throw new Error(`Issue missing keywords: ${issue.id}`);
  }
  if (!Array.isArray(issue.policyQuestions) || issue.policyQuestions.length === 0) {
    throw new Error(`Issue missing policy questions: ${issue.id}`);
  }
  if (!Array.isArray(issue.sources) || issue.sources.length === 0) {
    throw new Error(`Issue missing sources: ${issue.id}`);
  }
}

console.log('Validated issue library: 100 records across 5 categories with unique IDs and titles.');
