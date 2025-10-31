# Vercel Deployment Setup

## Environment Variables

You need to set the following environment variables in your Vercel project:

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables (make sure to select all environments: Production, Preview, Development):

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDvUDjoHC3EgWHwjKUZVImKprvd5iovhRA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=among-us-irl-86233.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://among-us-irl-86233-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=among-us-irl-86233
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=among-us-irl-86233.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=777691606799
NEXT_PUBLIC_FIREBASE_APP_ID=1:777691606799:web:68a07b4b74f7da6297187a
```

5. After adding all variables, **redeploy your application** for the changes to take effect.

## Firestore Security Rules

You also need to configure Firestore security rules:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `among-us-irl-86233`
3. Go to **Firestore Database** → **Rules**
4. Set these rules to allow read/write (for a friends-only app):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish** to save the rules.

## Troubleshooting

If you still get 400 errors:
- Verify all environment variables are set in Vercel (check for typos)
- Make sure you redeployed after adding environment variables
- Check Firestore rules are published
- Check the browser console for more detailed error messages

