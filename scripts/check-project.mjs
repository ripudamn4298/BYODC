import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { COURSES } from '../js/platform/course-registry.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function walk(directory){
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const modules = walk(join(root, 'js')).filter(file => file.endsWith('.js'));
const failures = [];

for (const file of modules){
  const checked = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (checked.status !== 0) failures.push(`${file}: ${checked.stderr.trim()}`);

  const source = readFileSync(file, 'utf8');
  const imports = source.matchAll(/(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]/g);
  for (const match of imports){
    if (!match[1].startsWith('.')) continue;
    const target = resolve(dirname(file), match[1]);
    if (!existsSync(target)) failures.push(`${file}: missing import ${match[1]}`);
  }
}

const ids = new Set();
for (const course of COURSES){
  for (const field of ['id', 'slug', 'title', 'domain', 'status', 'description']){
    if (!course[field]) failures.push(`Course ${course.id || '<unknown>'}: missing ${field}`);
  }
  if (ids.has(course.id)) failures.push(`Duplicate course id: ${course.id}`);
  ids.add(course.id);
  if (course.status === 'available' && (!course.launchUrl || !existsSync(join(root, course.launchUrl)))){
    failures.push(`Course ${course.id}: available course launchUrl does not exist`);
  }
}

if (failures.length){
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Checked ${modules.length} JavaScript modules and ${COURSES.length} course manifests.`);
