import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../models/Booking.js';
import CarBooking from '../models/CarBooking.js';
import Query from '../models/Query.js';
import { formatPhoneNumber } from '../utils/phoneFormatter.js';

// Load environment variables
dotenv.config();

/**
 * Script to update all existing phone numbers in the database
 * Adds +91 prefix to 10-digit Indian phone numbers
 */

const updatePhoneNumbers = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    let totalUpdated = 0;

    // Update Tour Bookings
    console.log('📋 Updating Tour Bookings...');
    const tourBookings = await Booking.find({
      $or: [
        { contactNumber: { $exists: true, $ne: null } },
        { emergencyContact: { $exists: true, $ne: null } }
      ]
    });

    let tourBookingsUpdated = 0;
    for (const booking of tourBookings) {
      let updated = false;
      
      if (booking.contactNumber) {
        const formatted = formatPhoneNumber(booking.contactNumber);
        if (formatted !== booking.contactNumber) {
          booking.contactNumber = formatted;
          updated = true;
        }
      }
      
      if (booking.emergencyContact) {
        const formatted = formatPhoneNumber(booking.emergencyContact);
        if (formatted !== booking.emergencyContact) {
          booking.emergencyContact = formatted;
          updated = true;
        }
      }
      
      if (updated) {
        await booking.save();
        tourBookingsUpdated++;
        console.log(`  ✓ Updated booking ${booking.bookingReference}`);
      }
    }
    console.log(`✅ Updated ${tourBookingsUpdated} tour bookings\n`);
    totalUpdated += tourBookingsUpdated;

    // Update Car Bookings
    console.log('🚗 Updating Car Bookings...');
    const carBookings = await CarBooking.find({
      $or: [
        { contactNumber: { $exists: true, $ne: null } },
        { emergencyContact: { $exists: true, $ne: null } }
      ]
    });

    let carBookingsUpdated = 0;
    for (const booking of carBookings) {
      let updated = false;
      
      if (booking.contactNumber) {
        const formatted = formatPhoneNumber(booking.contactNumber);
        if (formatted !== booking.contactNumber) {
          booking.contactNumber = formatted;
          updated = true;
        }
      }
      
      if (booking.emergencyContact) {
        const formatted = formatPhoneNumber(booking.emergencyContact);
        if (formatted !== booking.emergencyContact) {
          booking.emergencyContact = formatted;
          updated = true;
        }
      }
      
      if (updated) {
        await booking.save();
        carBookingsUpdated++;
        console.log(`  ✓ Updated car booking ${booking.bookingReference}`);
      }
    }
    console.log(`✅ Updated ${carBookingsUpdated} car bookings\n`);
    totalUpdated += carBookingsUpdated;

    // Update Queries
    console.log('💬 Updating Queries...');
    const queries = await Query.find({
      $or: [
        { phone: { $exists: true, $ne: null } },
        { whatsapp: { $exists: true, $ne: null } }
      ]
    });

    let queriesUpdated = 0;
    for (const query of queries) {
      let updated = false;
      
      if (query.phone) {
        const formatted = formatPhoneNumber(query.phone);
        if (formatted !== query.phone) {
          query.phone = formatted;
          updated = true;
        }
      }
      
      if (query.whatsapp) {
        const formatted = formatPhoneNumber(query.whatsapp);
        if (formatted !== query.whatsapp) {
          query.whatsapp = formatted;
          updated = true;
        }
      }
      
      if (updated) {
        await query.save();
        queriesUpdated++;
        console.log(`  ✓ Updated query ${query._id}`);
      }
    }
    console.log(`✅ Updated ${queriesUpdated} queries\n`);
    totalUpdated += queriesUpdated;

    console.log('═══════════════════════════════════════');
    console.log(`🎉 Migration completed successfully!`);
    console.log(`📊 Total records updated: ${totalUpdated}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error updating phone numbers:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the migration
updatePhoneNumbers();
