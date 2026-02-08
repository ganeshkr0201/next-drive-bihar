# Phone Number Formatting Update

## Overview
This update automatically adds the +91 country code prefix to all Indian phone numbers (10-digit numbers) when they are saved to the database.

## Changes Made

### 1. New Utility Function
**File:** `backend/utils/phoneFormatter.js`

- `formatPhoneNumber(phoneNumber)` - Formats a single phone number
- `formatPhoneFields(data, fields)` - Formats multiple phone fields in an object

**Logic:**
- If the number is 10 digits → adds `+91` prefix
- If the number already has `+91` → returns as is
- If the number has 12 digits starting with `91` → adds `+` prefix
- Otherwise → returns the original number

### 2. Updated Controllers

#### Public Controllers (`backend/controllers/publicControllers.js`)
- **Tour Bookings:** Formats `contactNumber` and `emergencyContact` before saving
- **Queries:** Formats `phone` and `whatsapp` before saving

#### Auth Controllers (`backend/controllers/authControllers.js`)
- **User Profile Update:** Formats `phone` when user updates their profile

### 3. Database Migration Script
**File:** `backend/scripts/updatePhoneNumbers.js`

Updates all existing records in the database:
- Tour Bookings (Booking collection)
- Car Bookings (CarBooking collection)
- Queries (Query collection)

**To run the migration:**
```bash
cd backend
npm run update-phone-numbers
```

## Affected Collections

1. **Booking** (Tour Bookings)
   - `contactNumber`
   - `emergencyContact`

2. **CarBooking** (Car Bookings)
   - `contactNumber`
   - `emergencyContact`

3. **Query** (Customer Queries)
   - `phone`
   - `whatsapp`

4. **User** (User Profiles)
   - `phone`

## Usage

### For New Records
Phone numbers are automatically formatted when:
- Creating a new tour booking
- Creating a new query
- Updating user profile

### For Existing Records
Run the migration script once to update all existing records:
```bash
npm run update-phone-numbers
```

## Examples

| Input | Output |
|-------|--------|
| `9876543210` | `+919876543210` |
| `+919876543210` | `+919876543210` |
| `919876543210` | `+919876543210` |
| `+91 9876543210` | `+919876543210` |

## Frontend Display

The phone numbers are now displayed with the +91 prefix in:
- My Bookings page (Additional Details section)
- Admin Dashboard (Additional Details section)

Both pages show clickable links:
- Phone numbers → `tel:+919876543210`
- WhatsApp numbers → `https://wa.me/919876543210` (with external link icon)

## Testing

1. Create a new booking with a 10-digit phone number
2. Verify it's saved with +91 prefix in the database
3. Check that it displays correctly in the UI
4. Test WhatsApp link opens correctly

## Notes

- The validation still accepts 10-digit numbers as input
- The formatting happens on the backend before saving
- Existing records need to be migrated using the script
- The script is idempotent (safe to run multiple times)
