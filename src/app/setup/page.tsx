'use client';

import { useEffect, useState } from 'react';

export default function SetupCheck() {
  const [firebaseStatus, setFirebaseStatus] = useState<{
    auth: boolean;
    firestore: boolean;
    config: boolean;
  }>({
    auth: false,
    firestore: false,
    config: false,
  });

  useEffect(() => {
    checkFirebaseSetup();
  }, []);

  const checkFirebaseSetup = async () => {
    try {
      // Check if Firebase config exists
      const hasConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      
      setFirebaseStatus({
        auth: false, // Will be true once Auth is enabled
        firestore: false, // Will be true once Firestore is created
        config: hasConfig,
      });
    } catch (error) {
      console.error('Setup check error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-bg-warm dark:bg-bg-warm-dark p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-8">
          Firebase Setup Status
        </h1>

        <div className="bg-surface-warm dark:bg-surface-warm-dark rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="space-y-3">
            <StatusRow
              label="Firebase Config"
              status={firebaseStatus.config}
              okText="Environment variables configured"
              errorText="Missing Firebase config in .env.local"
            />
            <StatusRow
              label="Firebase Authentication"
              status={firebaseStatus.auth}
              okText="Authentication enabled"
              errorText="⚠️ Please enable in Firebase Console"
              action={{
                text: "Enable Auth",
                url: `https://console.firebase.google.com/project/training-21219029-6377a/authentication`
              }}
            />
            <StatusRow
              label="Firestore Database"
              status={firebaseStatus.firestore}
              okText="Database created"
              errorText="⚠️ Please create in Firebase Console"
              action={{
                text: "Create Database",
                url: `https://console.firebase.google.com/project/training-21219029-6377a/firestore`
              }}
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Click "Enable Auth" above to activate Email/Password authentication</li>
            <li>Click "Create Database" to set up Firestore (choose eur3 region)</li>
            <li>Run <code className="bg-blue-100 px-2 py-1 rounded">firebase deploy --only firestore:rules</code> in terminal</li>
            <li>Test login at <a href="/login" className="underline">/login</a></li>
          </ol>
        </div>

        <div className="mt-6 flex gap-4">
          <a
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            ← Back to Home
          </a>
          <a
            href="/login"
            className="px-4 py-2 bg-primary dark:bg-primary-dark text-white rounded hover:bg-blue-700"
          >
            Try Login →
          </a>
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  status,
  okText,
  errorText,
  action,
}: {
  label: string;
  status: boolean;
  okText: string;
  errorText: string;
  action?: { text: string; url: string };
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-bg-warm dark:bg-bg-warm-dark rounded">
      <div className="flex items-center gap-3">
        <span className={`text-2xl ${status ? '✅' : '⚠️'}`}>
          {status ? '✅' : '⚠️'}
        </span>
        <div>
          <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{label}</p>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {status ? okText : errorText}
          </p>
        </div>
      </div>
      {!status && action && (
        <a
          href={action.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-primary dark:bg-primary-dark text-white text-sm rounded hover:bg-blue-700"
        >
          {action.text}
        </a>
      )}
    </div>
  );
}

