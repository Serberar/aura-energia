#!/usr/bin/env node
/**
 * Verifica que los schemas Prisma de core-service y crm-service estén sincronizados.
 * Ambos servicios comparten la misma base de datos, por lo que sus schemas deben ser idénticos.
 * Uso: node scripts/check-schemas-in-sync.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const schemaA = path.join(root, 'core-service', 'prisma', 'schema.prisma');
const schemaB = path.join(root, 'crm-service', 'prisma', 'schema.prisma');

const contentA = fs.readFileSync(schemaA, 'utf8');
const contentB = fs.readFileSync(schemaB, 'utf8');

if (contentA === contentB) {
  console.log('✅ Schemas sincronizados: core-service y crm-service son idénticos.');
  process.exit(0);
} else {
  console.error('❌ Los schemas Prisma no están sincronizados:');
  console.error(`  - ${schemaA}`);
  console.error(`  - ${schemaB}`);

  const linesA = contentA.split('\n');
  const linesB = contentB.split('\n');
  const maxLines = Math.max(linesA.length, linesB.length);
  let diffCount = 0;
  for (let i = 0; i < maxLines; i++) {
    const a = linesA[i] ?? '<missing>';
    const b = linesB[i] ?? '<missing>';
    if (a !== b) {
      diffCount++;
      if (diffCount <= 20) {
        console.error(`  Línea ${i + 1}:`);
        console.error(`    core-service: ${a}`);
        console.error(`    crm-service:  ${b}`);
      }
    }
  }
  if (diffCount > 20) {
    console.error(`  ... y ${diffCount - 20} diferencias más.`);
  }
  process.exit(1);
}
