import Notification from '../models/Notification.js';
import User from '../models/User.js';

class NotificationService {
  // Create a notification for new booking (to admin)
  async createNewBookingNotification(booking, adminUser) {
    try {
      const notification = new Notification({
        recipient: adminUser._id,
        sender: booking.user,
        type: 'booking_update',
        title: 'New Tour Booking Received',
        message: `New booking for ${booking.tourPackage?.title || 'tour package'} by ${booking.user?.name || 'customer'}. ${booking.numberOfTravelers} travelers for ${new Date(booking.travelDate).toLocaleDateString()}.`,
        relatedBooking: booking._id,
        priority: 'high',
        actionUrl: '/admin/dashboard?tab=tour-bookings'
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating new booking notification:', error);
      throw error;
    }
  }

  // Create a notification for booking confirmation (to user)
  async createBookingConfirmationNotification(booking, adminUser) {
    try {
      const notification = new Notification({
        recipient: booking.user._id,
        sender: adminUser._id,
        type: 'booking_update',
        title: 'Booking Confirmed!',
        message: `Great news! Your booking for ${booking.tourPackage?.title || 'tour package'} has been confirmed. Get ready for an amazing trip on ${new Date(booking.travelDate).toLocaleDateString()}!`,
        relatedBooking: booking._id,
        priority: 'high',
        actionUrl: '/dashboard?tab=tour-bookings'
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating booking confirmation notification:', error);
      throw error;
    }
  }

  // Create a notification for booking cancellation (to user)
  async createBookingCancellationNotification(booking, adminUser) {
    try {
      const notification = new Notification({
        recipient: booking.user._id,
        sender: adminUser._id,
        type: 'booking_update',
        title: 'Booking Cancelled',
        message: `Your booking for ${booking.tourPackage?.title || 'tour package'} has been cancelled. ${booking.cancellationReason ? `Reason: ${booking.cancellationReason}` : ''}`,
        relatedBooking: booking._id,
        priority: 'high',
        actionUrl: '/dashboard?tab=tour-bookings'
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating booking cancellation notification:', error);
      throw error;
    }
  }

  // Create a notification for booking completion (to user)
  async createBookingCompletionNotification(booking, adminUser) {
    try {
      const notification = new Notification({
        recipient: booking.user._id,
        sender: adminUser._id,
        type: 'booking_update',
        title: 'Trip Completed!',
        message: `Hope you had an amazing time on your ${booking.tourPackage?.title || 'tour package'} trip! We'd love to hear about your experience.`,
        relatedBooking: booking._id,
        priority: 'medium',
        actionUrl: '/dashboard?tab=tour-bookings'
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating booking completion notification:', error);
      throw error;
    }
  }

  // Get all admin users to notify
  async getAdminUsers() {
    try {
      const adminUsers = await User.find({ role: 'admin' }).select('_id name email');
      return adminUsers;
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  }

  // Notify all admins about new booking
  async notifyAdminsAboutNewBooking(booking) {
    try {
      const adminUsers = await this.getAdminUsers();
      const notifications = [];

      for (const admin of adminUsers) {
        const notification = await this.createNewBookingNotification(booking, admin);
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error notifying admins about new booking:', error);
      return [];
    }
  }
}

export default new NotificationService();