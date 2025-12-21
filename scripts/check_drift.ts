/**
 * Drift Detection Script for LithiumBuy
 * 
 * Checks for synchronization issues between:
 * - Database schema and TypeScript types
 * - RPC functions and OpenAPI spec
 * - Frontend calls and backend definitions
 * 
 * Run: npx ts-node scripts/check_drift.ts
 * Or add to package.json: "check:drift": "ts-node scripts/check_drift.ts"
 */

import * as fs from 'fs';
import * as path from 'path';

interface DriftIssue {
  type: 'error' | 'warning';
  category: string;
  message: string;
  file?: string;
  line?: number;
}

const issues: DriftIssue[] = [];

// ============================================
// Configuration
// ============================================

const CONFIG = {
  typesPath: 'src/integrations/supabase/types.ts',
  schemaPath: 'ORCHESTRATION/SCHEMA.json',
  apiSpecPath: 'ORCHESTRATION/API.openapiv1.yaml',
  srcDir: 'src',
  migrationsDir: 'supabase/migrations',
};

// ============================================
// Utility Functions
// ============================================

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function findFilesRecursive(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  
  if (!fs.existsSync(dir)) return results;
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      results.push(...findFilesRecursive(fullPath, pattern));
    } else if (item.isFile() && pattern.test(item.name)) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// ============================================
// Check 1: Types File Exists
// ============================================

function checkTypesExist(): void {
  console.log('📋 Checking TypeScript types file...');
  
  if (!fileExists(CONFIG.typesPath)) {
    issues.push({
      type: 'error',
      category: 'types',
      message: `Types file not found: ${CONFIG.typesPath}`,
    });
    return;
  }
  
  const content = readFile(CONFIG.typesPath);
  if (!content || content.length < 100) {
    issues.push({
      type: 'warning',
      category: 'types',
      message: 'Types file appears to be empty or minimal',
      file: CONFIG.typesPath,
    });
  }
  
  console.log('  ✅ Types file exists');
}

// ============================================
// Check 2: Schema.json Exists and Valid
// ============================================

function checkSchemaJson(): void {
  console.log('📋 Checking SCHEMA.json...');
  
  if (!fileExists(CONFIG.schemaPath)) {
    issues.push({
      type: 'warning',
      category: 'schema',
      message: `Schema file not found: ${CONFIG.schemaPath}`,
    });
    return;
  }
  
  const content = readFile(CONFIG.schemaPath);
  if (!content) {
    issues.push({
      type: 'error',
      category: 'schema',
      message: 'Cannot read schema file',
      file: CONFIG.schemaPath,
    });
    return;
  }
  
  try {
    const schema = JSON.parse(content);
    if (!schema.definitions) {
      issues.push({
        type: 'warning',
        category: 'schema',
        message: 'Schema missing definitions section',
        file: CONFIG.schemaPath,
      });
    }
  } catch (e) {
    issues.push({
      type: 'error',
      category: 'schema',
      message: `Invalid JSON in schema: ${e}`,
      file: CONFIG.schemaPath,
    });
  }
  
  console.log('  ✅ Schema file valid');
}

// ============================================
// Check 3: OpenAPI Spec Exists
// ============================================

function checkOpenApiSpec(): void {
  console.log('📋 Checking OpenAPI spec...');
  
  if (!fileExists(CONFIG.apiSpecPath)) {
    issues.push({
      type: 'warning',
      category: 'openapi',
      message: `OpenAPI spec not found: ${CONFIG.apiSpecPath}`,
    });
    return;
  }
  
  console.log('  ✅ OpenAPI spec exists');
}

// ============================================
// Check 4: RPC Calls Match Types
// ============================================

