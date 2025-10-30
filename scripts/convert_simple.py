#!/usr/bin/env python3
"""
Simple XGBoost to ONNX converter using onnxmltools.
Works with XGBoost 1.7.6 (no base_score bug).
"""

import argparse
import json
import pickle
import sys
from pathlib import Path

import numpy as np
import onnxmltools
from onnxmltools.convert.common.data_types import FloatTensorType


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', default='model_tss_predictor.bst')
    parser.add_argument('--features', default='model_features.json')
    parser.add_argument('--output', default='tss-predictor-v1.onnx')
    args = parser.parse_args()
    
    print("=" * 60)
    print("XGBoost to ONNX Converter (Simple)")
    print("=" * 60)
    
    # Load model
    print(f"\nLoading model from {args.input}...")
    with open(args.input, 'rb') as f:
        model = pickle.load(f)
    print(f"Model type: {type(model).__name__}")
    
    # Load features
    print(f"\nLoading features from {args.features}...")
    with open(args.features, 'r') as f:
        features = json.load(f)['features']
    print(f"Features: {len(features)}")
    
    # Convert
    print(f"\nConverting to ONNX...")
    n_features = len(features)
    initial_types = [('float_input', FloatTensorType([None, n_features]))]
    
    try:
        onnx_model = onnxmltools.convert_xgboost(
            model, 
            initial_types=initial_types,
            target_opset=15
        )
        
        onnxmltools.utils.save_model(onnx_model, args.output)
        print(f"✅ ONNX model saved to {args.output}")
        
        # Save metadata
        metadata = {
            "version": "v1",
            "modelType": "xgboost-regressor",
            "task": "tss-prediction",
            "features": features,
            "inputShape": [None, n_features],
            "outputShape": [None, 1]
        }
        metadata_path = args.output.replace('.onnx', '.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"✅ Metadata saved to {metadata_path}")
        
        print("\n" + "=" * 60)
        print("✅ Conversion completed!")
        print("=" * 60)
        
        return 0
        
    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
