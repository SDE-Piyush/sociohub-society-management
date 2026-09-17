import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from '../models/Society.js';
import Building from '../models/Building.js';
import Flat from '../models/Flat.js';
import User from '../models/User.js';
import Notice from '../models/Notice.js';
import Complaint from '../models/Complaint.js';
import Visitor from '../models/Visitor.js';

dotenv.config();

const seedPhase2 = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sociohub';
    await mongoose.connect(mongoUri);
    console.log('🌱 Connected to MongoDB for Phase 2 Operations Seeding...');

    const society = await Society.findOne({ name: 'Emerald Heights Residency' });
    if (!society) {
      console.error('❌ Society not found. Please run seedPhase1 first.');
      process.exit(1);
    }

    const adminUser = await User.findOne({ email: 'admin@emeraldheights.com' });
    const residentPiyush = await User.findOne({ email: 'piyush.resident@emeraldheights.com' });
    const tenantAnanya = await User.findOne({ email: 'ananya.tenant@emeraldheights.com' });
    const residentRajesh = await User.findOne({ email: 'rajesh.owner@emeraldheights.com' });
    const securityGuard = await User.findOne({ email: 'security@emeraldheights.com' });

    const flatA101 = await Flat.findOne({ flatNumber: '101' });
    const flatA102 = await Flat.findOne({ flatNumber: '102' });
    const flatB101 = await Flat.findOne({ flatNumber: '101', buildingId: { $ne: flatA101.buildingId } });

    // Clear Phase 2 collections
    await Notice.deleteMany({ societyId: society._id });
    await Complaint.deleteMany({ societyId: society._id });
    await Visitor.deleteMany({ societyId: society._id });
    console.log('🧹 Cleaned existing Phase 2 collections...');

    // 1. Seed Notices
    const notices = await Notice.create([
      {
        societyId: society._id,
        title: '⚠️ Water Supply Shutdown: Overhead Tank Deep Cleaning this Saturday',
        content:
          'Please be advised that annual robotic pressure cleaning and chemical sterilization of all overhead drinking water tanks across Wing A & B will be conducted this Saturday from 10:00 AM to 04:00 PM. Residents are requested to store adequate water for daytime consumption. Normal pressure supply will resume by 4:30 PM.',
        category: 'MAINTENANCE',
        priority: 'URGENT',
        targetAudience: 'ALL',
        isPinned: true,
        postedBy: adminUser._id,
      },
      {
        societyId: society._id,
        title: '🪔 Grand Diwali Celebration & Cultural Fiesta 2026',
        content:
          'Management committee cordially invites all resident families, owners, and tenants to the Grand Diwali Celebrations on the Central Lawn. Featuring live sitar recital, traditional sweets buffet, diya lighting competition, and eco-friendly fireworks display. Date: Nov 1st, 7:00 PM onwards.',
        category: 'EVENT',
        priority: 'UPCOMING',
        targetAudience: 'ALL',
        isPinned: true,
        postedBy: adminUser._id,
      },
      {
        societyId: society._id,
        title: '🚗 Mandatory RFID Sticker Pasting for Basement Parking Access',
        content:
          'To prevent unauthorized parking and speed up boom-barrier clearance at Gate 1 and Gate 2, vehicle RFID verification will become mandatory starting next Monday. Residents who haven’t collected their RFID tags please visit the estate office with RC copies.',
        category: 'RULE',
        priority: 'NORMAL',
        targetAudience: 'ALL',
        isPinned: false,
        postedBy: adminUser._id,
      },
      {
        societyId: society._id,
        title: '📋 Tenant Move-In Police Verification & Contact Update',
        content:
          'All tenants residing on lease agreements are reminded to submit Pune Police tenant verification clearance receipt to the society management office within 15 days of moving in, as mandated by local municipal bylaws.',
        category: 'GENERAL',
        priority: 'NORMAL',
        targetAudience: 'TENANTS',
        isPinned: false,
        postedBy: adminUser._id,
      },
    ]);
    console.log(`✅ Seeded ${notices.length} Notices`);

    // 2. Seed Complaints with realistic lifecycles
    const complaints = await Complaint.create([
      {
        ticketNumber: 'TKT-2026-1042',
        societyId: society._id,
        flatId: flatA101._id,
        buildingId: flatA101.buildingId,
        raisedBy: residentPiyush._id,
        title: 'Heavy seepage & water dripping from master bedroom false ceiling',
        description:
          'Continuous water droplets forming damp patch on false ceiling near AC duct. Suspected pipeline joint leakage from Flat 201 above. Needs urgent inspection before paint and gypsum crumble.',
        category: 'PLUMBING',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        assignedTo: {
          name: 'Raju Mistri (Lead Plumber)',
          phone: '+91 98221 44556',
          role: 'Society Senior Plumber',
        },
        activityLog: [
          {
            status: 'PENDING',
            note: 'Ticket logged by Piyush Sharma via resident portal.',
            updatedBy: residentPiyush._id,
            timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
          },
          {
            status: 'ASSIGNED',
            note: 'Assigned to plumber Raju Mistri. Scheduled inspection at 11:30 AM.',
            updatedBy: adminUser._id,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          {
            status: 'IN_PROGRESS',
            note: 'Identified loose CPVC bend elbow in Flat 201 drain trap. Replacement CPVC fitting ordered from hardware store.',
            updatedBy: adminUser._id,
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          },
        ],
      },
      {
        ticketNumber: 'TKT-2026-1043',
        societyId: society._id,
        flatId: flatA102._id,
        buildingId: flatA102.buildingId,
        raisedBy: tenantAnanya._id,
        title: 'Wing A Lift 2 grinding sound & floor misalignment at 4th floor',
        description:
          'Lift 2 is stopping 2 inches lower than floor level at 4th floor, and cable makes sharp metallic friction noise during ascent. Safety hazard for elderly and children.',
        category: 'ELEVATOR',
        priority: 'EMERGENCY',
        status: 'ASSIGNED',
        assignedTo: {
          name: 'Amit Deshmukh (Otis Elevators)',
          phone: '+91 98330 12345',
          role: 'Authorized Otis AMC Field Engineer',
        },
        activityLog: [
          {
            status: 'PENDING',
            note: 'Ticket raised by Ananya Patel.',
            updatedBy: tenantAnanya._id,
            timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
          },
          {
            status: 'ASSIGNED',
            note: 'Emergency dispatch sent to Otis Elevator AMC hotline. Engineer expected on site by 2:00 PM.',
            updatedBy: adminUser._id,
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          },
        ],
      },
      {
        ticketNumber: 'TKT-2026-1039',
        societyId: society._id,
        flatId: flatA101._id,
        buildingId: flatA101.buildingId,
        raisedBy: residentPiyush._id,
        title: 'Corridor 1st Floor LED batten flickering and dimming',
        description: 'Light fixture right in front of Flat 101 and 102 entrance keeps blinking and buzzing.',
        category: 'ELECTRICAL',
        priority: 'LOW',
        status: 'RESOLVED',
        resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        resolutionNotes: 'Replaced faulty driver choke and installed fresh 20W Philips Cool White LED tube.',
        assignedTo: {
          name: 'Sunil Jadhav',
          phone: '+91 98900 22331',
          role: 'Campus Electrician',
        },
        activityLog: [
          {
            status: 'PENDING',
            note: 'Ticket logged.',
            updatedBy: residentPiyush._id,
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          },
          {
            status: 'ASSIGNED',
            note: 'Assigned to Sunil electrician.',
            updatedBy: adminUser._id,
            timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
          },
          {
            status: 'RESOLVED',
            note: 'Installed new 20W tube light. Verified working by flat resident.',
            updatedBy: adminUser._id,
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          },
        ],
      },
      {
        ticketNumber: 'TKT-2026-1044',
        societyId: society._id,
        flatId: flatB101._id,
        buildingId: flatB101.buildingId,
        raisedBy: residentRajesh._id,
        title: 'Commercial tempo parked across reserved slot P-B01',
        description: 'A white Mahindra Bolero pickup truck has parked directly blocking my allotted basement slot P-B01.',
        category: 'PARKING',
        priority: 'MEDIUM',
        status: 'PENDING',
        activityLog: [
          {
            status: 'PENDING',
            note: 'Ticket logged by Rajesh Kulkarni.',
            updatedBy: residentRajesh._id,
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          },
        ],
      },
    ]);
    console.log(`✅ Seeded ${complaints.length} Helpdesk Tickets with State-Machine logs`);

    // 3. Seed Visitors (Pre-Approved & Gate Logs)
    const visitors = await Visitor.create([
      {
        societyId: society._id,
        flatId: flatA101._id,
        buildingId: flatA101.buildingId,
        visitorName: 'Vikram Mehta',
        phone: '+91 98230 45678',
        purpose: 'GUEST',
        vehicleNumber: 'MH 12 QX 7842',
        entryType: 'PRE_APPROVED',
        passCode: '482910', // Easy to remember 6-digit test PIN
        qrToken: 'PASS-EMERALD-482910',
        status: 'EXPECTED',
        expectedDate: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        approvedBy: residentPiyush._id,
      },
      {
        societyId: society._id,
        flatId: flatA101._id,
        buildingId: flatA101.buildingId,
        visitorName: 'Urban Company Technician (Deepak)',
        phone: '+91 97654 32109',
        purpose: 'SERVICE',
        vehicleNumber: 'MH 14 BG 2291',
        entryType: 'PRE_APPROVED',
        passCode: '918234', // Easy to remember 6-digit test PIN
        qrToken: 'PASS-EMERALD-918234',
        status: 'EXPECTED',
        expectedDate: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        approvedBy: residentPiyush._id,
      },
      {
        societyId: society._id,
        flatId: flatA102._id,
        buildingId: flatA102.buildingId,
        visitorName: 'Swiggy Food Delivery (Rohan D.)',
        phone: '+91 99887 66554',
        purpose: 'DELIVERY',
        vehicleNumber: 'MH 12 TW 4099',
        entryType: 'WALK_IN',
        passCode: '334109',
        qrToken: 'PASS-SWIGGY-334109',
        status: 'CHECKED_IN',
        checkInTime: new Date(Date.now() - 25 * 60 * 1000),
        checkedInBy: securityGuard._id,
        approvedBy: tenantAnanya._id,
      },
      {
        societyId: society._id,
        flatId: flatB101._id,
        buildingId: flatB101.buildingId,
        visitorName: 'Uber Driver (Suresh Jadhav)',
        phone: '+91 97711 00998',
        purpose: 'CAB',
        vehicleNumber: 'MH 12 KP 9921',
        entryType: 'WALK_IN',
        passCode: '772184',
        qrToken: 'PASS-UBER-772184',
        status: 'CHECKED_OUT',
        checkInTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
        checkOutTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        checkedInBy: securityGuard._id,
        checkedOutBy: securityGuard._id,
        approvedBy: residentRajesh._id,
      },
    ]);
    console.log(`✅ Seeded ${visitors.length} Visitor Passes & Gate Logs`);

    console.log('\n🎉 Phase 2 Operations & Gatekeeper Data Seeded Successfully!');
    console.log('📌 Test Passes for Gatekeeper PIN Keypad:');
    console.log('   🎟️ PIN: 482910 -> Vikram Mehta (Flat A-101)');
    console.log('   🎟️ PIN: 918234 -> Urban Company Technician (Flat A-101)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Phase 2 Seeding Error:', error);
    process.exit(1);
  }
};

seedPhase2();
