# Admin UIDs Reference

This file stores the UIDs of admin users. You'll need this to add new admins to the Firestore rules.

## Current Admin UIDs

| Email | UID | Status |
|-------|-----|--------|
| `mohamedsallu24@gmail.com` | `lYVRBg9TPwTyjJEafMPpho0Zd0j2` | ✅ Active |
| `mohamedsallu.sl@gmail.com` | [Find UID from console] | [To be added] |

## How to Find Your UID

1. Open browser console (F12 → Console)
2. Login to admin dashboard
3. Try to perform an admin action (save photo, video, etc.)
4. Look for this in console:
   ```
   === AUTH DEBUG ===
   User UID: [YOUR_UID_HERE]
   ```
5. Copy the UID

## How to Add a New Admin

### Method 1: Using Admin SDK (Recommended)
1. Run `node set-admin-claims.js`
2. This will set the `admin: true` custom claim
3. Firestore rules will automatically recognize them as admin

### Method 2: Adding UID to Rules
1. Find the user's UID (see "How to Find Your UID" above)
2. Edit `firestore.rules`
3. Find the `isAdmin()` function
4. Add a new line:
   ```javascript
   || request.auth.uid == '[NEW_UID]'
   ```
5. Save and deploy: `firebase deploy --only firestore:rules`

## Example: Adding a Second Admin by UID

If the second admin's UID is `abc123def456ghi789jkl`:

Edit `firestore.rules`:
```javascript
function isAdmin() {
  return request.auth != null && (
    request.auth.token.admin == true
    || request.auth.uid == 'lYVRBg9TPwTyjJEafMPpho0Zd0j2'  // mohamedsallu24@gmail.com
    || request.auth.uid == 'abc123def456ghi789jkl'          // second admin
  );
}
```

Then deploy:
```bash
firebase deploy --only firestore:rules
```

## Why UIDs Instead of Emails?

- **UIDs are unique and immutable** - Cannot be changed by the user
- **UIDs are secure** - Only Firebase knows them, emails can be spoofed
- **UIDs don't need special token configuration** - Firestore provides them automatically in `request.auth.uid`
- **Emails aren't in Firebase token by default** - Would need complex setup to add them

## How to Check Current Rules

Open `firestore.rules` and look for the `isAdmin()` function. It will show which UIDs are currently admin.
