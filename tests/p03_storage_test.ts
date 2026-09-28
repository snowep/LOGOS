import { SafeFilesystemAdapter } from '../packages/core/src/filesystem.js';
import { MarkdownAdapter } from '../packages/core/src/markdown.js';
import { SimpleSqliteDatabase } from '../packages/core/src/db.js';

async function runTests() {
  console.log('--- Starting P0.3 Storage & Markdown Tests ---');

  const fsAdapter = new SafeFilesystemAdapter('./storage/workspace');
  const db = new SimpleSqliteDatabase('./storage/system/logos_test.json');

  // Test 1: Markdown serialization and write
  const testProject = {
    id: 'proj_001',
    name: 'DROP 002 Logistics & Planning',
    slug: 'drop-002',
    goal: 'Establish supply chain for upcoming drop',
    description: 'Quarterly release planning',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    decisions: ['Use supplier A for packaging'],
    tasks: ['Finalize artwork', 'Review pricing model']
  };

  const mdContent = MarkdownAdapter.serialize(testProject);
  await fsAdapter.write('projects/drop-002.md', mdContent);
  console.log('✓ Markdown written atomically');

  // Test 2: Read back and parse
  const readBack = await fsAdapter.read('projects/drop-002.md');
  const parsed = MarkdownAdapter.parse(readBack);
  if (parsed.id === 'proj_001' && parsed.name === 'DROP 002 Logistics & Planning') {
    console.log('✓ Markdown parsed back successfully');
  } else {
    throw new Error('Markdown parse mismatch');
  }

  // Test 3: Path Traversal security check
  try {
    await fsAdapter.read('../../secrets.env');
    throw new Error('Path traversal was NOT blocked!');
  } catch (err: any) {
    if (err.message.includes('Path traversal attempt blocked')) {
      console.log('✓ Security: Path traversal blocked correctly');
    } else {
      throw err;
    }
  }

  // Test 4: Database operations
  await db.insert('projects', testProject.id, testProject);
  const found = await db.findById('projects', testProject.id);
  if (found && found.name === testProject.name) {
    console.log('✓ Database insert and query verified');
  } else {
    throw new Error('Database record mismatch');
  }

  console.log('--- All P0.3 Tests Passed Successfully! ---');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
