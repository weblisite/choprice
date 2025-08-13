# 🧪 Rider Profile Testing Guide

## 🎯 **Testing the Profile Form Functionality**

### **Step 1: Access the Rider Portal**
1. Open your browser and navigate to: `http://localhost:3003`
2. You should see the Choprice Rider login page

### **Step 2: Sign Up / Log In**
1. **If you don't have an account:**
   - Click "Sign up" or navigate to `http://localhost:3003/register`
   - Complete the signup process with Clerk
   
2. **If you have an account:**
   - Enter your credentials on the login page

### **Step 3: Navigate to Profile**
1. After successful login, you should be on the dashboard
2. Click on "Profile" in the navigation menu
3. Or directly navigate to: `http://localhost:3003/profile`

### **Step 4: Test Profile Form**

#### **🔍 What You Should See:**
- **Blue Info Alert:** "Profile View Mode: Click 'Edit Profile' to modify your information"
- **Debug Info Alert** (development only): Shows edit mode status and user info
- **Edit Profile Button:** Blue button with edit icon in the top-right of the Personal Information card

#### **📝 Testing Form Fields:**

1. **Initial State (View Mode):**
   - All form fields should be **DISABLED/GRAYED OUT**
   - You **cannot** type in any fields
   - This is the **correct behavior**

2. **Click "Edit Profile" Button:**
   - Button should be prominent and blue with an edit icon
   - After clicking, you should see:
     - **Orange Warning Alert:** "Edit Mode: You can now modify your profile information"
     - **Debug Info** should show "Edit Mode: ON" and "Form Fields Enabled: YES"
     - **Save** and **Cancel** buttons should appear

3. **Edit Mode Testing:**
   - **Phone Number:** Should be editable text input
   - **Vehicle Type:** Should be editable dropdown (Motorcycle, Bicycle, Car, Scooter)
   - **License Plate:** Should be editable text input
   - **Emergency Contact Name:** Should be editable text input
   - **Emergency Contact Phone:** Should be editable text input

4. **Test Saving:**
   - Make some changes to the fields
   - Click "Save" button
   - Should see success message: "Profile updated successfully! (Demo mode)"
   - Form should return to view mode (fields disabled again)

5. **Test Canceling:**
   - Click "Edit Profile" again
   - Make some changes
   - Click "Cancel" button
   - Changes should be reverted
   - Form should return to view mode

## 🚨 **Troubleshooting**

### **If you can't type in fields:**
- ✅ **This is correct behavior in View Mode**
- 🔧 **Solution:** Click the "Edit Profile" button first

### **If Edit Profile button doesn't work:**
- Check browser console for JavaScript errors
- Ensure you're logged in (check debug info alert)
- Try refreshing the page

### **If profile page doesn't load:**
- Ensure you're logged in to the rider portal
- Check that the rider PWA is running on port 3003
- Try logging out and logging back in

### **If you see authentication errors:**
- Make sure Clerk keys are properly configured
- Try clearing browser cache and cookies
- Check that the backend server is running on port 3000

## 🎯 **Expected Behavior Summary**

| State | Fields Editable | Buttons Visible | Alert Message |
|-------|----------------|----------------|---------------|
| **View Mode** | ❌ No | "Edit Profile" | Blue info alert |
| **Edit Mode** | ✅ Yes | "Save", "Cancel" | Orange warning alert |

## 🔧 **Debug Information**

The profile page includes debug information in development mode that shows:
- Current edit mode status
- User authentication status
- Form field enabled/disabled state

This helps identify if the issue is with authentication, state management, or form controls.