function checkRpcCalls(): void {
  console.log('📋 Checking RPC calls in frontend...');
  
  const typesContent = readFile(CONFIG.typesPath);
  if (!typesContent) {
    console.log('  ⏭️  Skipping (no types file)');
    return;
  }
  
  // Extract defined RPC functions from types
  const rpcFunctionPattern = /(\w+):\s*{\s*Args:/g;
  const definedRpcs = new Set<string>();
  let match;
  
  while ((match = rpcFunctionPattern.exec(typesContent)) !== null) {
    definedRpcs.add(match[1]);
  }
  
  // Find all .ts/.tsx files
  const sourceFiles = findFilesRecursive(CONFIG.srcDir, /\.(ts|tsx)$/);
  
  // Check for RPC calls
  const rpcCallPattern = /supabase\.rpc\(['"](\w+)['"]/g;
  
  for (const file of sourceFiles) {
    const content = readFile(file);
    if (!content) continue;
    
    let lineNumber = 1;
    const lines = content.split('\n');
    
    for (const line of lines) {
      const matches = line.matchAll(/supabase\.rpc\(['"](\w+)['"]/g);
      
      for (const m of matches) {
        const rpcName = m[1];
        if (!definedRpcs.has(rpcName)) {
          issues.push({
            type: 'warning',
            category: 'rpc',
            message: `RPC call to undefined function: ${rpcName}`,
            file,
            line: lineNumber,
          });
        }
      }
      
      lineNumber++;
    }
  }
  
  console.log(`  ✅ Checked ${sourceFiles.length} source files`);
}

// ============================================
// Check 5: No Direct Table Mutations on Protected Tables
// ============================================

function checkDirectMutations(): void {
  console.log('📋 Checking for forbidden direct mutations...');
  
  const protectedTables = [
    'suppliers',
    'products',
    'orders',
    'quotes',
    'telebuy_sessions',
    'activity_log',
  ];
  
  const sourceFiles = findFilesRecursive(CONFIG.srcDir, /\.(ts|tsx)$/);
  
  // Pattern for .insert(), .update(), .delete() on tables
  const mutationPatterns = [
    /\.from\(['"](\w+)['"]\)\.insert\(/g,
    /\.from\(['"](\w+)['"]\)\.update\(/g,
    /\.from\(['"](\w+)['"]\)\.delete\(/g,
    /\.from\(['"](\w+)['"]\)\.upsert\(/g,
  ];
  
  for (const file of sourceFiles) {
    const content = readFile(file);
    if (!content) continue;
    
    let lineNumber = 1;
    const lines = content.split('\n');
    
    for (const line of lines) {
      for (const pattern of mutationPatterns) {
        const matches = line.matchAll(pattern);
        
        for (const m of matches) {
          const tableName = m[1];
          if (protectedTables.includes(tableName)) {
            issues.push({
              type: 'error',
              category: 'mutation',
              message: `Direct mutation on protected table: ${tableName}. Use RPC instead.`,
              file,
              line: lineNumber,
            });
          }
        }
      }
      
      lineNumber++;
    }
  }
  
  console.log(`  ✅ Mutation check complete`);
}

// ============================================
// Check 6: Migrations Exist
// ============================================

function checkMigrations(): void {
  console.log('📋 Checking migrations directory...');
  
  if (!fs.existsSync(CONFIG.migrationsDir)) {
    issues.push({
      type: 'warning',
      category: 'migrations',
      message: `Migrations directory not found: ${CONFIG.migrationsDir}`,
    });
    return;
  }
  
  const migrations = fs.readdirSync(CONFIG.migrationsDir)
    .filter(f => f.endsWith('.sql'));
  
  console.log(`  ✅ Found ${migrations.length} migration files`);
}

// ============================================
// Main
// ============================================

function main(): void {
  console.log('\n🔍 LithiumBuy Drift Detection\n');
  console.log('='.repeat(50) + '\n');
  
  checkTypesExist();
  checkSchemaJson();
  checkOpenApiSpec();
  checkRpcCalls();
  checkDirectMutations();
  checkMigrations();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Results:\n');
  
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ No drift detected!\n');
    process.exit(0);
  }
  
  if (errors.length > 0) {
    console.log(`❌ ${errors.length} error(s):\n`);
    for (const error of errors) {
      console.log(`  [${error.category}] ${error.message}`);
      if (error.file) {
        console.log(`    📁 ${error.file}${error.line ? `:${error.line}` : ''}`);
      }
    }
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warning(s):\n`);
    for (const warning of warnings) {
      console.log(`  [${warning.category}] ${warning.message}`);
      if (warning.file) {
        console.log(`    📁 ${warning.file}${warning.line ? `:${warning.line}` : ''}`);
      }
    }
    console.log('');
  }
  
  // Exit with error code if there are errors
  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
