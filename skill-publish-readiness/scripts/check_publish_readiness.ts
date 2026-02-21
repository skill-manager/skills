#!/usr/bin/env tsx

import fs from 'node:fs/promises';
import path from 'node:path';

type Options = {
  skillDir: string;
  skillRootDir: string;
  maxFileBytes: number;
};

type PublishFile = {
  path: string;
  sizeBytes: number;
};

const REQUIRED_SKILL_FILE = 'SKILL.md';
const OPTIONAL_SKILL_DIRECTORIES = [
  'agents',
  'scripts',
  'references',
  'assets',
];
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEFAULT_SKILL_ROOT_DIR = 'skills';
const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024;

function usage(): string {
  return [
    'Usage: tsx scripts/check_publish_readiness.ts [options]',
    '',
    'Options:',
    '  --skill-dir <path>        Skill folder to validate (default: current directory)',
    '  --skill-root-dir <path>   Root path in registry repo (default: skills)',
    `  --max-file-bytes <n>      Max per file in bytes (default: ${DEFAULT_MAX_FILE_BYTES})`,
    '  -h, --help                Show this help',
  ].join('\n');
}

function readFlagValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Flag '${flag}' requires a value.`);
  }

  return value;
}

function parseOptions(): Options {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage());
    process.exit(0);
  }

  const maxFileBytesRaw = readFlagValue(args, '--max-file-bytes');
  const maxFileBytes =
    maxFileBytesRaw === undefined
      ? DEFAULT_MAX_FILE_BYTES
      : Number.parseInt(maxFileBytesRaw, 10);

  if (!Number.isFinite(maxFileBytes) || maxFileBytes <= 0) {
    throw new Error('--max-file-bytes must be a positive integer.');
  }

  return {
    skillDir: path.resolve(readFlagValue(args, '--skill-dir') ?? process.cwd()),
    skillRootDir:
      readFlagValue(args, '--skill-root-dir') ?? DEFAULT_SKILL_ROOT_DIR,
    maxFileBytes,
  };
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return false;
    }
    throw error;
  }
}

function normalizeToPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function parseSkillName(skillMarkdown: string, fallbackName: string): string {
  const frontmatterMatch = skillMarkdown.match(/^---\s*\n([\s\S]*?)\n---\s*/);
  if (!frontmatterMatch) {
    return fallbackName;
  }

  const frontmatter = frontmatterMatch[1];
  const nameLine = frontmatter
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith('name:'));

  if (!nameLine) {
    return fallbackName;
  }

  const parsedName = nameLine
    .slice('name:'.length)
    .trim()
    .replace(/^['"]|['"]$/g, '');
  return parsedName || fallbackName;
}

async function collectDirectoryFiles(
  rootDir: string,
  directoryName: string
): Promise<PublishFile[]> {
  const absoluteDir = path.join(rootDir, directoryName);
  if (!(await pathExists(absoluteDir))) {
    return [];
  }

  const files: PublishFile[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const stat = await fs.stat(absolutePath);
      files.push({
        path: normalizeToPosix(path.relative(rootDir, absolutePath)),
        sizeBytes: stat.size,
      });
    }
  }

  await walk(absoluteDir);
  return files;
}

async function collectPublishFiles(skillDir: string): Promise<PublishFile[]> {
  const skillFilePath = path.join(skillDir, REQUIRED_SKILL_FILE);
  const skillFileStat = await fs.stat(skillFilePath);

  const files: PublishFile[] = [
    {
      path: REQUIRED_SKILL_FILE,
      sizeBytes: skillFileStat.size,
    },
  ];

  for (const directoryName of OPTIONAL_SKILL_DIRECTORIES) {
    const directoryFiles = await collectDirectoryFiles(skillDir, directoryName);
    files.push(...directoryFiles);
  }

  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}

function printHeader(title: string): void {
  console.log('');
  console.log(title);
}

function printList(items: string[]): void {
  if (items.length === 0) {
    console.log('- none');
    return;
  }

  for (const item of items) {
    console.log(`- ${item}`);
  }
}

async function main(): Promise<void> {
  const options = parseOptions();
  const issues: string[] = [];
  const warnings: string[] = [];

  const skillFilePath = path.join(options.skillDir, REQUIRED_SKILL_FILE);
  if (!(await pathExists(skillFilePath))) {
    issues.push(`Missing required file: ${skillFilePath}`);
  }

  if (issues.length > 0) {
    printHeader('Readiness Result: FAIL');
    printHeader('Blocking issues');
    printList(issues);
    process.exit(1);
  }

  const skillMarkdown = await fs.readFile(skillFilePath, 'utf8');
  const fallbackName = path.basename(options.skillDir);
  const skillName = parseSkillName(skillMarkdown, fallbackName);

  if (!SKILL_NAME_PATTERN.test(skillName)) {
    issues.push(
      `Invalid skill name '${skillName}'. Expected lowercase letters, numbers, and hyphens.`
    );
  }

  const files = await collectPublishFiles(options.skillDir);
  for (const file of files) {
    if (file.sizeBytes > options.maxFileBytes) {
      issues.push(
        `File '${file.path}' is ${file.sizeBytes} bytes (max ${options.maxFileBytes}).`
      );
    }
  }

  for (const directoryName of OPTIONAL_SKILL_DIRECTORIES) {
    const absoluteDir = path.join(options.skillDir, directoryName);
    if (!(await pathExists(absoluteDir))) {
      warnings.push(`Optional directory missing: ${directoryName}/`);
    }
  }

  const totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);

  printHeader(`Readiness Result: ${issues.length > 0 ? 'FAIL' : 'PASS'}`);
  console.log(`skillDir: ${options.skillDir}`);
  console.log(`skillName: ${skillName}`);
  console.log(`skillRootDir: ${options.skillRootDir}`);
  console.log(`files: ${files.length}`);
  console.log(`totalBytes: ${totalBytes}`);

  printHeader('Final target paths');
  for (const file of files) {
    console.log(
      `- ${options.skillRootDir}/${skillName}/${file.path} (${file.sizeBytes} bytes)`
    );
  }

  printHeader('Warnings');
  printList(warnings);

  printHeader('Blocking issues');
  printList(issues);

  process.exit(issues.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('check_publish_readiness failed:', error);
  process.exit(1);
});
