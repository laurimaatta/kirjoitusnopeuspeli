class TypingGame {
    constructor() {
        this.gameArea = document.getElementById('game-area');
        this.wordInput = document.getElementById('word-input');
        this.scoreElement = document.getElementById('score');
        this.currentWordIndexElement = document.getElementById('current-word-index');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.leaderboardModal = document.getElementById('leaderboard-modal');
        this.finalScoreElement = document.getElementById('final-score');
        this.inputFeedback = document.getElementById('input-feedback');
        
        this.words = getRandomWords(200);
        this.activeWords = [];
        this.score = 0;
        this.currentWordIndex = 0;
        this.gameSpeed = 1.2; // pixels per frame (faster initial speed)
        this.baseSpeed = 1.2;
        this.speedIncrease = 0.05;
        this.gameRunning = false;
        this.gameLoop = null;
        this.wordSpawnInterval = null;
        this.lastSpawnTime = 0;
        this.spawnDelay = 2000; // milliseconds (spawn faster for more words)
        this.maxActiveWords = 4; // Maximum 3-4 words at once
        
        this.typoSound = this.createTypoSound();
        
        this.initializeEventListeners();
        this.loadLeaderboard();
    }
    
    createTypoSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 200;
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        };
    }
    
    initializeEventListeners() {
        this.wordInput.addEventListener('input', (e) => this.handleInput(e));
        this.wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.gameRunning) {
                this.startGame();
            }
        });
        
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.gameOverModal.classList.remove('active');
            this.hideStartScreen();
            this.startGame();
        });
        
        document.getElementById('view-leaderboard-btn').addEventListener('click', () => {
            this.showLeaderboard();
        });
        
        document.getElementById('save-score-btn').addEventListener('click', () => {
            this.saveScore();
        });
        
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.hideStartScreen();
            this.startGame();
        });
        
        document.getElementById('pre-game-leaderboard-btn').addEventListener('click', () => {
            this.showLeaderboard();
        });
        
        // Re-show start screen when leaderboard is closed from pre-game
        document.getElementById('close-leaderboard-btn').addEventListener('click', () => {
            this.leaderboardModal.classList.remove('active');
            if (!this.gameRunning) {
                // If game hasn't started yet, keep start screen visible
                setTimeout(() => {
                    if (!this.gameRunning && !this.gameOverModal.classList.contains('active')) {
                        this.showStartScreen();
                    }
                }, 100);
            }
        });
    }
    
    hideStartScreen() {
        document.getElementById('start-screen').style.display = 'none';
    }
    
    showStartScreen() {
        document.getElementById('start-screen').style.display = 'flex';
        this.wordInput.disabled = true;
    }
    
    startGame() {
        this.gameRunning = true;
        this.score = 0;
        this.currentWordIndex = 0;
        this.gameSpeed = this.baseSpeed;
        this.activeWords = [];
        this.gameArea.innerHTML = '';
        this.wordInput.value = '';
        this.inputFeedback.textContent = '';
        this.updateScore();
        
        this.gameOverModal.classList.remove('active');
        this.leaderboardModal.classList.remove('active');
        document.getElementById('leaderboard-section').style.display = 'none';
        
        this.wordInput.disabled = false;
        this.wordInput.focus();
        this.lastSpawnTime = Date.now();
        
        // Spawn initial batch of 3-4 words
        const initialCount = Math.min(3 + Math.floor(Math.random() * 2), this.maxActiveWords);
        for (let i = 0; i < initialCount; i++) {
            setTimeout(() => this.spawnWord(), i * 300);
        }
        
        this.gameLoop = requestAnimationFrame(() => this.update());
        this.wordSpawnInterval = setInterval(() => {
            // Only spawn if we have room for more words
            if (this.activeWords.length < this.maxActiveWords) {
                this.spawnWord();
            }
        }, this.spawnDelay);
    }
    
    spawnWord() {
        if (!this.gameRunning || this.currentWordIndex >= this.words.length) {
            return;
        }
        
        const word = this.words[this.currentWordIndex];
        const wordElement = document.createElement('div');
        wordElement.className = 'word';
        wordElement.textContent = word;
        wordElement.dataset.word = word;
        wordElement.dataset.index = this.currentWordIndex;
        
        // Random vertical position
        const maxY = this.gameArea.clientHeight - 60;
        const y = Math.random() * maxY;
        wordElement.style.top = `${y}px`;
        wordElement.style.left = '0px';
        
        this.gameArea.appendChild(wordElement);
        
        // Random velocities: mostly to the right, but also some vertical movement
        // Horizontal velocity: base speed + small random variation (mostly positive/right)
        const horizontalVel = this.gameSpeed + (Math.random() - 0.3) * 0.3;
        // Vertical velocity: random between -0.8 and 0.8 (can go up or down)
        const verticalVel = (Math.random() - 0.5) * 1.6;
        
        this.activeWords.push({
            element: wordElement,
            word: word,
            x: 0,
            y: y,
            vx: Math.max(0.3, horizontalVel), // Ensure mostly rightward movement
            vy: verticalVel,
            index: this.currentWordIndex
        });
        
        this.currentWordIndex++;
        this.updateScore();
    }
    
    update() {
        if (!this.gameRunning) {
            return;
        }
        
        const gameAreaWidth = this.gameArea.clientWidth;
        const gameAreaHeight = this.gameArea.clientHeight;
        const wordsToRemove = [];
        
        // Update word positions with velocity
        this.activeWords.forEach((wordObj, index) => {
            // Update position based on velocity
            wordObj.x += wordObj.vx;
            wordObj.y += wordObj.vy;
            
            // Bounce off top and bottom walls
            const wordHeight = wordObj.element.offsetHeight;
            if (wordObj.y <= 0) {
                wordObj.y = 0;
                wordObj.vy = -wordObj.vy; // Bounce down
            } else if (wordObj.y + wordHeight >= gameAreaHeight) {
                wordObj.y = gameAreaHeight - wordHeight;
                wordObj.vy = -wordObj.vy; // Bounce up
            }
            
            // Update DOM position
            wordObj.element.style.left = `${wordObj.x}px`;
            wordObj.element.style.top = `${wordObj.y}px`;
            
            // Check collision with right wall
            const wordWidth = wordObj.element.offsetWidth;
            if (wordObj.x + wordWidth >= gameAreaWidth) {
                this.endGame();
                return;
            }
            
            // Slight increase in horizontal velocity over time (speed up)
            wordObj.vx += this.speedIncrease * 0.0005;
        });
        
        // Remove completed words
        wordsToRemove.forEach(index => {
            this.activeWords.splice(index, 1);
        });
        
        // Increase base speed slightly
        this.gameSpeed += this.speedIncrease * 0.001;
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    handleInput(e) {
        if (!this.gameRunning) {
            return;
        }
        
        const inputValue = e.target.value.trim().toLowerCase();
        
        if (this.activeWords.length === 0) {
            return;
        }
        
        // Try to find a matching word (exact or partial match)
        let matchedWord = null;
        let isExactMatch = false;
        
        for (const wordObj of this.activeWords) {
            const wordText = wordObj.word.toLowerCase();
            if (inputValue === wordText) {
                matchedWord = wordObj;
                isExactMatch = true;
                break;
            } else if (wordText.startsWith(inputValue) && inputValue.length > 0) {
                // Partial match - use the closest one to the left if multiple match
                if (!matchedWord || wordObj.x < matchedWord.x) {
                    matchedWord = wordObj;
                }
            }
        }
        
        // Remove active class from all words
        this.activeWords.forEach(w => w.element.classList.remove('active'));
        
        if (isExactMatch && matchedWord) {
            // Correct word typed!
            this.removeWord(matchedWord);
            e.target.value = '';
            this.inputFeedback.textContent = '';
            this.inputFeedback.classList.remove('error');
            this.score += 10;
            this.updateScore();
            
            // Increase speed a bit more on correct typing (for new words)
            // Current words maintain their velocity
        } else if (matchedWord && inputValue.length > 0) {
            // Partially correct - highlight the word being typed
            matchedWord.element.classList.add('active');
            this.inputFeedback.textContent = '';
            this.inputFeedback.classList.remove('error');
        } else if (inputValue.length > 0) {
            // No match - typo detected
            // Find the leftmost word for typo effect
            const sortedWords = [...this.activeWords].sort((a, b) => a.x - b.x);
            if (sortedWords.length > 0) {
                this.handleTypo(sortedWords[0]);
            }
            this.inputFeedback.textContent = 'Virhe! Yritä uudelleen.';
            this.inputFeedback.classList.add('error');
        } else {
            // Empty input
            this.inputFeedback.textContent = '';
            this.inputFeedback.classList.remove('error');
        }
    }
    
    handleTypo(wordObj) {
        // Visual alarm effect
        wordObj.element.classList.add('typo');
        
        // Audio alarm
        try {
            this.typoSound();
        } catch (e) {
            // Audio context might not be available
        }
        
        // Remove typo class after animation
        setTimeout(() => {
            wordObj.element.classList.remove('typo');
        }, 300);
    }
    
    removeWord(wordObj) {
        wordObj.element.remove();
        const index = this.activeWords.indexOf(wordObj);
        if (index > -1) {
            this.activeWords.splice(index, 1);
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        this.currentWordIndexElement.textContent = this.currentWordIndex;
    }
    
    endGame() {
        this.gameRunning = false;
        
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        
        if (this.wordSpawnInterval) {
            clearInterval(this.wordSpawnInterval);
        }
        
        // Remove all active words
        this.activeWords.forEach(wordObj => wordObj.element.remove());
        this.activeWords = [];
        
        this.finalScoreElement.textContent = this.score;
        
        // Check if score qualifies for leaderboard (async)
        this.checkLeaderboardQualification();
        
        this.gameOverModal.classList.add('active');
        this.wordInput.disabled = true;
    }
    
    async checkLeaderboardQualification() {
        try {
            const leaderboard = await this.getLeaderboard();
            const minScore = leaderboard.length < 10 ? 0 : Math.min(...leaderboard.map(e => e.score));
            
            if (this.score > minScore || leaderboard.length < 10) {
                document.getElementById('leaderboard-section').style.display = 'block';
                document.getElementById('player-name-input').focus();
            }
        } catch (error) {
            console.error('Error checking leaderboard qualification:', error);
            // On error, still show the leaderboard section to allow saving
            document.getElementById('leaderboard-section').style.display = 'block';
            document.getElementById('player-name-input').focus();
        }
    }
    
    async getLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard');
            }
            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            // Fallback to empty array on error
            return [];
        }
    }
    
    loadLeaderboard() {
        // Leaderboard is loaded when modal is shown
    }
    
    async saveScore() {
        const nameInput = document.getElementById('player-name-input');
        const name = nameInput.value.trim() || 'Nimetön';
        
        if (name.length === 0 || name.length > 20) {
            alert('Nimen on oltava 1-20 merkkiä pitkä.');
            return;
        }
        
        const saveBtn = document.getElementById('save-score-btn');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Tallennetaan...';
        
        try {
            const response = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    score: this.score
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save score');
            }
            
            document.getElementById('leaderboard-section').style.display = 'none';
            nameInput.value = '';
            await this.showLeaderboard();
            
        } catch (error) {
            console.error('Error saving score:', error);
            alert('Tuloksen tallennus epäonnistui: ' + error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }
    
    async showLeaderboard() {
        const listElement = document.getElementById('leaderboard-list');
        listElement.innerHTML = '<p>Ladataan...</p>';
        this.leaderboardModal.classList.add('active');
        
        try {
            const leaderboard = await this.getLeaderboard();
            
            if (leaderboard.length === 0) {
                listElement.innerHTML = '<p>Top-listalla ei ole vielä tuloksia.</p>';
            } else {
                listElement.innerHTML = leaderboard.map((entry, index) => {
                    const date = new Date(entry.date);
                    const dateStr = date.toLocaleDateString('fi-FI');
                    const rankClass = index < 3 ? `rank-${index + 1}` : '';
                    
                    return `
                        <div class="leaderboard-item ${rankClass}">
                            <span class="leaderboard-rank">${index + 1}.</span>
                            <span class="leaderboard-name">${entry.name}</span>
                            <span class="leaderboard-score">${entry.score} pts</span>
                        </div>
                    `;
                }).join('');
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            listElement.innerHTML = '<p>Top-listan lataaminen epäonnistui. Yritä myöhemmin uudelleen.</p>';
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new TypingGame();
    game.showStartScreen();
    // Make game accessible globally for button handlers
    window.typingGame = game;
});
