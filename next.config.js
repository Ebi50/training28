/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['firebase-admin', '@google-cloud/firestore', '@google-cloud/secret-manager']
}

module.exports = nextConfig