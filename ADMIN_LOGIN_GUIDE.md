# Admin Login Guide

## ⚡ Quick Fix Applied

Updated Firestore rules to check both `request.auth.token.email` and `request.auth.email` fields. The permission errors should now be resolved!

## Step 1: Hard Refresh Your Browser
Press **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac) to clear the cache and reload.

## Step 2: Navigate to Admin Dashboard
Go to: `http://localhost:3000/admin`

## Step 3: Login with Admin Credentials
**Email:** `mohamedsallu24@gmail.com`
**Password:** `P@$$w0rd`

**Alternative Admin Email:**
**Email:** `mohamedsallu.sl@gmail.com`
**Password:** (use your Firebase password)

## Step 4: Test Creating Content
1. Sign in successfully
2. Go to any section (Videos, Photos, Quizzes, etc.) from sidebar
3. Click "Add [Item]"
4. Fill in required fields
5. Click Save
6. You should see a success message! ✅

## Step 5: Proper Admin Setup (Optional but Recommended)

For maximum security, set up admin claims using the Firebase Admin SDK:

### Download Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **termophysics-e9fc1**
3. Click ⚙️ **Project Settings** (gear icon)
4. Click **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save as `serviceAccountKey.json` in the `termo` folder

### Run Setup Script
```bash
cd c:\Users\ETUSL-CAPS\termo
node set-admin-claims.js
```

### Refresh and Test
- Log out completely
- Hard refresh: `Ctrl+Shift+R`
- Log back in
- Console should now show: `Is admin by claim: true`
6. Should see "Video created" success message

## Firebase Credentials to Check
- Project ID: `termophysics-e9fc1`
- Admin Emails:
  - `mohamedsallu.sl@gmail.com`
  - `mohamedsallu24@gmail.com`

## If Still Not Working
1. Deploy rules again: `firebase deploy --only firestore:rules`
2. Check Firestore Console for any errors
3. Look at Firestore Rules to ensure both emails are listed in `isAdmin()`
