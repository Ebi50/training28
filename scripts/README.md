# XGBoost to ONNX Conversion

## Requirements
pip install xgboost onnxmltools onnxruntime skl2onnx

## Usage

### Basic Conversion
```bash
python convert_xgb_to_onnx.py --input model.bst --output model.onnx
```

### Skip Validation (faster)
```bash
python convert_xgb_to_onnx.py -i model.bst -o tss-predictor-v1.onnx --no-validate
```

## Output Files
- `model.onnx` - Converted model (ready for TypeScript)
- `model.json` - Metadata (feature names, version, etc.)

## Next Steps
1. Upload both files to Firebase Storage (`ml-models/` folder)
2. Model will be loaded automatically by the TypeScript app
