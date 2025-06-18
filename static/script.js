let sessionId = null;
let recognition = null;
let synth = window.speechSynthesis;
let audioContext = null;
let analyser = null;
let microphone = null;
let speechTimeout = null;

// Debugging function
const debugLog = (message) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] ${message}`);
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const voiceBtn = document.getElementById('voiceBtn');
    const conversation = document.getElementById('conversation');
    const status = document.getElementById('status');
    const audioLevel = document.getElementById('audioLevel');

    // Check for speech recognition support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        status.textContent = 'Voice recognition not supported in this browser';
        voiceBtn.disabled = true;
        return;
    }

    // Initialize speech recognition
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3;

        // Recognition event handlers
        recognition.onstart = () => {
            debugLog('Recognition started');
            status.textContent = 'Listening... Speak now';
            voiceBtn.classList.add('active');
            voiceBtn.innerHTML = '<span id="voiceIcon">🔴</span> Listening';
            startAudioVisualization();
        };

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            debugLog(`Interim transcript: ${transcript}`);
            
            // Only process final results
            if (event.results[event.results.length - 1].isFinal) {
                debugLog(`Final transcript: ${transcript}`);
                addMessage(transcript, 'user');
                processUserInput(transcript);
            }
        };

        recognition.onerror = (event) => {
            debugLog(`Recognition error: ${event.error}`);
            status.textContent = `Error: ${event.error}`;
            stopListening();
            
            if (event.error === 'not-allowed') {
                status.textContent = 'Microphone access denied. Please allow permissions.';
            }
        };

        recognition.onend = () => {
            debugLog('Recognition ended');
            stopListening();
        };

    } catch (e) {
        debugLog(`Initialization error: ${e}`);
        status.textContent = 'Failed to initialize voice recognition';
        voiceBtn.disabled = true;
    }

    // Start session button
    startBtn.addEventListener('click', async () => {
        debugLog('Start session clicked');
        startBtn.disabled = true;
        status.textContent = 'Starting session...';
        
        try {
            const response = await fetch('/api/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            sessionId = data.session_id;
            voiceBtn.disabled = false;
            debugLog(`Session started: ${sessionId}`);
            
            // Speak welcome message
            speak("Welcome to OTC Trading Bot! Please say an exchange name: OKX, Bybit, Deribit, or Binance.");
            addMessage("Welcome to OTC Trading Bot! Please say an exchange name: OKX, Bybit, Deribit, or Binance.", 'bot');
            
        } catch (error) {
            debugLog(`Session start failed: ${error}`);
            status.textContent = 'Failed to start session';
            startBtn.disabled = false;
        }
    });

    // Voice button handler
    voiceBtn.addEventListener('click', async () => {
        if (!sessionId) {
            status.textContent = 'Please start a session first';
            return;
        }
        
        if (voiceBtn.classList.contains('active')) {
            debugLog('Stopping recognition by user request');
            stopListening();
            return;
        }
        
        debugLog('Starting voice recognition');
        status.textContent = 'Requesting microphone access...';
        
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Start recognition
            recognition.start();
            
            // Set timeout for no speech detection
            speechTimeout = setTimeout(() => {
                debugLog('No speech detected within 5 seconds');
                status.textContent = 'No speech detected. Try again.';
                stopListening();
            }, 5000);
            
        } catch (error) {
            debugLog(`Microphone access error: ${error}`);
            status.textContent = 'Microphone error: ' + error.message;
            stopListening();
        }
    });

    // Helper functions
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = text;
        conversation.appendChild(messageDiv);
        conversation.scrollTop = conversation.scrollHeight;
    }

    function speak(text) {
        if (synth.speaking) {
            synth.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => debugLog('Speech synthesis completed');
        utterance.onerror = (event) => debugLog(`Speech error: ${event.error}`);
        
        synth.speak(utterance);
    }

    async function processUserInput(text) {
        if (!sessionId) return;
        status.textContent = 'Processing...';
        clearTimeout(speechTimeout);

        try {
            const response = await fetch('/api/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    text: text
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            addMessage(data.response, 'bot');
            speak(data.response);
            
        } catch (error) {
            debugLog(`API error: ${error}`);
            status.textContent = 'Error processing request';
        } finally {
            status.textContent = 'Ready';
        }
    }

    function startAudioVisualization() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 32;
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);
                visualizeAudio();
            })
            .catch(error => {
                debugLog(`Audio visualization error: ${error}`);
            });
    }

    function visualizeAudio() {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        const average = array.reduce((a, b) => a + b) / array.length;
        
        // Update visualizer
        audioLevel.style.width = `${Math.min(100, average)}%`;
        
        // Continue animation if still listening
        if (recognition && recognition.continuous) {
            requestAnimationFrame(visualizeAudio);
        }
    }

    function stopListening() {
        clearTimeout(speechTimeout);
        
        if (recognition) {
            recognition.stop();
        }
        
        if (microphone) {
            microphone.disconnect();
        }
        
        voiceBtn.classList.remove('active');
        voiceBtn.innerHTML = '<span id="voiceIcon">🎤</span> Push to Talk';
        audioLevel.style.width = '0%';
        
        if (status.textContent === 'Listening... Speak now') {
            status.textContent = 'Ready';
        }
    }
});