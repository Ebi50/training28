/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'firebase-admin', 
    '@google-cloud/firestore', 
    '@google-cloud/secret-manager',
    'onnxruntime-node'
  ],
  webpack: (config, { isServer }) => {
    // Ignore .node files completely
    config.module.rules.push({
      test: /\.node$/,
      loader: 'ignore-loader',
    });
    
    // Also externalize packages that might have native bindings
    if (isServer) {
      config.externals = [...(config.externals || []), '@swc/core', 'onnxruntime-node'];
    }
    
    return config;
  },
}

module.exports = nextConfig