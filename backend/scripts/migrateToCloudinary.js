// Migration script to move existing local images to Cloudinary
// Run this script after setting up Cloudinary to migrate existing images

import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import User from '../models/User.js';
import TourPackage from '../models/TourPackage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Upload image to Cloudinary
const uploadToCloudinary = async (localPath, folder, publicId) => {
  try {
    const fullPath = path.join(process.cwd(), localPath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ File not found: ${fullPath}`);
      return null;
    }

    const result = await cloudinary.uploader.upload(fullPath, {
      folder: `nextdrive/${folder}`,
      public_id: publicId,
      transformation: folder === 'avatars' 
        ? [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }, { quality: 'auto', fetch_format: 'auto' }]
        : [{ width: 1200, height: 800, crop: 'fill' }, { quality: 'auto', fetch_format: 'auto' }]
    });

    console.log(`✅ Uploaded: ${localPath} → ${result.secure_url}`);
    return result;
  } catch (error) {
    console.error(`❌ Upload failed for ${localPath}:`, error.message);
    return null;
  }
};

// Migrate user avatars
const migrateUserAvatars = async () => {
  console.log('\n🔄 Migrating user avatars...');
  
  const users = await User.find({ 
    avatar: { $exists: true, $ne: null, $ne: '' },
    avatarPublicId: { $exists: false } // Only migrate users without Cloudinary public ID
  });

  console.log(`Found ${users.length} users with local avatars`);

  for (const user of users) {
    try {
      // Skip if avatar is already a Cloudinary URL
      if (user.avatar.includes('cloudinary.com')) {
        console.log(`⏭️ Skipping user ${user.name} - already using Cloudinary`);
        continue;
      }

      const publicId = `avatar_${user._id}_${Date.now()}`;
      const result = await uploadToCloudinary(user.avatar, 'avatars', publicId);

      if (result) {
        // Update user with Cloudinary URL and public ID
        user.avatar = result.secure_url;
        user.avatarPublicId = result.public_id;
        await user.save();

        console.log(`✅ Migrated avatar for user: ${user.name}`);

        // Delete local file after successful upload
        try {
          const localPath = path.join(process.cwd(), user.avatar);
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
            console.log(`🗑️ Deleted local file: ${user.avatar}`);
          }
        } catch (deleteError) {
          console.error(`⚠️ Could not delete local file: ${deleteError.message}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error migrating avatar for user ${user.name}:`, error.message);
    }
  }

  console.log('✅ User avatar migration completed');
};

// Migrate tour package images
const migrateTourPackageImages = async () => {
  console.log('\n🔄 Migrating tour package images...');
  
  const tourPackages = await TourPackage.find({
    $or: [
      { 'images.featured': { $exists: true, $ne: null, $ne: '' } },
      { 'images.gallery.0': { $exists: true } }
    ]
  });

  console.log(`Found ${tourPackages.length} tour packages with images`);

  for (const tourPackage of tourPackages) {
    try {
      let updated = false;

      // Migrate featured image
      if (tourPackage.images.featured && !tourPackage.images.featured.includes('cloudinary.com')) {
        const publicId = `tour_${tourPackage._id}_featured_${Date.now()}`;
        const result = await uploadToCloudinary(tourPackage.images.featured, 'tours', publicId);

        if (result) {
          tourPackage.images.featured = result.secure_url;
          tourPackage.images.featuredPublicId = result.public_id;
          updated = true;

          console.log(`✅ Migrated featured image for tour: ${tourPackage.title}`);

          // Delete local file
          try {
            const localPath = path.join(process.cwd(), tourPackage.images.featured);
            if (fs.existsSync(localPath)) {
              fs.unlinkSync(localPath);
              console.log(`🗑️ Deleted local featured image`);
            }
          } catch (deleteError) {
            console.error(`⚠️ Could not delete local featured image: ${deleteError.message}`);
          }
        }
      }

      // Migrate gallery images
      if (tourPackage.images.gallery && tourPackage.images.gallery.length > 0) {
        const newGallery = [];

        for (let i = 0; i < tourPackage.images.gallery.length; i++) {
          const galleryImage = tourPackage.images.gallery[i];
          
          // Handle both old format (string) and new format (object)
          const imageUrl = typeof galleryImage === 'string' ? galleryImage : galleryImage.url;
          
          if (imageUrl && !imageUrl.includes('cloudinary.com')) {
            const publicId = `tour_${tourPackage._id}_gallery_${i}_${Date.now()}`;
            const result = await uploadToCloudinary(imageUrl, 'tours', publicId);

            if (result) {
              newGallery.push({
                url: result.secure_url,
                publicId: result.public_id,
                caption: typeof galleryImage === 'object' ? galleryImage.caption || '' : '',
                alt: typeof galleryImage === 'object' ? galleryImage.alt || tourPackage.title : tourPackage.title
              });

              console.log(`✅ Migrated gallery image ${i + 1} for tour: ${tourPackage.title}`);

              // Delete local file
              try {
                const localPath = path.join(process.cwd(), imageUrl);
                if (fs.existsSync(localPath)) {
                  fs.unlinkSync(localPath);
                  console.log(`🗑️ Deleted local gallery image ${i + 1}`);
                }
              } catch (deleteError) {
                console.error(`⚠️ Could not delete local gallery image: ${deleteError.message}`);
              }
            }
          } else {
            // Keep existing Cloudinary images or skip invalid URLs
            if (typeof galleryImage === 'object') {
              newGallery.push(galleryImage);
            } else if (imageUrl && imageUrl.includes('cloudinary.com')) {
              newGallery.push({
                url: imageUrl,
                publicId: '', // Will need to be extracted if needed
                caption: '',
                alt: tourPackage.title
              });
            }
          }
        }

        if (newGallery.length > 0) {
          tourPackage.images.gallery = newGallery;
          updated = true;
        }
      }

      if (updated) {
        await tourPackage.save();
        console.log(`✅ Updated tour package: ${tourPackage.title}`);
      }
    } catch (error) {
      console.error(`❌ Error migrating images for tour ${tourPackage.title}:`, error.message);
    }
  }

  console.log('✅ Tour package image migration completed');
};

// Clean up empty directories
const cleanupEmptyDirectories = () => {
  console.log('\n🧹 Cleaning up empty directories...');
  
  const directories = [
    'uploads/avatars',
    'uploads/tour-packages',
    'uploads'
  ];

  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    
    try {
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        if (files.length === 0) {
          fs.rmdirSync(fullPath);
          console.log(`🗑️ Removed empty directory: ${dir}`);
        } else {
          console.log(`📁 Directory not empty: ${dir} (${files.length} files remaining)`);
        }
      }
    } catch (error) {
      console.error(`⚠️ Could not process directory ${dir}:`, error.message);
    }
  });
};

// Main migration function
const runMigration = async () => {
  console.log('🚀 Starting Cloudinary migration...');
  console.log('⚠️ Make sure to backup your database before running this migration!');
  
  // Check Cloudinary configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
    process.exit(1);
  }

  try {
    await connectDB();
    
    // Test Cloudinary connection
    const testResult = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful');

    await migrateUserAvatars();
    await migrateTourPackageImages();
    cleanupEmptyDirectories();

    console.log('\n🎉 Migration completed successfully!');
    console.log('📋 Summary:');
    console.log('   - User avatars migrated to Cloudinary');
    console.log('   - Tour package images migrated to Cloudinary');
    console.log('   - Local files cleaned up');
    console.log('   - Database updated with Cloudinary URLs and public IDs');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export default runMigration;