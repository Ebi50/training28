/**
 * ML Predictor Service
 * Loads ONNX model from Firebase Storage and provides TSS predictions
 */

import * as ort from 'onnxruntime-node';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { DailyMetrics, UserProfile, ModelFeatures, TssPrediction } from '@/types';

// Model configuration
const MODEL_CONFIG = {
  path: 'ml-models/tss-predictor-v1.onnx',
  metadataPath: 'ml-models/tss-predictor-v1.json',
  version: 'v1.0',
  cacheDuration: 3600000, // 1 hour in ms
};

// Global model cache
let cachedSession: ort.InferenceSession | null = null;
let modelMetadata: any | null = null;
let lastLoadTime: number = 0;

/**
 * Load model metadata from Firebase Storage
 */
async function loadModelMetadata(): Promise<any> {
  try {
    const metadataRef = ref(storage, MODEL_CONFIG.metadataPath);
    const url = await getDownloadURL(metadataRef);
    
    const response = await fetch(url);
    const metadata = await response.json();
    
    console.log('✅ Model metadata loaded:', metadata);
    return metadata;
  } catch (error) {
    console.warn('⚠️  Could not load model metadata:', error);
    return null;
  }
}

/**
 * Load ONNX model from Firebase Storage
 */
async function loadModel(): Promise<ort.InferenceSession> {
  const now = Date.now();
  
  // Return cached model if still valid
  if (cachedSession && (now - lastLoadTime) < MODEL_CONFIG.cacheDuration) {
    console.log('📦 Using cached model');
    return cachedSession;
  }
  
  console.log('🔄 Loading ONNX model from Firebase Storage...');
  
  try {
    // Get download URL
    const modelRef = ref(storage, MODEL_CONFIG.path);
    const url = await getDownloadURL(modelRef);
    
    // Fetch model file
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    
    // Create ONNX session
    const session = await ort.InferenceSession.create(arrayBuffer, {
      executionProviders: ['cpu'], // Use CPU for Node.js
      graphOptimizationLevel: 'all',
    });
    
    // Cache the session
    cachedSession = session;
    lastLoadTime = now;
    
    // Load metadata
    modelMetadata = await loadModelMetadata();
    
    console.log('✅ Model loaded successfully');
    console.log('   Input:', session.inputNames);
    console.log('   Output:', session.outputNames);
    
    return session;
  } catch (error) {
    console.error('❌ Failed to load model:', error);
    throw new Error(`Model loading failed: ${error}`);
  }
}

/**
 * Extract features from user data for ML prediction
 * Features match model_features.json: 15 features exactly
 */
function extractFeatures(
  profile: UserProfile,
  metrics: DailyMetrics[],
  targetDate: Date
): ModelFeatures {
  // Sort metrics by date (newest first)
  const sortedMetrics = [...metrics].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Get latest metrics
  const latest = sortedMetrics[0] || { ctl: 0, atl: 0, tsb: 0, tss: 0 };
  
  // Calculate rolling sums
  const tss_3d = sortedMetrics.slice(0, 3).reduce((sum, m) => sum + (m.tss || 0), 0);
  const tss_7d = sortedMetrics.slice(0, 7).reduce((sum, m) => sum + (m.tss || 0), 0);
  const tss_14d = sortedMetrics.slice(0, 14).reduce((sum, m) => sum + (m.tss || 0), 0);
  const tss_28d = sortedMetrics.slice(0, 28).reduce((sum, m) => sum + (m.tss || 0), 0);
  
  // Calculate standard deviation of last 7 days
  const tss_values_7d = sortedMetrics.slice(0, 7).map(m => m.tss || 0);
  const tss_mean_7d = tss_7d / Math.min(7, tss_values_7d.length);
  const tss_std7 = Math.sqrt(
    tss_values_7d.reduce((sum, val) => sum + Math.pow(val - tss_mean_7d, 2), 0) / 
    Math.max(1, tss_values_7d.length)
  );
  
  // Count zero TSS days in last 7 days
  const tss_zero7 = tss_values_7d.filter(val => val === 0).length;
  
  // Calculate ramp rate (7d vs 42d average)
  const tss_42d = sortedMetrics.slice(0, 42).reduce((sum, m) => sum + (m.tss || 0), 0);
  const avg_7d = tss_7d / 7;
  const avg_42d = tss_42d / 42;
  const ramp_7v42 = avg_42d > 0 ? (avg_7d - avg_42d) / avg_42d : 0;
  
  // Cyclical time features (day of week, month)
  const dow = targetDate.getDay(); // 0-6
  const month = targetDate.getMonth() + 1; // 1-12 (not 0-11)
  const dow_sin = Math.sin(2 * Math.PI * dow / 7);
  const dow_cos = Math.cos(2 * Math.PI * dow / 7);
  const mon_sin = Math.sin(2 * Math.PI * month / 12);
  const mon_cos = Math.cos(2 * Math.PI * month / 12);
  
  // EXACT 15 features matching model_features.json
  const features: ModelFeatures = {
    TSS_lag1: sortedMetrics[0]?.tss || 0,
    TSS_3d: tss_3d,
    TSS_7d: tss_7d,
    TSS_14d: tss_14d,
    TSS_28d: tss_28d,
    TSS_std7: tss_std7,
    TSS_zero7: tss_zero7,
    CTL_42: latest.ctl || 0,
    ATL_7: latest.atl || 0,
    TSB: latest.tsb || 0,
    ramp_7v42: ramp_7v42,
    dow_sin: dow_sin,
    dow_cos: dow_cos,
    mon_sin: mon_sin,
    mon_cos: mon_cos,
  };
  
  return features;
}

