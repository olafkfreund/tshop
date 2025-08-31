#!/usr/bin/env python3
"""
TShop Mock Services Server
Provides mock API endpoints for local development without external dependencies
"""

import json
import random
import time
import io
import base64
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont

app = Flask(__name__)
CORS(app)

# Mock design templates
DESIGN_TEMPLATES = [
    {"category": "text", "style": "bold", "colors": ["#000000", "#FFFFFF", "#FF0000"]},
    {"category": "graphic", "style": "geometric", "colors": ["#0066CC", "#00CC66", "#CC6600"]},
    {"category": "logo", "style": "modern", "colors": ["#333333", "#666666", "#999999"]},
    {"category": "pattern", "style": "abstract", "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1"]},
]

def generate_mock_design_image(prompt, product_type="tshirt", width=400, height=400):
    """Generate a simple mock design image using PIL"""
    try:
        # Create a new image with white background
        img = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(img)
        
        # Try to use a basic font, fallback to default if not available
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
        except:
            font = ImageFont.load_default()
        
        # Choose random colors based on prompt
        template = random.choice(DESIGN_TEMPLATES)
        bg_color = random.choice(template["colors"])
        text_color = "#FFFFFF" if bg_color == "#000000" else "#000000"
        
        # Create design based on product type
        if product_type == "cap":
            # Draw a curved design for caps
            draw.ellipse([50, 100, 350, 300], fill=bg_color)
            text_y = 180
        elif product_type == "tote_bag":
            # Draw a rectangular design for tote bags
            draw.rectangle([50, 50, 350, 350], fill=bg_color)
            text_y = 180
        else:  # t-shirt default
            # Draw a circular design for t-shirts
            draw.ellipse([100, 100, 300, 300], fill=bg_color)
            text_y = 180
        
        # Add prompt text
        prompt_short = prompt[:20] + "..." if len(prompt) > 20 else prompt
        
        # Calculate text position to center it
        bbox = draw.textbbox((0, 0), prompt_short, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (width - text_width) // 2
        
        draw.text((text_x, text_y), prompt_short, fill=text_color, font=font)
        
        # Add product type indicator
        draw.text((10, 10), f"Mock {product_type.replace('_', ' ').title()}", 
                 fill="#666666", font=font)
        
        # Save to bytes
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        return img_buffer
    except Exception as e:
        print(f"Error generating image: {e}")
        # Return a simple colored rectangle as fallback
        img = Image.new('RGB', (width, height), color='#CCCCCC')
        draw = ImageDraw.Draw(img)
        draw.text((50, height//2), "Mock Design", fill="#000000")
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        return img_buffer

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': ['ai_generation', 'image_processing', 'fulfillment']
    })

@app.route('/ai/generate-design', methods=['POST'])
def generate_design():
    """Mock AI design generation endpoint"""
    data = request.json
    prompt = data.get('prompt', 'Default design')
    product_type = data.get('product_type', 'tshirt')
    
    # Simulate AI processing time
    processing_time = random.uniform(0.5, 2.0)
    time.sleep(processing_time)
    
    design_id = f'mock_design_{int(time.time())}'
    
    return jsonify({
        'success': True,
        'design_id': design_id,
        'design_url': f'/api/mock-design-image?prompt={prompt}&product_type={product_type}&id={design_id}',
        'prompt_used': prompt,
        'product_type': product_type,
        'processing_time': processing_time,
        'style_notes': f'Generated {random.choice(DESIGN_TEMPLATES)["style"]} style design',
        'recommendations': [
            f'Works well on {product_type}',
            'Consider trying different colors',
            'Great for casual wear'
        ]
    })

@app.route('/api/mock-design-image')
def mock_design_image():
    """Generate and serve mock design images"""
    prompt = request.args.get('prompt', 'Mock Design')
    product_type = request.args.get('product_type', 'tshirt')
    design_id = request.args.get('id', 'default')
    
    # Generate the image
    img_buffer = generate_mock_design_image(prompt, product_type)
    
    return send_file(
        img_buffer,
        mimetype='image/png',
        as_attachment=False,
        download_name=f'design_{design_id}.png'
    )

@app.route('/images/process', methods=['POST'])
def process_image():
    """Mock image processing endpoint"""
    data = request.json
    image_url = data.get('image_url', '')
    operations = data.get('operations', [])
    
    # Simulate processing time
    time.sleep(random.uniform(0.2, 1.0))
    
    return jsonify({
        'success': True,
        'processed_url': f'/api/processed-image?original={image_url}',
        'operations_applied': operations,
        'processing_time': random.uniform(0.2, 1.0)
    })

@app.route('/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    """Mock Stripe webhook endpoint"""
    data = request.json
    event_type = data.get('type', 'payment_intent.succeeded')
    
    print(f"📦 Mock Stripe webhook received: {event_type}")
    
    return jsonify({
        'success': True,
        'processed': True,
        'event_type': event_type
    })

@app.route('/fulfillment/printful/orders', methods=['POST'])
def create_printful_order():
    """Mock Printful order creation"""
    data = request.json
    
    mock_order = {
        'id': random.randint(1000000, 9999999),
        'external_id': data.get('external_id', f'tshop_{int(time.time())}'),
        'status': 'draft',
        'created': datetime.now().isoformat(),
        'items': data.get('items', [])
    }
    
    return jsonify({
        'code': 200,
        'result': mock_order
    })

@app.route('/fulfillment/printify/orders', methods=['POST'])
def create_printify_order():
    """Mock Printify order creation"""
    data = request.json
    
    mock_order = {
        'id': f'pf_{random.randint(1000000, 9999999)}',
        'status': 'pending',
        'created_at': datetime.now().isoformat(),
        'line_items': data.get('line_items', [])
    }
    
    return jsonify(mock_order)

@app.route('/fulfillment/<provider>/products')
def get_products(provider):
    """Mock product catalog for fulfillment providers"""
    mock_products = {
        'tshirts': [
            {'id': 1, 'name': 'Unisex T-Shirt', 'colors': ['white', 'black', 'navy']},
            {'id': 2, 'name': 'Premium T-Shirt', 'colors': ['white', 'black', 'gray']}
        ],
        'caps': [
            {'id': 10, 'name': 'Classic Cap', 'colors': ['black', 'navy', 'white']},
            {'id': 11, 'name': 'Snapback', 'colors': ['black', 'red', 'blue']}
        ],
        'tote_bags': [
            {'id': 20, 'name': 'Canvas Tote', 'colors': ['natural', 'black']},
            {'id': 21, 'name': 'Premium Tote', 'colors': ['white', 'navy', 'gray']}
        ]
    }
    
    return jsonify({
        'success': True,
        'provider': provider,
        'products': mock_products
    })

@app.route('/social/share', methods=['POST'])
def social_share():
    """Mock social sharing endpoint"""
    data = request.json
    platform = data.get('platform', 'instagram')
    design_id = data.get('design_id', '')
    
    return jsonify({
        'success': True,
        'platform': platform,
        'share_url': f'https://tshop.local/designs/{design_id}',
        'message': 'Design shared successfully!'
    })

@app.route('/analytics/track', methods=['POST'])
def track_analytics():
    """Mock analytics tracking"""
    data = request.json
    event = data.get('event', 'page_view')
    
    print(f"📊 Analytics: {event} - {data}")
    
    return jsonify({
        'success': True,
        'event': event,
        'tracked': True
    })

if __name__ == '__main__':
    print("🎭 TShop Mock Services Server Starting...")
    print("=" * 50)
    print("🎨 AI Design Generation: http://localhost:8080/ai/generate-design")
    print("🖼️  Image Processing: http://localhost:8080/images/process") 
    print("💳 Payment Webhooks: http://localhost:8080/webhooks/stripe")
    print("📦 Printful API: http://localhost:8080/fulfillment/printful/*")
    print("🏭 Printify API: http://localhost:8080/fulfillment/printify/*")
    print("💾 Health Check: http://localhost:8080/health")
    print("=" * 50)
    print()
    
    app.run(host='0.0.0.0', port=8080, debug=True, use_reloader=False)
