import Notification from '../models/Notification.js';
import User from '../models/User.js';



// Get user notifications
export const getUsersNotifications = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name email avatar')
      .populate('relatedQuery', 'subject')
      .populate('relatedBooking', 'bookingId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Notification.countDocuments({ recipient: req.user._id })
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
}



// Get unread notifications count
export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
}

// Mark notification as read
export const markNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: req.params.id, 
        recipient: req.user._id 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
}


// Mark all notifications as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        recipient: req.user._id, 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
}


// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
}


// Create notification (admin only)
export const adminNotification = async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientId,
      type,
      title,
      message,
      relatedQuery,
      relatedBooking,
      priority = 'medium',
      actionUrl
    } = req.body;

    // Find recipient
    let recipient;
    if (recipientId) {
      recipient = await User.findById(recipientId);
    } else if (recipientEmail) {
      recipient = await User.findOne({ email: recipientEmail });
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    const notification = new Notification({
      recipient: recipient._id,
      sender: req.user._id,
      type,
      title,
      message,
      relatedQuery,
      relatedBooking,
      priority,
      actionUrl
    });

    await notification.save();

    // Populate sender info for response
    await notification.populate('sender', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
}



// Rate query response
export const queryResponse = async (req, res) => {
  try {
    const {
      userEmail,
      type,
      title,
      message,
      relatedQuery,
      priority = 'medium'
    } = req.body;

    if (!userEmail || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'User email, type, title, and message are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const notification = new Notification({
      recipient: user._id,
      sender: req.user._id,
      type,
      title,
      message,
      relatedQuery,
      priority
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
}



// Send notification to user by email (admin only)
export const sendNotificationViaEmail = async (req, res) => {
  try {
    const {
      userEmail,
      type,
      title,
      message,
      relatedQuery,
      priority = 'medium'
    } = req.body;

    if (!userEmail || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'User email, type, title, and message are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const notification = new Notification({
      recipient: user._id,
      sender: req.user._id,
      type,
      title,
      message,
      relatedQuery,
      priority
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
}