/**
 * Convert features object to ordered array based on model metadata
 * Order MUST match model_features.json exactly
 */
function featuresToArray(features: ModelFeatures, featureNames?: string[]): number[] {
  // Feature order from model_features.json
  const defaultOrder = [
    'TSS_lag1', 'TSS_3d', 'TSS_7d', 'TSS_14d', 'TSS_28d',
    'TSS_std7', 'TSS_zero7', 'CTL_42', 'ATL_7', 'TSB',
    'ramp_7v42', 'dow_sin', 'dow_cos', 'mon_sin', 'mon_cos'
  ];
  
  const orderedNames = featureNames && featureNames.length > 0 ? featureNames : defaultOrder;
  
  return orderedNames.map(name => features[name as keyof ModelFeatures] || 0);
}

/**
 * Predict TSS for a given day
 */
export async function predictTSS(
  profile: UserProfile,
  metrics: DailyMetrics[],
  targetDate: Date
): Promise<TssPrediction> {
  try {
    // Load model
    const session = await loadModel();
    
    // Extract features
    const features = extractFeatures(profile, metrics, targetDate);
    
    // Convert to array
    const featureArray = featuresToArray(
      features,
      modelMetadata?.feature_names
    );
    
    // Prepare input tensor
    const inputTensor = new ort.Tensor(
      'float32',
      Float32Array.from(featureArray),
      [1, featureArray.length]
    );
    
    // Run inference
    const feeds: Record<string, ort.Tensor> = {};
    feeds[session.inputNames[0]] = inputTensor;
    
    const results = await session.run(feeds);
    const output = results[session.outputNames[0]];
    
    // Extract prediction
    const predictedTss = (output.data as Float32Array)[0];
    
    // Calculate confidence (simplified - could be enhanced)
    const confidence = Math.min(0.95, 0.7 + (metrics.length / 100) * 0.25);
    
    const prediction: TssPrediction = {
      date: targetDate.toISOString().split('T')[0],
      predictedTss: Math.max(0, predictedTss), // Ensure non-negative
      confidence,
      features,
      modelVersion: MODEL_CONFIG.version,
    };
    
    console.log('🎯 TSS Prediction:', {
      date: prediction.date,
      tss: prediction.predictedTss.toFixed(1),
      confidence: (prediction.confidence * 100).toFixed(0) + '%',
    });
    
    return prediction;
    
  } catch (error) {
    console.error('❌ Prediction failed:', error);
    throw new Error(`TSS prediction failed: ${error}`);
  }
}

/**
 * Predict TSS for multiple days
 */
export async function predictTSSBatch(
  profile: UserProfile,
  metrics: DailyMetrics[],
  dates: Date[]
): Promise<TssPrediction[]> {
  const predictions: TssPrediction[] = [];
  
  for (const date of dates) {
    try {
      const prediction = await predictTSS(profile, metrics, date);
      predictions.push(prediction);
    } catch (error) {
      console.error(`Failed to predict for ${date}:`, error);
      // Continue with other dates
    }
  }
  
  return predictions;
}

/**
 * Check if ML model is available
 */
export async function isModelAvailable(): Promise<boolean> {
  try {
    const modelRef = ref(storage, MODEL_CONFIG.path);
    await getDownloadURL(modelRef);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear model cache (useful for testing or model updates)
 */
export function clearModelCache(): void {
  cachedSession = null;
  modelMetadata = null;
  lastLoadTime = 0;
  console.log('🗑️  Model cache cleared');
}
