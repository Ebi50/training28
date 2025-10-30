#!/usr/bin/env python3
"""
Convert Pickled XGBoost model to ONNX
"""

import pickle
import json
import sys
import xgboost as xgb
import onnxmltools
from onnxmltools.convert.common.data_types import FloatTensorType
import onnxruntime as rt
import numpy as np

print("🤖 Pickle XGBoost to ONNX Converter")
print("=" * 50)

# Load pickled model
print("📂 Loading pickled model...")
with open('model_tss_predictor.bst', 'rb') as f:
    model = pickle.load(f)

print(f"✅ Model loaded: {type(model)}")

# Load features
with open('model_features.json', 'r') as f:
    features_data = json.load(f)
    feature_names = features_data['features']

num_features = len(feature_names)
print(f"📊 Features: {num_features}")
print(f"   Names: {feature_names}")

# Convert to ONNX
print(f"\n🔄 Converting to ONNX...")
initial_type = [('input', FloatTensorType([None, num_features]))]

try:
    onnx_model = onnxmltools.convert_xgboost(
        model,
        initial_types=initial_type,
        target_opset=12
    )
    
    output_path = 'tss-predictor-v1.onnx'
    onnxmltools.utils.save_model(onnx_model, output_path)
    
    print(f"✅ ONNX model saved: {output_path}")
    
    # Save metadata
    metadata = {
        "model_version": "v1.0",
        "format": "onnx",
        "framework": "xgboost",
        "num_features": num_features,
        "feature_names": feature_names,
        "description": "TSS Prediction Model - Converted from Pickled XGBoost",
        "input_shape": [None, num_features],
        "output_shape": [None, 1]
    }
    
    with open('tss-predictor-v1.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"📋 Metadata saved: tss-predictor-v1.json")
    
    # Validate
    print(f"\n🧪 Validating...")
    session = rt.InferenceSession(output_path)
    
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name
    
    print(f"   Input: {input_name} {session.get_inputs()[0].shape}")
    print(f"   Output: {output_name} {session.get_outputs()[0].shape}")
    
    # Test prediction
    dummy_input = np.random.randn(1, num_features).astype(np.float32)
    result = session.run([output_name], {input_name: dummy_input})
    
    print(f"✅ Validation successful!")
    print(f"   Test prediction: {result[0][0]}")
    
    print("\n" + "=" * 50)
    print("✅ Conversion completed successfully!")
    print(f"\n📤 Upload these files to Firebase Storage (ml-models/):")
    print(f"   - {output_path}")
    print(f"   - tss-predictor-v1.json")
    
except Exception as e:
    print(f"❌ Conversion failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
