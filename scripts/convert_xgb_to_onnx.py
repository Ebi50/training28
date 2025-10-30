#!/usr/bin/env python3
"""
XGBoost to ONNX Converter
Converts .bst model files to ONNX format for use in TypeScript/Node.js

Usage:
    python convert_xgb_to_onnx.py --input model.bst --output model.onnx

Requirements:
    pip install xgboost onnxmltools onnxruntime skl2onnx
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    import xgboost as xgb
    import onnxmltools
    from onnxmltools.convert.common.data_types import FloatTensorType
    import onnxruntime as rt
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("\n📦 Install required packages:")
    print("   pip install xgboost onnxmltools onnxruntime skl2onnx")
    sys.exit(1)


def load_xgboost_model(input_path: str) -> xgb.Booster:
    """Load XGBoost model from .bst file"""
    print(f"📂 Loading XGBoost model from: {input_path}")
    
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Model file not found: {input_path}")
    
    # Try to load as binary format
    try:
        booster = xgb.Booster()
        booster.load_model(input_path)
        print(f"✅ Model loaded successfully (binary format)")
        return booster
    except Exception as e:
        print(f"⚠️  Binary load failed: {e}")
        print(f"🔄 Trying JSON format...")
        
        # Try JSON format
        try:
            booster = xgb.Booster(model_file=input_path)
            print(f"✅ Model loaded successfully (JSON format)")
            return booster
        except Exception as e2:
            raise Exception(f"Failed to load model in both binary and JSON format: {e}, {e2}")


def extract_feature_info(booster: xgb.Booster) -> dict:
    """Extract feature information from model"""
    try:
        # Try to get feature names
        feature_names = booster.feature_names
        num_features = len(feature_names) if feature_names else booster.num_features()
        
        print(f"📊 Model info:")
        print(f"   - Features: {num_features}")
        if feature_names:
            print(f"   - Feature names: {feature_names[:5]}..." if len(feature_names) > 5 else f"   - Feature names: {feature_names}")
        
        return {
            "num_features": num_features,
            "feature_names": feature_names if feature_names else [f"f{i}" for i in range(num_features)]
        }
    except Exception as e:
        print(f"⚠️  Could not extract feature info: {e}")
        return {"num_features": None, "feature_names": None}


def convert_to_onnx(booster: xgb.Booster, output_path: str, num_features: int):
    """Convert XGBoost model to ONNX format"""
    print(f"\n🔄 Converting to ONNX format...")
    
    # Define input type (batch_size, num_features)
    # Using None for batch_size means it can handle any batch size
    initial_type = [('input', FloatTensorType([None, num_features]))]
    
    try:
        # Convert to ONNX
        onnx_model = onnxmltools.convert_xgboost(
            booster, 
            initial_types=initial_type,
            target_opset=12  # Use opset 12 for broad compatibility
        )
        
        # Save ONNX model
        onnxmltools.utils.save_model(onnx_model, output_path)
        
        print(f"✅ ONNX model saved to: {output_path}")
        
        # Get file size
        file_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
        print(f"📦 Model size: {file_size:.2f} MB")
        
        return onnx_model
        
    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        raise


def validate_onnx_model(onnx_path: str, num_features: int):
    """Validate ONNX model can be loaded and run"""
    print(f"\n🧪 Validating ONNX model...")
    
    try:
        import numpy as np
        
        # Load ONNX model
        session = rt.InferenceSession(onnx_path)
        
        # Get input/output info
        input_name = session.get_inputs()[0].name
        output_name = session.get_outputs()[0].name
        
        print(f"   - Input: {input_name} {session.get_inputs()[0].shape}")
        print(f"   - Output: {output_name} {session.get_outputs()[0].shape}")
        
        # Test with dummy data
        dummy_input = np.random.randn(1, num_features).astype(np.float32)
        result = session.run([output_name], {input_name: dummy_input})
        
        print(f"✅ Validation successful!")
        print(f"   - Test prediction shape: {result[0].shape}")
        print(f"   - Sample output: {result[0][0]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        return False


def save_metadata(output_path: str, feature_info: dict):
    """Save model metadata as JSON"""
    metadata_path = output_path.replace('.onnx', '.json')
    
    metadata = {
        "model_version": "v1.0",
        "format": "onnx",
        "framework": "xgboost",
        "num_features": feature_info["num_features"],
        "feature_names": feature_info["feature_names"],
        "description": "TSS Prediction Model - Converted from XGBoost",
        "input_shape": [None, feature_info["num_features"]],
        "output_shape": [None, 1]
    }
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"📋 Metadata saved to: {metadata_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Convert XGBoost .bst model to ONNX format",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python convert_xgb_to_onnx.py --input model.bst --output model.onnx
  python convert_xgb_to_onnx.py -i model.bst -o tss-predictor-v1.onnx
        """
    )
    
    parser.add_argument(
        '-i', '--input',
        required=True,
        help='Input XGBoost model file (.bst)'
    )
    
    parser.add_argument(
        '-o', '--output',
        required=True,
        help='Output ONNX model file (.onnx)'
    )
    
    parser.add_argument(
        '--no-validate',
        action='store_true',
        help='Skip validation step'
    )
    
    args = parser.parse_args()
    
    print("🤖 XGBoost to ONNX Converter")
    print("=" * 50)
    
    try:
        # Load model
        booster = load_xgboost_model(args.input)
        
        # Extract feature info
        feature_info = extract_feature_info(booster)
        
        if feature_info["num_features"] is None:
            print("❌ Could not determine number of features")
            print("💡 Try adding feature names to your model or specify manually")
            sys.exit(1)
        
        # Convert to ONNX
        convert_to_onnx(booster, args.output, feature_info["num_features"])
        
        # Save metadata
        save_metadata(args.output, feature_info)
        
        # Validate
        if not args.no_validate:
            validate_onnx_model(args.output, feature_info["num_features"])
        
        print("\n" + "=" * 50)
        print("✅ Conversion completed successfully!")
        print(f"\n📤 Next steps:")
        print(f"   1. Upload {args.output} to Firebase Storage")
        print(f"   2. Upload {args.output.replace('.onnx', '.json')} (metadata)")
        print(f"   3. Update your TypeScript code to use the new model")
        
    except Exception as e:
        print(f"\n❌ Conversion failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
