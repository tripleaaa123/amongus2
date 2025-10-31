# Firebase Storage Setup

## Storage Security Rules

You need to configure Firebase Storage rules to allow image uploads:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `among-us-irl-86233`
3. Go to **Storage** → **Rules**
4. Replace the rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /proofs/{fileName} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish** to save the rules.

## Note

For a friends-only app, allowing all read/write is fine. If you want more security later, you can restrict based on authentication or request validation.

