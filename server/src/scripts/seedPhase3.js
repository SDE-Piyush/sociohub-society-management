import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Society from '../models/Society.js';
import Building from '../models/Building.js';
import Flat from '../models/Flat.js';
import User from '../models/User.js';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import Amenity from '../models/Amenity.js';
import AmenityBooking from '../models/AmenityBooking.js';
import Poll from '../models/Poll.js';

dotenv.config();

export const seedPhase3 = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sociohub';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    console.log('🌱 Connected to MongoDB for Phase 3 Seeding...');

    const society = await Society.findOne({ name: 'Emerald Heights Residency' });
    if (!society) {
      console.error('❌ Society not found. Please run seedPhase1 first.');
      return;
    }

    const adminUser = await User.findOne({ email: 'admin@emeraldheights.com' });
    const residentPiyush = await User.findOne({ email: 'piyush.resident@emeraldheights.com' });
    const tenantAnanya = await User.findOne({ email: 'ananya.tenant@emeraldheights.com' });
    const residentRajesh = await User.findOne({ email: 'rajesh.owner@emeraldheights.com' });

    const flatA101 = await Flat.findOne({ flatNumber: '101' });
    const flatA102 = await Flat.findOne({ flatNumber: '102' });
    const flatB101 = await Flat.findOne({ flatNumber: '101', buildingId: { $ne: flatA101?.buildingId } });

    // Clear Phase 3 collections
    await Amenity.deleteMany({});
    await AmenityBooking.deleteMany({});
    await Bill.deleteMany({});
    await Poll.deleteMany({});
    console.log('🧹 Cleaned existing Phase 3 collections...');

    // 1. Seed Amenities
    const amenities = await Amenity.create([
      {
        societyId: society._id,
        name: 'Grand Clubhouse Banquet & Party Hall',
        code: 'CLUBHOUSE',
        description: 'Air-conditioned luxury banquet space with audio-visual system, pantry, and dining capacity for 120 guests.',
        category: 'CLUBHOUSE',
        capacity: 120,
        location: 'Clubhouse 1st Floor',
        icon: 'Sparkles',
        hourlyRate: 500,
        rules: [
          'Advance booking required at least 24 hours prior.',
          'Catering setup permitted in pantry zone only.',
          'Music permitted until 10:30 PM as per municipal guidelines.',
          'Security deposit refundable post inspection.',
        ],
        openingTime: '08:00',
        closingTime: '23:00',
        slotDurationMinutes: 60,
        isActive: true,
      },
      {
        societyId: society._id,
        name: 'Olympic Heated Swimming Pool',
        code: 'POOL',
        description: '25-meter half-Olympic temperature-controlled swimming pool with dedicated kids splash area and certified lifeguard.',
        category: 'SPORTS',
        capacity: 25,
        location: 'Ground Deck Complex',
        icon: 'Droplets',
        hourlyRate: 0,
        rules: [
          'Appropriate synthetic nylon/lycra swimwear mandatory.',
          'Children below 10 must be accompanied by parents.',
          'Shower mandatory prior to pool entry.',
          'No glassware or food items near pool deck.',
        ],
        openingTime: '06:00',
        closingTime: '21:00',
        slotDurationMinutes: 60,
        isActive: true,
      },
      {
        societyId: society._id,
        name: 'Floodlit Tennis & Pickleball Court',
        code: 'TENNIS',
        description: 'US Open blue synthetic acrylic hard court with LED floodlights for morning and night play.',
        category: 'SPORTS',
        capacity: 4,
        location: 'Sports Arena East',
        icon: 'Zap',
        hourlyRate: 150,
        rules: [
          'Non-marking tennis shoes mandatory on court surface.',
          'Maximum 4 players on court simultaneously.',
          'Bring your own racquets and tennis balls.',
          'Floodlight charges included in hourly booking fee.',
        ],
        openingTime: '06:00',
        closingTime: '22:00',
        slotDurationMinutes: 60,
        isActive: true,
      },
      {
        societyId: society._id,
        name: 'High-Performance Gym & Yoga Studio',
        code: 'GYM',
        description: 'State-of-the-art cardiovascular and strength training equipment with dedicated wooden floor yoga corner.',
        category: 'FITNESS',
        capacity: 20,
        location: 'Clubhouse 2nd Floor',
        icon: 'CalendarDays',
        hourlyRate: 0,
        rules: [
          'Clean indoor gym shoes and sweat towel mandatory.',
          'Sanitize equipment grips after completing sets.',
          'Return dumbbells and barbells to respective racks.',
        ],
        openingTime: '06:00',
        closingTime: '22:00',
        slotDurationMinutes: 60,
        isActive: true,
      },
    ]);
    console.log(`✅ Seeded ${amenities.length} Amenities`);

    // 2. Seed Amenity Bookings for Today & Tomorrow
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const tennisAmenity = amenities.find((a) => a.code === 'TENNIS');
    const poolAmenity = amenities.find((a) => a.code === 'POOL');
    const clubhouseAmenity = amenities.find((a) => a.code === 'CLUBHOUSE');

    if (residentPiyush && flatA101 && tennisAmenity) {
      await AmenityBooking.create([
        {
          societyId: society._id,
          amenityId: tennisAmenity._id,
          userId: residentPiyush._id,
          flatId: flatA101._id,
          bookingDate: todayStr,
          startTime: '18:00',
          endTime: '19:00',
          purpose: 'Evening doubles match with Flat 201 neighbors',
          guestCount: 3,
          totalCharges: 150,
          status: 'CONFIRMED',
          bookingRef: 'BKG-2026-TNN-101',
        },
        {
          societyId: society._id,
          amenityId: poolAmenity._id,
          userId: residentPiyush._id,
          flatId: flatA101._id,
          bookingDate: tomorrowStr,
          startTime: '07:00',
          endTime: '08:00',
          purpose: 'Morning fitness laps',
          guestCount: 1,
          totalCharges: 0,
          status: 'CONFIRMED',
          bookingRef: 'BKG-2026-POL-102',
        },
      ]);
    }

    if (residentRajesh && flatB101 && clubhouseAmenity) {
      await AmenityBooking.create({
        societyId: society._id,
        amenityId: clubhouseAmenity._id,
        userId: residentRajesh._id,
        flatId: flatB101._id,
        bookingDate: tomorrowStr,
        startTime: '19:00',
        endTime: '20:00',
        purpose: 'Daughter 10th Birthday Celebration',
        guestCount: 40,
        totalCharges: 500,
        status: 'CONFIRMED',
        bookingRef: 'BKG-2026-CLB-103',
      });
    }
    console.log(`✅ Seeded sample Amenity Bookings`);

    // 3. Seed Maintenance Bills (Only for allotted / occupied flats)
    const allFlats = await Flat.find({
      societyId: society._id,
      $or: [
        { occupancyStatus: { $ne: 'VACANT' } },
        { ownerId: { $ne: null } },
        { tenantId: { $ne: null } },
      ],
    });
    const bills = [];

    for (const flat of allFlats) {
      const base = flat.monthlyMaintenance || 4200;
      const isA101 = flatA101 && flat._id.toString() === flatA101._id.toString();
      const isA102 = flatA102 && flat._id.toString() === flatA102._id.toString();

      // October 2026 Bill
      bills.push({
        societyId: society._id,
        flatId: flat._id,
        buildingId: flat.buildingId,
        month: 'October 2026',
        year: 2026,
        billNumber: `INV-2026-10-${flat.flatNumber}`,
        baseAmount: base,
        utilityCharges: 250,
        lateFine: 0,
        totalAmount: base + 250,
        dueDate: new Date('2026-10-20T23:59:59'),
        status: isA102 ? 'PAID' : 'UNPAID',
        paidAt: isA102 ? new Date('2026-10-05') : null,
        paidAmount: isA102 ? base + 250 : 0,
        paymentMethod: isA102 ? 'UPI' : '',
      });

      // November 2026 Bill (Upcoming)
      bills.push({
        societyId: society._id,
        flatId: flat._id,
        buildingId: flat.buildingId,
        month: 'November 2026',
        year: 2026,
        billNumber: `INV-2026-11-${flat.flatNumber}`,
        baseAmount: base,
        utilityCharges: 250,
        lateFine: 0,
        totalAmount: base + 250,
        dueDate: new Date('2026-11-15T23:59:59'),
        status: 'UNPAID',
      });
    }

    await Bill.insertMany(bills);
    console.log(`✅ Seeded ${bills.length} Maintenance Bills`);

    // 4. Seed Community Polls
    const pollExpiry1 = new Date();
    pollExpiry1.setDate(pollExpiry1.getDate() + 10);

    const pollExpiry2 = new Date();
    pollExpiry2.setDate(pollExpiry2.getDate() + 14);

    const pollExpiry3 = new Date();
    pollExpiry3.setDate(pollExpiry3.getDate() + 7);

    const polls = await Poll.create([
      {
        societyId: society._id,
        createdBy: adminUser._id,
        question: '⚡ Should we install 8 EV Fast-Charging Stations in Basement 1 & 2?',
        description:
          'Management has received proposals from Tata Power & Jio-BP. Capital expenditure will be 60% funded from the society reserve surplus, with zero monthly recurring cost to non-EV owners.',
        category: 'AMENITIES',
        targetAudience: 'ALL',
        endDate: pollExpiry1,
        status: 'ACTIVE',
        options: [
          { optionId: 'opt-1', text: 'Yes, approve installation across both basements', votesCount: 28 },
          { optionId: 'opt-2', text: 'Yes, but start with 4 bays in Basement 1 first', votesCount: 14 },
          { optionId: 'opt-3', text: 'No, current grid capacity is inadequate', votesCount: 4 },
        ],
        votes: [
          {
            userId: residentPiyush._id,
            flatId: flatA101._id,
            optionId: 'opt-1',
            votedAt: new Date(),
          },
          {
            userId: tenantAnanya._id,
            flatId: flatA102._id,
            optionId: 'opt-2',
            votedAt: new Date(),
          },
        ],
      },
      {
        societyId: society._id,
        createdBy: adminUser._id,
        question: '🦮 Proposed Demarcated Pet Exercise Zone & Timings Bylaw',
        description:
          'To ensure child safety while respecting pet owners, should we convert the rear green corridor of Wing B into a dedicated off-leash pet park with daily hours 6:00 AM - 8:30 AM & 7:30 PM - 9:30 PM?',
        category: 'RULES',
        targetAudience: 'ALL',
        endDate: pollExpiry2,
        status: 'ACTIVE',
        options: [
          { optionId: 'opt-1', text: 'Approve dedicated pet zone & designated hours', votesCount: 32 },
          { optionId: 'opt-2', text: 'Require mandatory leashing everywhere on premises', votesCount: 19 },
          { optionId: 'opt-3', text: 'Refer to General Body Meeting (AGM) agenda', votesCount: 7 },
        ],
        votes: [
          {
            userId: residentPiyush._id,
            flatId: flatA101._id,
            optionId: 'opt-1',
            votedAt: new Date(),
          },
        ],
      },
      {
        societyId: society._id,
        createdBy: adminUser._id,
        question: '🪔 Diwali Grand Cultural Dinner — Preferred Feast Menu',
        description:
          'Cast your family vote to select the headline catering theme for the upcoming Annual Diwali Resident Gathering on the central amphitheatre lawn.',
        category: 'FESTIVAL',
        targetAudience: 'ALL',
        endDate: pollExpiry3,
        status: 'ACTIVE',
        options: [
          { optionId: 'opt-1', text: 'Royal Rajasthani & Marwari Delicacy Buffet', votesCount: 38 },
          { optionId: 'opt-2', text: 'Live Pan-Indian Chaat Street & Charcoal Tandoor', votesCount: 45 },
          { optionId: 'opt-3', text: 'Continental Wood-fired Pizza & Mediterranean Bar', votesCount: 16 },
        ],
        votes: [],
      },
    ]);
    console.log(`✅ Seeded ${polls.length} Community Polls`);

    console.log('🎉 Phase 3 Seeding Completed Successfully!');
  } catch (error) {
    console.error('❌ Error during Phase 3 seeding:', error);
  }
};

// If run directly via node
if (process.argv[1]?.endsWith('seedPhase3.js')) {
  seedPhase3().then(() => process.exit(0));
}

export default seedPhase3;
