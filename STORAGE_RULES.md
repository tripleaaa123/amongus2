# Firebase Storage Rules

Since your app doesn't use Firebase Authentication and is for friends-only, use these simplified rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /proofs/{fileName} {
      allow read, write: if true;
    }
    
    match /assets/{fileName} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

**To update:**
1. Go to Firebase Console → Storage → Rules
2. Paste the rules above
3. Click **Publish**

Note: These rules allow anyone to read/write to the `proofs/` folder. For a friends-only app, this is fine. If you want more security later, you can add additional validation.

