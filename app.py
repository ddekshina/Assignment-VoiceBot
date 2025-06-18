from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from bland_ai_handler import BlandAIHandler
from flask import render_template

app = Flask(__name__)
CORS(app)

conversation_states = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/api/start', methods=['POST'])
def start():
    session_id = f"session_{len(conversation_states)+1}"
    conversation_states[session_id] = {}
    return jsonify({
        "session_id": session_id,
        "message": "New session started"
    })

@app.route('/api/process', methods=['POST'])
def process():
    data = request.json
    text = data.get('text')
    session_id = data.get('session_id')
    
    if not text or not session_id:
        return jsonify({"error": "Missing text or session_id"}), 400
    
    state = conversation_states.get(session_id, {})
    response = BlandAIHandler.process_voice_input(text, state)
    conversation_states[session_id] = response.get('state', {})
    
    return jsonify({
        "response": response['response'],
        "order": response.get('order')
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)