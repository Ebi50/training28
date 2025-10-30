#!/usr/bin/env python3
"""
Convert Pickled XGBoost model to ONNX using Hummingbird.

Hummingbird uses PyTorch as intermediate format which bypasses 
the base_score parsing bug in onnxmltools.
"""

import argparse
import json
import pickle
import sys
from pathlib import Path

import numpy as np
from hummingbird.ml import convert


def load_model(model_path: str):
    """Load pickled XGBoost model."""
    print(f"Loading model from {model_path}...")
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    print(f"Model type: {type(model).__name__}")
    print(f"Model loaded successfully")
    return model


def load_features(features_path: str):
    """Load feature names from JSON file."""
    print(f"\nLoading features from {features_path}...")
    with open(features_path, 'r') as f:
        data = json.load(f)
    
    features = data.get('features', [])
    print(f"Features loaded: {len(features)}")
    print(f"Feature names: {features}")
    return features


def convert_to_onnx(model, features: list, output_path: str):
    """Convert XGBoost model to ONNX using Hummingbird."""
    print(f"\nConverting to ONNX with Hummingbird...")
    
    # Create dummy test input (required by Hummingbird for ONNX)
    n_features = len(features)
    test_input = np.random.randn(1, n_features).astype(np.float32)
    print(f"Created test input: shape {test_input.shape}, dtype {test_input.dtype}")
    
    try:
        # Convert using Hummingbird (via PyTorch backend)
        # This bypasses the base_score bug completely
        onnx_model = convert(
            model, 
            backend='onnx',
            test_input=test_input,
            extra_config={
                'onnx_target_opset': 15,  # Use ONNX opset 15
            }
        )
        
        # Save the ONNX model
        onnx_model.save(output_path)
        print(f"✅ ONNX model saved to {output_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def create_metadata(features: list, output_path: str):
    """Create metadata JSON file for the model."""
    metadata = {
        "version": "v1",
        "modelType": "xgboost-regressor",
        "task": "tss-prediction",
        "features": features,
        "inputShape": [None, len(features)],
        "outputShape": [None, 1],
        "normalization": "none",
        "framework": "xgboost",
        "conversionTool": "hummingbird-ml",
        "description": "TSS predictor converted from XGBoost to ONNX using Hummingbird"
    }
    
    metadata_path = output_path.replace('.onnx', '.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✅ Metadata saved to {metadata_path}")
    return metadata_path


def main():
    parser = argparse.ArgumentParser(
        description='Convert Pickled XGBoost model to ONNX using Hummingbird'
    )
    parser.add_argument(
        '--input',
        default='model_tss_predictor.bst',
        help='Path to pickled XGBoost model'
    )
    parser.add_argument(
        '--features',
        default='model_features.json',
        help='Path to features JSON file'
    )
    parser.add_argument(
        '--output',
        default='tss-predictor-v1.onnx',
        help='Output path for ONNX model'
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("XGBoost to ONNX Converter (Hummingbird)")
    print("=" * 60)
    
    # Verify files exist
    if not Path(args.input).exists():
        print(f"❌ Model file not found: {args.input}")
        return 1
    
    if not Path(args.features).exists():
        print(f"❌ Features file not found: {args.features}")
        return 1
    
    # Load model and features
    model = load_model(args.input)
    features = load_features(args.features)
    
    # Validate feature count
    n_features = len(features)
    print(f"\nModel expects {n_features} features")
    
    # Convert to ONNX
    success = convert_to_onnx(model, features, args.output)
    
    if not success:
        return 1
    
    # Create metadata
    metadata_path = create_metadata(features, args.output)
    
    print("\n" + "=" * 60)
    print("✅ Conversion completed successfully!")
    print("=" * 60)
    print(f"ONNX model: {args.output}")
    print(f"Metadata:   {metadata_path}")
    print("\nNext steps:")
    print("1. Upload both files to Firebase Storage (ml-models/ folder)")
    print("2. Deploy storage rules: firebase deploy --only storage")
    print("3. Test predictions in the app")
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
