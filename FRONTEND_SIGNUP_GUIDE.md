# Frontend Signup Guide - Complete Implementation

## Overview
The signup process is **email-based** with **auto-generated temporary passwords**. The frontend does NOT ask the user for a password during signup.

---

## 📡 Endpoint Details

### Signup Endpoint
```
POST https://ticketing-web-app.onrender.com/auth/signup
```

### Request Body (JSON)
```json
{
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "middle_name": "Michael",
  "branch_id": "550e8400-e29b-41d4-a716-446655440000",
  "department_id": "660e8400-e29b-41d4-a716-446655440000",
  "position": "IT Support",
  "contact_number": "09123456789",
  "role": "EMPLOYEE"
}
```

### Field Requirements

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | ✅ Yes | Must be unique, used as username for login |
| first_name | string | ✅ Yes | User's first name |
| last_name | string | ✅ Yes | User's last name |
| middle_name | string | ❌ No | Optional |
| branch_id | string (UUID) | ✅ Yes | Must be valid branch UUID |
| department_id | string (UUID) | ✅ Yes | Must be valid department UUID |
| position | string | ✅ Yes | Job title |
| contact_number | string | ✅ Yes | Phone number |
| role | string | ❌ No | Default: "EMPLOYEE", Options: ADMIN, MANAGER, EMPLOYEE, USER, TECHNICIAN |

⚠️ **NOTE: NO PASSWORD FIELD** - The backend generates a temporary password!

---

## 📨 Success Response (HTTP 200)

```json
{
  "message": "Registration successful! Account created with temporary password. Please change password on first login.",
  "temporaryPassword": "782945",
  "email": "john.doe@example.com"
}
```

### What to Do with the Response:
1. **Show the temporary password to the user** - Copy it or display it prominently
2. **Email the temporary password** - Send it to the user's email
3. **Instruct user to change password** - User must change it on first login
4. **Do NOT save the password in frontend** - It's temporary and one-time use

---

## ❌ Error Responses

### Email Already Exists (HTTP 409)
```json
{
  "statusCode": 409,
  "message": "Email user@example.com is already registered"
}
```
**Action:** Show message to user, ask them to use different email or reset password if they forgot

### Missing Required Field (HTTP 400)
```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "first_name should not be empty"
}
```
**Action:** Show validation error to user, highlight missing field

### Invalid Branch/Department ID (HTTP 400)
```json
{
  "statusCode": 400,
  "message": "Bad Request"
}
```
**Action:** Fetch list of valid branches and departments from backend, provide dropdown menus

### Database Error (HTTP 400)
```json
{
  "statusCode": 400,
  "message": "Database error: [error details]",
  "code": "23502",
  "detail": "..."
}
```
**Action:** Log to console, show generic "Registration failed" message to user

---

## 🔧 Frontend Implementation Examples

### 1. HTML Form (No Password Field!)
```html
<form (ngSubmit)="onSignup()">
  <!-- Email -->
  <input 
    type="email" 
    name="email" 
    placeholder="Email address"
    [(ngModel)]="formData.email"
    required
  />

  <!-- Name Fields -->
  <input 
    type="text" 
    name="first_name" 
    placeholder="First Name"
    [(ngModel)]="formData.first_name"
    required
  />
  
  <input 
    type="text" 
    name="last_name" 
    placeholder="Last Name"
    [(ngModel)]="formData.last_name"
    required
  />
  
  <input 
    type="text" 
    name="middle_name" 
    placeholder="Middle Name (optional)"
    [(ngModel)]="formData.middle_name"
  />

  <!-- Branch & Department Dropdowns -->
  <select 
    name="branch_id" 
    [(ngModel)]="formData.branch_id"
    required
  >
    <option value="">Select Branch</option>
    <option *ngFor="let branch of branches" [value]="branch.branch_id">
      {{ branch.branch_name }}
    </option>
  </select>

  <select 
    name="department_id" 
    [(ngModel)]="formData.department_id"
    required
  >
    <option value="">Select Department</option>
    <option *ngFor="let dept of departments" [value]="dept.department_id">
      {{ dept.department_name }}
    </option>
  </select>

  <!-- Position & Contact -->
  <input 
    type="text" 
    name="position" 
    placeholder="Position/Job Title"
    [(ngModel)]="formData.position"
    required
  />
  
  <input 
    type="tel" 
    name="contact_number" 
    placeholder="Contact Number"
    [(ngModel)]="formData.contact_number"
    required
  />

  <!-- NO PASSWORD INPUT - Backend auto-generates -->

  <button type="submit">Create Account</button>
</form>
```

