import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('🏢 SocioHub Master Society Seeder (Phase 1, 2 & 3)');
console.log('====================================================\n');

try {
  console.log('▶️ [1/3] Running Phase 1 Foundation Seeding (Flats, Buildings, Users, Accounts)...');
  execSync(`node "${path.join(__dirname, 'seedPhase1.js')}"`, { stdio: 'inherit' });

  console.log('\n▶️ [2/3] Running Phase 2 Operations Seeding (Notices, Helpdesk, Visitors)...');
  execSync(`node "${path.join(__dirname, 'seedPhase2.js')}"`, { stdio: 'inherit' });

  console.log('\n▶️ [3/3] Running Phase 3 Financial & Amenities Seeding (Bills, Bookings, Polls)...');
  execSync(`node "${path.join(__dirname, 'seedPhase3.js')}"`, { stdio: 'inherit' });

  console.log('\n====================================================');
  console.log('🎉 ALL PHASES SEEDED SUCCESSFULLY!');
  console.log('====================================================');
  console.log('Demo Society: Emerald Heights Residency');
  console.log('👑 Admin:    admin@emeraldheights.com / admin123');
  console.log('🏠 Resident: piyush.resident@emeraldheights.com / resident123');
  console.log('🏠 Tenant:   ananya.tenant@emeraldheights.com / resident123');
  console.log('🛡️ Security: security@emeraldheights.com / security123');
  console.log('====================================================\n');
} catch (error) {
  console.error('❌ Master seed failed:', error.message);
  process.exit(1);
}
