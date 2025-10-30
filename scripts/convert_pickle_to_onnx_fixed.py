#!/usr/bin/env python3
"""
Convert Pickled XGBoost model to ONNX (with fix for base_score bug)
"""

import pickle
import json
import sys
import xgboost as xgb
import onnxmltools
from onnxmltools.convert.common.data_types import FloatTensorType
import onnxruntime as rt
import numpy as np

print("🤖 Pickle XGBoost to ONNX Converter (Fixed)")
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

# Fix base_score issue - get the booster and fix config
print(f"🔧 Fixing base_score parameter...")
booster = model.get_booster()

# Save to temp file and reload to fix format
temp_file = 'temp_model.json'
booster.save_model(temp_file)

# Reload and fix config
with open(temp_file, 'r') as f:
    config = json.load(f)

# Fix base_score if it's a string/array
try:
    base_score = config["learner"]["learner_model_param"]["base_score"]
    if isinstance(base_score, str):
        # Parse array notation like '[2.8639478E2]'
        base_score = base_score.strip('[]')
        base_score = float(base_score)
        config["learner"]["learner_model_param"]["base_score"] = str(base_score)
        print(f"   Fixed base_score: {base_score}")
except Exception as e:
    print(f"   Could not fix base_score: {e}")

# Save fixed config
with open(temp_file, 'w') as f:
    json.dump(config, f)

# Create new booster with fixed config
fixed_booster = xgb.Booster()
fixed_booster.load_model(temp_file)

print(f"✅ Model fixed")

# Convert to ONNX
print(f"\n🔄 Converting to ONNX...")
initial_type = [('float_input', FloatTensorType([None, num_features]))]

try:
    onnx_model = onnxmltools.convert_xgboost(
        fixed_booster,
        initial_types=initial_type,
        target_opset=12
    )
    
    output_path = 'tss-predictor-v1.onnx'
    onnxmltools.utils.save_model(onnx_model, output_path)
    
    print(f"✅ ONNX model saved: {output_path}")
    
    # Get file size
    import os
    file_size = os.path.getsize(output_path) / (1024 * 1024)
    print(f"📦 Model size: {file_size:.2f} MB")
    
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
    print(f"   Test prediction: {result[0][0]:.2f} TSS")
    
    # Cleanup
    import os
    os.remove(temp_file)
    
    print("\n" + "=" * 50)
    print("✅ Conversion completed successfully!")
    print(f"\n📤 Next steps:")
    print(f"   1. Upload to Firebase Storage (ml-models/ folder):")
    print(f"      - {output_path}")
    print(f"      - tss-predictor-v1.json")
    print(f"   2. Deploy storage rules: firebase deploy --only storage")
    print(f"   3. Your app will automatically use the ML model!")
    
except Exception as e:
    print(f"❌ Conversion failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
