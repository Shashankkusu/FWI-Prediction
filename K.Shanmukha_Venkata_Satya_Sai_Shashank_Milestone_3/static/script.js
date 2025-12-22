document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const predictBtn = document.getElementById('predictBtn');
    const resetBtn = document.getElementById('resetBtn');
    const sampleBtns = document.querySelectorAll('.sample-btn');
    const tableRows = document.querySelectorAll('tbody tr');
    const resultPlaceholder = document.getElementById('resultPlaceholder');
    const resultContent = document.getElementById('resultContent');
    const fwiScoreElement = document.getElementById('fwiScore');
    const riskIndicator = document.querySelector('.risk-indicator');
    const riskIcon = document.getElementById('riskIcon');
    const riskLevel = document.getElementById('riskLevel');
    const riskDescription = document.getElementById('riskDescription');
    const scoreBar = document.getElementById('scoreBar');
    const assessmentCard = document.querySelector('.assessment-card');
    const globalStatus = document.getElementById('globalStatus');
    const thresholdValue = document.querySelector('.threshold-value');

    // Chat elements
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat');
    const resetChatBtn = document.getElementById('reset-chat');
    const chatBox = document.getElementById('chat-box');
    const typingIndicator = document.getElementById('typing-indicator');
    const promptChips = document.querySelectorAll('.prompt-chip');
    const aiStatus = document.getElementById('ai-status');

    // Input fields
    const inputFields = [
        'temperature', 'rh', 'ws', 'rain', 'ffmc',
        'dmc', 'dc', 'isi', 'bui'
    ];

    // Sample data
    const sampleData = [
        { temperature: 35, rh: 34, ws: 17, rain: 0.0, ffmc: 92.2, dmc: 23.6, dc: 97.3, isi: 13.8, bui: 29.4 },
        { temperature: 28, rh: 67, ws: 19, rain: 0.0, ffmc: 75.4, dmc: 2.9, dc: 16.3, isi: 2.0, bui: 4.0 },
        { temperature: 39, rh: 39, ws: 15, rain: 0.2, ffmc: 89.3, dmc: 15.8, dc: 35.4, isi: 8.2, bui: 15.8 },
        { temperature: 32, rh: 55, ws: 14, rain: 0.0, ffmc: 86.2, dmc: 8.3, dc: 18.4, isi: 5.0, bui: 8.2 },
        { temperature: 37, rh: 55, ws: 15, rain: 0.0, ffmc: 89.3, dmc: 28.3, dc: 67.2, isi: 8.3, bui: 28.3 }
    ];

    // Threshold configuration - UPDATED TO 6.0
    const THRESHOLD = 6.0;

    // Risk configurations - UPDATED FOR 6.0 THRESHOLD
    const riskConfigs = {
        'SAFE': {
            color: '#44FF88',
            description: 'FWI score below 6.0 threshold',
            recommendations: [
                'Fire conditions are within safe limits',
                'Standard fire precautions are sufficient',
                'Maintain regular monitoring',
                'Ensure fire equipment is accessible'
            ],
            chatbotPrompts: [
                'What does this FWI score mean for fire risk?',
                'How should I interpret this safe FWI score?',
                'What precautions should I take with this score?'
            ]
        },
        'HIGH RISK': {
            color: '#FF4444',
            description: 'FWI score exceeds 6.0 threshold',
            recommendations: [
                'High fire risk detected!',
                'Increase fire patrol frequency',
                'Activate fire watch procedures',
                'Prepare fire suppression teams',
                'Issue public warnings if necessary'
            ],
            chatbotPrompts: [
                'What actions should I take for high FWI scores?',
                'How dangerous is this FWI level?',
                'What causes FWI scores to be this high?'
            ]
        }
    };

    // Chat history
    let chatHistory = [];

    // Initialize application
    function initApp() {
        // Check system health
        checkSystemHealth();
        
        // Load first sample
        setTimeout(() => {
            loadSampleData(0);
        }, 500);
        
        // Setup event listeners
        setupEventListeners();
        
        // Update threshold display
        if (thresholdValue) {
            thresholdValue.textContent = `Threshold: ${THRESHOLD}`;
        }
        
        // Initialize chatbot
        initChatbot();
    }

    // Initialize chatbot
    function initChatbot() {
        // Check AI status
        checkAIStatus();
        
        // Add initial welcome message with current threshold
        addMessage("Hello! I'm an FWI expert assistant. I can help you understand the Fire Weather Index and its components. The current system uses a 6.0 threshold for risk assessment.", false);
    }

    // Check AI status
    async function checkAIStatus() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            if (data.gemini_configured) {
                updateAIStatus(true, 'AI Assistant connected and ready');
            } else {
                updateAIStatus(false, 'AI Assistant offline - Gemini API not configured');
                addMessage("Note: I'm currently in offline mode. Some responses may be limited.", false);
            }
        } catch (error) {
            updateAIStatus(false, 'Cannot connect to AI Assistant service');
            addMessage("I'm currently offline. You can still ask questions, but my responses will be limited.", false);
        }
    }

    // Update AI status
    function updateAIStatus(isOnline, message = '') {
        if (aiStatus) {
            aiStatus.className = `ai-status ${isOnline ? 'online' : 'offline'}`;
            aiStatus.innerHTML = `<i class="fas fa-circle"></i><span>${message || (isOnline ? 'AI Assistant online and ready' : 'AI Assistant offline')}</span>`;
        }
    }

    // Add message to chat
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-header ${isUser ? 'user-header' : 'bot-header'}">
                <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
                <span>${isUser ? 'You' : 'FWI Assistant'}</span>
                <span class="message-time">${timeString}</span>
            </div>
            <div class="message-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}">
                ${escapeHtml(message)}
            </div>
        `;
        
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Store in history
        chatHistory.push({
            is_user: isUser,
            text: message,
            timestamp: now
        });
    }

    // Show typing indicator
    function showTypingIndicator(show = true) {
        if (typingIndicator) {
            typingIndicator.style.display = show ? 'block' : 'none';
            if (show) {
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }
    }

    // Send message to chatbot
    async function sendChatMessage(message) {
        if (!message.trim()) return;
        
        addMessage(message, true);
        showTypingIndicator(true);
        
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    history: chatHistory.slice(-6) // Send last 6 messages for context
                })
            });
            
            const data = await response.json();
            showTypingIndicator(false);
            
            if (data.success) {
                addMessage(data.response, false);
                updateAIStatus(true);
            } else {
                addMessage(`I'm sorry, I encountered an error: ${data.error}. Please try again or check your connection.`, false);
                updateAIStatus(false);
            }
        } catch (error) {
            showTypingIndicator(false);
            addMessage("I'm having trouble connecting to the server right now. Please check your internet connection and try again.", false);
            updateAIStatus(false);
        }
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Check system health
    async function checkSystemHealth() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            if (data.model_loaded && data.scaler_loaded) {
                globalStatus.textContent = 'OPERATIONAL';
                globalStatus.style.color = '#44FF88';
                showNotification(`System ready for predictions (Threshold: ${THRESHOLD})`, 'success');
            } else {
                globalStatus.textContent = 'PARTIAL';
                globalStatus.style.color = '#FFC107';
                showNotification('Some models not loaded', 'warning');
            }
        } catch (error) {
            globalStatus.textContent = 'OFFLINE';
            globalStatus.style.color = '#FF4444';
            showNotification('Cannot connect to server', 'error');
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Prediction listeners
        predictBtn.addEventListener('click', predictFWI);
        resetBtn.addEventListener('click', resetForm);
        
        sampleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sampleIndex = parseInt(e.target.dataset.sample);
                loadSampleData(sampleIndex);
            });
        });
        
        tableRows.forEach(row => {
            row.addEventListener('click', (e) => {
                const sampleIndex = parseInt(e.currentTarget.dataset.sample);
                loadSampleData(sampleIndex);
            });
        });
        
        // Enter key support for prediction
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.target.matches('button') && !e.target.id === 'chat-input') {
                predictFWI();
            }
        });
        
        // Chat listeners
        sendChatBtn.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message) {
                sendChatMessage(message);
                chatInput.value = '';
            }
        });
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && chatInput.value.trim()) {
                const message = chatInput.value.trim();
                sendChatMessage(message);
                chatInput.value = '';
            }
        });
        
        resetChatBtn.addEventListener('click', resetChat);
        
        promptChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const prompt = e.target.getAttribute('data-prompt');
                if (prompt) {
                    sendChatMessage(prompt);
                }
            });
        });
    }

    // Load sample data
    function loadSampleData(index) {
        const sample = sampleData[index];
        if (!sample) return;
        
        inputFields.forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                input.value = sample[field];
                // Trigger validation
                validateInput(input);
            }
        });
        
        // Reset results
        resetResults();
        
        // Visual feedback
        highlightTableRow(index);
        showNotification(`Loaded Sample ${index + 1}`, 'info');
        
        // Ask AI about the loaded data
        setTimeout(() => {
            addMessage(`Loaded sample data: Temperature ${sample.temperature}°C, RH ${sample.rh}%, Wind ${sample.ws}km/h`, false);
        }, 500);
    }

    // Validate input
    function validateInput(input) {
        const value = input.value.trim();
        const isValid = value !== '' && !isNaN(value);
        
        if (isValid) {
            input.style.borderColor = '#44FF88';
            input.style.boxShadow = '0 0 10px rgba(68, 255, 136, 0.3)';
        } else {
            input.style.borderColor = '#FF4444';
            input.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.3)';
        }
        
        return isValid;
    }

    // Validate all inputs
    function validateAllInputs() {
        let allValid = true;
        
        inputFields.forEach(field => {
            const input = document.getElementById(field);
            if (!validateInput(input)) {
                allValid = false;
                // Add shake effect
                input.classList.add('shake');
                setTimeout(() => input.classList.remove('shake'), 500);
            }
        });
        
        if (!allValid) {
            showNotification('Please fill all fields with valid numbers', 'error');
        }
        
        return allValid;
    }

    // Predict FWI
    async function predictFWI() {
        // Validate inputs
        if (!validateAllInputs()) return;
        
        // Collect data
        const data = {};
        inputFields.forEach(field => {
            data[field] = document.getElementById(field).value;
        });
        
        try {
            // Show loading state
            startLoading();
            
            // Send prediction request
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Display results
                displayResults(result);
                showNotification('Prediction successful!', 'success');
                
                // Ask AI about the prediction
                setTimeout(() => {
                    const prompt = `The FWI prediction is ${result.fwi_score.toFixed(2)} which is ${result.risk_level}. What does this mean?`;
                    sendChatMessage(prompt);
                }, 1000);
            } else {
                showNotification(`Error: ${result.error}`, 'error');
                // Fallback to mock prediction for demo
                mockPrediction(data);
            }
        } catch (error) {
            console.error('Prediction error:', error);
            showNotification('Failed to connect to server', 'error');
            // Fallback to mock prediction
            mockPrediction(data);
        } finally {
            // Reset loading state
            stopLoading();
        }
    }

    // Display results
    function displayResults(result) {
        // Show results container
        resultPlaceholder.style.display = 'none';
        resultContent.style.display = 'block';
        
        // Animate score update
        const isHighRisk = result.is_high_risk;
        const score = result.fwi_score;
        
        animateScore(score, isHighRisk);
        updateRiskDisplay(result);
        animateRiskBar(score);
        updateRecommendations(isHighRisk);
        updateChatPrompts(isHighRisk);
    }

    // Animate score display
    function animateScore(targetScore, isHighRisk) {
        const startScore = 0;
        const duration = 1500;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = startScore + (targetScore - startScore) * easeOut;
            
            // Update display
            fwiScoreElement.textContent = currentValue.toFixed(2);
            
            // Update color based on risk
            if (currentValue >= THRESHOLD) {
                fwiScoreElement.classList.remove('safe');
                fwiScoreElement.classList.add('danger');
            } else {
                fwiScoreElement.classList.remove('danger');
                fwiScoreElement.classList.add('safe');
            }
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                fwiScoreElement.textContent = targetScore.toFixed(2);
            }
        }
        
        requestAnimationFrame(update);
    }

    // Update risk display
    function updateRiskDisplay(result) {
        const isHighRisk = result.is_high_risk;
        
        // Update risk indicator
        riskIndicator.className = 'risk-indicator';
        riskIndicator.classList.add(isHighRisk ? 'danger' : 'safe');
        
        const icon = riskIndicator.querySelector('i');
        const text = riskIndicator.querySelector('span');
        
        if (icon) {
            icon.className = result.risk_icon;
        }
        if (text) {
            text.textContent = result.risk_level;
        }
        
        // Update assessment card
        assessmentCard.className = 'assessment-card';
        assessmentCard.classList.add(isHighRisk ? 'danger' : 'safe');
        
        // Update risk icon
        riskIcon.className = result.risk_icon;
        riskIcon.classList.add(isHighRisk ? 'danger' : 'safe');
        
        // Update risk level text
        riskLevel.textContent = result.risk_level;
        riskLevel.className = isHighRisk ? 'danger' : 'safe';
        
        // Update description
        riskDescription.textContent = getRiskDescription(result.fwi_score, isHighRisk);
    }

    // Get risk description based on 6.0 threshold
    function getRiskDescription(score, isHighRisk) {
        return isHighRisk 
            ? `FWI score ${score.toFixed(2)} exceeds ${THRESHOLD} threshold. High fire risk detected.`
            : `FWI score ${score.toFixed(2)} is below ${THRESHOLD} threshold. Conditions are safe.`;
    }

    // Update recommendations
    function updateRecommendations(isHighRisk) {
        const config = riskConfigs[isHighRisk ? 'HIGH RISK' : 'SAFE'];
        const recommendationsContainer = document.querySelector('.recommendations');
        
        if (!recommendationsContainer) {
            // Create recommendations container if it doesn't exist
            const container = document.createElement('div');
            container.className = `recommendations ${isHighRisk ? 'danger' : 'safe'}`;
            assessmentCard.appendChild(container);
        } else {
            recommendationsContainer.className = `recommendations ${isHighRisk ? 'danger' : 'safe'}`;
        }
        
        const recommendationsContainerFinal = document.querySelector('.recommendations');
        recommendationsContainerFinal.innerHTML = config.recommendations
            .map(rec => `<div class="recommendation"><i class="fas ${isHighRisk ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i><span>${rec}</span></div>`)
            .join('');
    }

    // Update chat prompts based on risk level
    function updateChatPrompts(isHighRisk) {
        const config = riskConfigs[isHighRisk ? 'HIGH RISK' : 'SAFE'];
        
        // Update prompt chips
        const newPrompts = config.chatbotPrompts || [];
        promptChips.forEach((chip, index) => {
            if (index < newPrompts.length) {
                chip.textContent = newPrompts[index];
                chip.setAttribute('data-prompt', newPrompts[index]);
            }
        });
    }

    // Animate risk bar - UPDATED FOR 6.0 THRESHOLD (0-10 scale)
    function animateRiskBar(score) {
        // Calculate percentage for 0-10 scale
        const maxVisual = 10.0;
        const percentage = Math.min((score / maxVisual) * 100, 100);
        
        // Reset and animate
        scoreBar.style.width = '0%';
        
        setTimeout(() => {
            scoreBar.style.width = `${percentage}%`;
            
            // Update bar color based on threshold
            if (score >= THRESHOLD) {
                scoreBar.style.background = 'linear-gradient(90deg, #FF8800, #FF4444)';
                scoreBar.style.boxShadow = '0 0 15px #FF4444';
            } else {
                scoreBar.style.background = 'linear-gradient(90deg, #44FF88, #00ccff)';
                scoreBar.style.boxShadow = '0 0 15px #44FF88';
            }
        }, 100);
    }

    // Mock prediction (fallback) - UPDATED FOR 6.0 THRESHOLD
    function mockPrediction(data) {
        // Calculate mock score based on inputs
        const temp = parseFloat(data.temperature) || 0;
        const rh = parseFloat(data.rh) || 0;
        const ws = parseFloat(data.ws) || 0;
        
        // Simple formula for demo - adjusted for 0-10 scale
        let mockScore = (temp * 0.04) + ((100 - rh) * 0.02) + (ws * 0.01);
        mockScore = Math.min(mockScore, 10); // Cap at 10 for 0-10 scale
        
        const isHighRisk = mockScore >= THRESHOLD;
        
        const mockResult = {
            fwi_score: mockScore,
            is_high_risk: isHighRisk,
            risk_level: isHighRisk ? 'HIGH RISK' : 'SAFE',
            risk_color: isHighRisk ? '#FF4444' : '#44FF88',
            risk_icon: isHighRisk ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle',
            threshold: THRESHOLD
        };
        
        displayResults(mockResult);
        showNotification('Using mock prediction (offline mode)', 'warning');
        
        // Ask AI about mock prediction
        addMessage("I'm showing a mock prediction since I couldn't connect to the server. The calculated FWI score is " + mockScore.toFixed(2), false);
    }

    // Reset form
    function resetForm() {
        inputFields.forEach(field => {
            const input = document.getElementById(field);
            input.value = '';
            input.style.borderColor = '';
            input.style.boxShadow = '';
        });
        
        resetResults();
        showNotification('Form cleared', 'info');
    }

    // Reset chat
    function resetChat() {
        chatHistory = [];
        chatBox.innerHTML = '';
        addMessage("Chat cleared. Hello again! I'm your FWI expert assistant. How can I help you understand the Fire Weather Index today?", false);
        showNotification('Chat history cleared', 'info');
    }

    // Reset results display
    function resetResults() {
        resultPlaceholder.style.display = 'flex';
        resultContent.style.display = 'none';
        
        // Reset score board
        fwiScoreElement.textContent = '0.00';
        fwiScoreElement.className = 'score-value';
        
        // Reset risk indicator
        riskIndicator.className = 'risk-indicator safe';
        riskIndicator.innerHTML = '<i class="fas fa-check-circle"></i><span>SAFE</span>';
        
        // Reset assessment card
        assessmentCard.className = 'assessment-card';
        riskIcon.className = 'fas fa-check-circle';
        riskLevel.textContent = 'SAFE CONDITIONS';
        riskDescription.textContent = `FWI score is below ${THRESHOLD} threshold. Conditions are safe.`;
        
        // Reset progress bar
        scoreBar.style.width = '0%';
        scoreBar.style.background = 'linear-gradient(90deg, #44FF88, #00ccff)';
        scoreBar.style.boxShadow = '0 0 15px #44FF88';
        
        // Remove recommendations container
        const recommendationsContainer = document.querySelector('.recommendations');
        if (recommendationsContainer) {
            recommendationsContainer.remove();
        }
    }

    // Start loading animation
    function startLoading() {
        predictBtn.disabled = true;
        predictBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSING...';
        
        // Add loading effect to inputs
        inputFields.forEach(field => {
            const input = document.getElementById(field);
            input.classList.add('loading');
        });
    }

    // Stop loading animation
    function stopLoading() {
        predictBtn.disabled = false;
        predictBtn.innerHTML = '<i class="fas fa-bolt"></i><span>PREDICT FWI</span><div class="btn-glow"></div>';
        
        // Remove loading effect
        inputFields.forEach(field => {
            const input = document.getElementById(field);
            input.classList.remove('loading');
        });
    }

    // Highlight table row
    function highlightTableRow(index) {
        tableRows.forEach((row, i) => {
            if (i === index) {
                row.style.background = 'rgba(68, 255, 136, 0.1)';
                row.style.borderLeft = '3px solid #44FF88';
            } else {
                row.style.background = '';
                row.style.borderLeft = '';
            }
        });
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const colors = {
            success: '#44FF88',
            error: '#FF4444',
            warning: '#FFC107',
            info: '#00ccff'
        };
        
        notification.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid ${colors[type]}40;
            border-left: 4px solid ${colors[type]};
            color: #fff;
            border-radius: 10px;
            font-family: 'Montserrat', sans-serif;
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        
        notification.querySelector('i').style.color = colors[type];
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Tab title animation with threshold indicator
    function animateTabTitle() {
        const originalTitle = document.title;
        const fireIcon = '🔥';
        const thresholdIcon = '6.0⚡';
        let animationStep = 0;
        
        setInterval(() => {
            if (document.hidden) {
                const titles = [
                    originalTitle,
                    fireIcon + ' ' + originalTitle,
                    thresholdIcon + ' ' + originalTitle
                ];
                document.title = titles[animationStep % titles.length];
                animationStep++;
            } else {
                document.title = originalTitle;
            }
        }, 1000);
    }

    // Add shake animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes loading {
            0% { opacity: 0.3; }
            50% { opacity: 0.7; }
            100% { opacity: 0.3; }
        }
        
        .shake {
            animation: shake 0.5s ease-in-out;
        }
        
        .loading {
            animation: loading 1.5s infinite;
        }
        
        /* Recommendations styling */
        .recommendations {
            margin-top: 15px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 15px;
            border-left: 3px solid #44FF88;
        }
        
        .recommendations.danger {
            border-left-color: #FF4444;
        }
        
        .recommendation {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            color: #ccc;
            font-size: 0.9rem;
        }
        
        .recommendation:last-child {
            margin-bottom: 0;
        }
        
        .recommendation i {
            color: #44FF88;
            flex-shrink: 0;
        }
        
        .recommendations.danger .recommendation i {
            color: #FF4444;
        }
        
        /* Chatbot typing animation */
        @keyframes typing {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.3;
            }
            30% {
                transform: translateY(-5px);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    // Initialize the app
    initApp();
    
    // Start tab title animation
    animateTabTitle();
    
    // Auto-focus chat input after prediction
    predictBtn.addEventListener('click', function() {
        setTimeout(() => {
            if (chatInput) {
                chatInput.focus();
            }
        }, 500);
    });
});