### 2. TypeScript Component
```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  formData = {
    email: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    branch_id: '',
    department_id: '',
    position: '',
    contact_number: '',
    role: 'EMPLOYEE'
  };

  branches: any[] = [];
  departments: any[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  temporaryPassword = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load branches and departments for dropdown menus
    this.loadBranches();
    this.loadDepartments();
  }

  loadBranches(): void {
    this.http.get('https://ticketing-web-app.onrender.com/branch')
      .subscribe({
        next: (response: any) => {
          this.branches = response.data || response;
        },
        error: (error) => {
          console.error('Failed to load branches', error);
        }
      });
  }

  loadDepartments(): void {
    this.http.get('https://ticketing-web-app.onrender.com/department')
      .subscribe({
        next: (response: any) => {
          this.departments = response.data || response;
        },
        error: (error) => {
          console.error('Failed to load departments', error);
        }
      });
  }

  onSignup(): void {
    // Validate form
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post(
      'https://ticketing-web-app.onrender.com/auth/signup',
      this.formData
    ).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        // ✅ SUCCESS - Show temporary password
        console.log('✅ Signup successful!');
        console.log('Temporary Password:', response.temporaryPassword);
        
        this.temporaryPassword = response.temporaryPassword;
        this.successMessage = `
          Account created! 
          Temporary password: ${response.temporaryPassword}
          
          Please share this password with the user.
          They must change it on first login.
        `;

        // Option 1: Show modal/dialog with password
        this.showPasswordModal(
          response.email,
          response.temporaryPassword
        );

        // Option 2: Auto-login or redirect to login page
        // setTimeout(() => {
        //   this.router.navigate(['/login']);
        // }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        
        // ❌ ERROR - Show error message
        console.error('❌ Signup failed:', error);
        
        if (error.status === 409) {
          this.errorMessage = `This email (${this.formData.email}) is already registered.`;
        } else if (error.status === 400 && error.error.detail) {
          this.errorMessage = `Database error: ${error.error.detail}`;
        } else if (error.status === 400) {
          this.errorMessage = error.error.message || 'Registration failed. Please check your input.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      }
    });
  }

  validateForm(): boolean {
    if (!this.formData.email) {
      this.errorMessage = 'Email is required';
      return false;
    }
    if (!this.formData.first_name) {
      this.errorMessage = 'First name is required';
      return false;
    }
    if (!this.formData.last_name) {
      this.errorMessage = 'Last name is required';
      return false;
    }
    if (!this.formData.branch_id) {
      this.errorMessage = 'Branch is required';
      return false;
    }
    if (!this.formData.department_id) {
      this.errorMessage = 'Department is required';
      return false;
    }
    if (!this.formData.position) {
      this.errorMessage = 'Position is required';
      return false;
    }
    if (!this.formData.contact_number) {
      this.errorMessage = 'Contact number is required';
      return false;
    }
    return true;
  }

  showPasswordModal(email: string, password: string): void {
    // Show a modal/dialog with the temporary password
    // Example using window.alert (replace with proper modal component)
    
    const message = `
📝 New Account Created Successfully!

Email: ${email}
Temporary Password: ${password}

⚠️ IMPORTANT:
- Share this password with the user
- User must change password on first login
- Password expires/must be changed within 24 hours (optional)

✅ User can now login with:
- Username: ${email}
- Password: ${password}
    `;
    
    // Replace alert with proper modal/dialog
    // alert(message);
    
    // Or use a proper toast/notification library:
    // this.toastr.success(message, 'Success');
  }
}
```

