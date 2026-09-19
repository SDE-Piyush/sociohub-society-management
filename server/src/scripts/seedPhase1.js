import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from '../models/Society.js';
import Building from '../models/Building.js';
import Flat from '../models/Flat.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';

dotenv.config();

const seedPhase1 = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sociohub';
    await mongoose.connect(mongoUri);
    console.log('🌱 Connected to MongoDB for Phase 1 Seeding (Indian Localization)...');

    // Clear existing Phase 1 collections
    await Payment.deleteMany({});
    await User.deleteMany({});
    await Flat.deleteMany({});
    await Building.deleteMany({});
    await Society.deleteMany({});
    console.log('🧹 Cleaned existing data...');

    // 1. Create Society
    const society = await Society.create({
      name: 'Emerald Heights Residency',
      registrationNumber: 'MAH/PUN/SOC/2022/4491',
      address: {
        street: '42 Orchid Boulevard, Baner Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
      },
      contactEmail: 'office@emeraldheights.com',
      contactPhone: '+91 98220 12345',
      gateCount: 2,
      settings: {
        currency: 'INR',
        maintenanceDueDay: 5,
        latePenaltyPercentage: 5,
      },
    });
    console.log(`✅ Created Society: ${society.name}`);

    // 2. Create Wings / Buildings
    const wingA = await Building.create({
      societyId: society._id,
      name: 'Wing A - Aster',
      code: 'A',
      totalFloors: 10,
      flatsPerFloor: 4,
      description: 'North-facing residential tower with premium 2BHK & 3BHK suites',
    });

    const wingB = await Building.create({
      societyId: society._id,
      name: 'Wing B - Bluebell',
      code: 'B',
      totalFloors: 10,
      flatsPerFloor: 4,
      description: 'East-facing garden tower overlooking central amenities and clubhouse',
    });
    console.log(`✅ Created Wings: ${wingA.name}, ${wingB.name}`);

    // 3. Create Sample Flats for Wing A & Wing B
    const flatData = [
      { buildingId: wingA._id, flatNumber: '101', floor: 1, type: '3BHK', areaSqFt: 1450, monthlyMaintenance: 4200, parkingSlot: 'P-A01' },
      { buildingId: wingA._id, flatNumber: '102', floor: 1, type: '2BHK', areaSqFt: 1100, monthlyMaintenance: 3500, parkingSlot: 'P-A02' },
      { buildingId: wingA._id, flatNumber: '103', floor: 1, type: '2BHK', areaSqFt: 1100, monthlyMaintenance: 3500, parkingSlot: 'P-A03' },
      { buildingId: wingA._id, flatNumber: '104', floor: 1, type: '1BHK', areaSqFt: 750, monthlyMaintenance: 2800, parkingSlot: 'P-A04' },
      { buildingId: wingA._id, flatNumber: '201', floor: 2, type: '3BHK', areaSqFt: 1450, monthlyMaintenance: 4200, parkingSlot: 'P-A05' },
      { buildingId: wingA._id, flatNumber: '202', floor: 2, type: '2BHK', areaSqFt: 1100, monthlyMaintenance: 3500, parkingSlot: 'P-A06' },
      { buildingId: wingB._id, flatNumber: '101', floor: 1, type: '3BHK', areaSqFt: 1500, monthlyMaintenance: 4400, parkingSlot: 'P-B01' },
      { buildingId: wingB._id, flatNumber: '102', floor: 1, type: '2BHK', areaSqFt: 1150, monthlyMaintenance: 3600, parkingSlot: 'P-B02' },
      { buildingId: wingB._id, flatNumber: '201', floor: 2, type: '3BHK', areaSqFt: 1500, monthlyMaintenance: 4400, parkingSlot: 'P-B03' },
      { buildingId: wingB._id, flatNumber: '202', floor: 2, type: '2BHK', areaSqFt: 1150, monthlyMaintenance: 3600, parkingSlot: 'P-B04' },
      { buildingId: wingB._id, flatNumber: '301', floor: 3, type: 'PENTHOUSE', areaSqFt: 2200, monthlyMaintenance: 6500, parkingSlot: 'P-B05 & P-B06' },
    ];

    const createdFlats = [];
    for (const item of flatData) {
      const flat = await Flat.create({
        ...item,
        societyId: society._id,
        occupancyStatus: 'VACANT',
      });
      createdFlats.push(flat);
    }
    console.log(`✅ Created ${createdFlats.length} flats across Wing A and Wing B`);

    // 4. Create Demo Users with Indian Names
    // a) Society Admin (Piyush Kumar)
    const adminUser = await User.create({
      name: 'Piyush Kumar',
      email: 'admin@emeraldheights.com',
      phone: '+91 98220 99999',
      password: 'admin123',
      role: 'SOCIETY_ADMIN',
      residentType: 'NONE',
      societyId: society._id,
      status: 'ACTIVE',
    });

    // b) Resident Owner (Piyush Sharma - Flat A-101)
    const flatA101 = createdFlats.find((f) => f.flatNumber === '101' && f.buildingId.equals(wingA._id));
    const ownerPiyush = await User.create({
      name: 'Piyush Sharma',
      email: 'piyush.resident@emeraldheights.com',
      phone: '+91 98811 22334',
      password: 'resident123',
      role: 'RESIDENT',
      residentType: 'OWNER',
      societyId: society._id,
      buildingId: wingA._id,
      flatId: flatA101._id,
      status: 'ACTIVE',
      emergencyContact: {
        name: 'Sunita Sharma',
        phone: '+91 98811 22335',
        relation: 'Spouse',
      },
    });

    // Link A-101 to owner Piyush
    flatA101.ownerId = ownerPiyush._id;
    flatA101.occupancyStatus = 'OWNER_OCCUPIED';
    await flatA101.save();

    // c) Resident Tenant (Ananya Patel - Flat A-102)
    const flatA102 = createdFlats.find((f) => f.flatNumber === '102' && f.buildingId.equals(wingA._id));
    const tenantAnanya = await User.create({
      name: 'Ananya Patel',
      email: 'ananya.tenant@emeraldheights.com',
      phone: '+91 97722 33445',
      password: 'resident123',
      role: 'RESIDENT',
      residentType: 'TENANT',
      societyId: society._id,
      buildingId: wingA._id,
      flatId: flatA102._id,
      status: 'ACTIVE',
      emergencyContact: {
        name: 'Aarav Patel',
        phone: '+91 97722 33446',
        relation: 'Brother',
      },
    });

    // Link A-102 to tenant Ananya
    flatA102.tenantId = tenantAnanya._id;
    flatA102.occupancyStatus = 'TENANT_OCCUPIED';
    await flatA102.save();

    // d) Resident Owner 2 (Rajesh Kulkarni - Flat B-101)
    const flatB101 = createdFlats.find((f) => f.flatNumber === '101' && f.buildingId.equals(wingB._id));
    const ownerRajesh = await User.create({
      name: 'Rajesh Kulkarni',
      email: 'rajesh.owner@emeraldheights.com',
      phone: '+91 98555 44332',
      password: 'resident123',
      role: 'RESIDENT',
      residentType: 'OWNER',
      societyId: society._id,
      buildingId: wingB._id,
      flatId: flatB101._id,
      status: 'ACTIVE',
      emergencyContact: {
        name: 'Meena Kulkarni',
        phone: '+91 98555 44333',
        relation: 'Spouse',
      },
    });
    flatB101.ownerId = ownerRajesh._id;
    flatB101.occupancyStatus = 'OWNER_OCCUPIED';
    await flatB101.save();

    // e) Security Guard (Ramesh Pawar)
    const securityGuard = await User.create({
      name: 'Ramesh Pawar (Gate 1)',
      email: 'security@emeraldheights.com',
      phone: '+91 99111 00011',
      password: 'security123',
      role: 'SECURITY',
      residentType: 'NONE',
      societyId: society._id,
      status: 'ACTIVE',
    });

    // 5. Seed a past paid receipt for August 2026 for Piyush
    await Payment.create({
      societyId: society._id,
      flatId: flatA101._id,
      buildingId: wingA._id,
      userId: ownerPiyush._id,
      month: 'August 2026',
      amount: 4200,
      paymentMethod: 'UPI',
      upiId: 'piyush09@ptaxis',
      transactionRef: 'UPI-828172648102',
      status: 'COMPLETED',
      receiptNumber: 'RCP-2026-8041',
      notes: 'August maintenance paid on time via UPI',
    });

    console.log('✅ Demo Users Seeded with Indian Names:');
    console.log('   👑 Admin:    admin@emeraldheights.com / admin123 (Piyush Kumar)');
    console.log('   🏠 Resident: piyush.resident@emeraldheights.com / resident123 (Piyush Sharma - Owner A-101)');
    console.log('   🏠 Tenant:   ananya.tenant@emeraldheights.com / resident123 (Ananya Patel - Tenant A-102)');
    console.log('   🏠 Resident: rajesh.owner@emeraldheights.com / resident123 (Rajesh Kulkarni - Owner B-101)');
    console.log('   🛡️ Security: security@emeraldheights.com / security123 (Ramesh Pawar - Gate 1)');

    console.log('\n🎉 Phase 1 & Payment Seed Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedPhase1();