### 3. Using Fetch API (Alternative)
```javascript
async function signupUser(userData) {
  try {
    const response = await fetch(
      'https://ticketing-web-app.onrender.com/auth/signup',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Signup failed:', error);
      return { success: false, error };
    }

    const data = await response.json();
    console.log('✅ Signup successful!');
    console.log('Temporary password:', data.temporaryPassword);
    console.log('Email:', data.email);
    
    // Show password to user
    showPasswordToUser(data.email, data.temporaryPassword);
    
    return { success: true, data };
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error };
  }
}

function showPasswordToUser(email, tempPassword) {
  // Display in modal/toast/alert
  alert(`
    ✅ Account Created!
    
    Email: ${email}
    Temporary Password: ${tempPassword}
    
    User must change password on first login
  `);
}

// Usage
const newUser = {
  email: 'john.doe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  branch_id: '550e8400-e29b-41d4-a716-446655440000',
  department_id: '660e8400-e29b-41d4-a716-446655440000',
  position: 'IT Support',
  contact_number: '09123456789'
};

signupUser(newUser);
```

---

## 🔐 After Signup - What User Does Next

### Step 1: Login with Email & Temporary Password
```
Username: john.doe@example.com
Password: 782945 (temporary password)
```

**Login Endpoint:**
```
POST https://ticketing-web-app.onrender.com/auth/login
{
  "username": "john.doe@example.com",
  "password": "782945"
}
```

### Step 2: Check password_changed Flag
Backend response includes:
```json
{
  "access_token": "eyJhbGciOi...",
  "user": {
    "user_id": "uuid",
    "username": "john.doe@example.com",
    "password_changed": false,  // ← THIS IS IMPORTANT!
    "employee": {...}
  }
}
```

### Step 3: Frontend Checks password_changed
```typescript
// In login component
if (!response.user.password_changed) {
  console.log('⚠️ User must change password on first login');
  
  // Show password change page
  this.router.navigate(['/change-password']);
  
  // Or show modal requiring password change
  this.showPasswordChangeModal();
}
```

### Step 4: User Changes Password
**Change Password Endpoint:**
```
POST https://ticketing-web-app.onrender.com/auth/change-password
Headers: Authorization: Bearer {access_token}

{
  "currentPassword": "782945",
  "newPassword": "MySecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

Now `password_changed` is `true` and user can access the dashboard!

---

## 📋 Complete Frontend Signup Checklist

- [ ] Create signup form without password field
- [ ] Add email input field
- [ ] Add first_name, last_name, middle_name inputs
- [ ] Add branch dropdown (fetch from `/branch` endpoint)
- [ ] Add department dropdown (fetch from `/department` endpoint)
- [ ] Add position input
- [ ] Add contact_number input
- [ ] Validate all required fields before submission
- [ ] POST to `/auth/signup` with form data
- [ ] Handle success response - show temporary password
- [ ] Copy/display password for user to share
- [ ] Handle 409 conflict error (email exists)
- [ ] Handle 400 validation errors
- [ ] Redirect to login page after successful signup
- [ ] In login response, check `user.password_changed`
- [ ] If `password_changed === false`, redirect to `/change-password`
- [ ] Implement change password form with current + new password
- [ ] POST to `/auth/change-password` after user enters new password
- [ ] On password change success, allow access to dashboard
- [ ] Add loading spinner during signup/password change
- [ ] Display error messages to user

---

## 🐛 Troubleshooting

### "Email already registered" Error
- User already has an account
- Check if they need password reset instead
- Use different email if creating test account

### "Database error: null value in column 'employee_id'"
- Backend issue (not frontend problem)
- Database might need reset
- Check backend logs on Render

### Temporary Password Not Showing
- Make sure response was successful (status 200)
- Check network tab in browser dev tools
- Verify backend returned `temporaryPassword` in response

### Login Fails After Signup
- Verify email was created successfully
- Check that temporary password was copied correctly
- Verify backend didn't change password during creation

