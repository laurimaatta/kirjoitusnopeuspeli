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
        this.gameSpeed = 0.5; // pixels per frame
        this.baseSpeed = 0.5;
        this.speedIncrease = 0.01;
        this.gameRunning = false;
        this.gameLoop = null;
        this.wordSpawnInterval = null;
        this.lastSpawnTime = 0;
        this.spawnDelay = 3000; // milliseconds
        
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
            this.startGame();
        });
        
        document.getElementById('view-leaderboard-btn').addEventListener('click', () => {
            this.showLeaderboard();
        });
        
        document.getElementById('close-leaderboard-btn').addEventListener('click', () => {
            this.leaderboardModal.classList.remove('active');
        });
        
        document.getElementById('save-score-btn').addEventListener('click', () => {
            this.saveScore();
        });
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
        
        this.wordInput.focus();
        this.lastSpawnTime = Date.now();
        this.spawnWord();
        
        this.gameLoop = requestAnimationFrame(() => this.update());
        this.wordSpawnInterval = setInterval(() => this.spawnWord(), this.spawnDelay);
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
        
        this.activeWords.push({
            element: wordElement,
            word: word,
            x: 0,
            y: y,
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
        const wordsToRemove = [];
        
        // Update word positions
        this.activeWords.forEach((wordObj, index) => {
            wordObj.x += this.gameSpeed;
            wordObj.element.style.left = `${wordObj.x}px`;
            
            // Check collision with right wall
            const wordWidth = wordObj.element.offsetWidth;
            if (wordObj.x + wordWidth >= gameAreaWidth) {
                this.endGame();
                return;
            }
        });
        
        // Remove completed words
        wordsToRemove.forEach(index => {
            this.activeWords.splice(index, 1);
        });
        
        // Increase speed slightly
        this.gameSpeed += this.speedIncrease * 0.001;
        
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    handleInput(e) {
        if (!this.gameRunning) {
            return;
        }
        
        const inputValue = e.target.value.trim().toLowerCase();
        
        // Find the first active word (leftmost)
        if (this.activeWords.length === 0) {
            return;
        }
        
        // Sort by x position to get leftmost word
        const sortedWords = [...this.activeWords].sort((a, b) => a.x - b.x);
        const targetWord = sortedWords[0];
        const targetWordText = targetWord.word.toLowerCase();
        
        // Mark as active
        this.activeWords.forEach(w => w.element.classList.remove('active'));
        targetWord.element.classList.add('active');
        
        if (inputValue === targetWordText) {
            // Correct word typed!
            this.removeWord(targetWord);
            e.target.value = '';
            this.inputFeedback.textContent = '';
            this.score += 10;
            this.updateScore();
            
            // Increase speed a bit more on correct typing
            this.gameSpeed += 0.1;
        } else if (targetWordText.startsWith(inputValue)) {
            // Partially correct
            this.inputFeedback.textContent = '';
            this.inputFeedback.classList.remove('error');
        } else {
            // Typo detected
            this.handleTypo(targetWord);
            this.inputFeedback.textContent = 'Virhe! Yritä uudelleen.';
            this.inputFeedback.classList.add('error');
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
        
        // Check if score qualifies for leaderboard
        const leaderboard = this.getLeaderboard();
        const minScore = leaderboard.length < 10 ? 0 : Math.min(...leaderboard.map(e => e.score));
        
        if (this.score > minScore || leaderboard.length < 10) {
            document.getElementById('leaderboard-section').style.display = 'block';
            document.getElementById('player-name-input').focus();
        }
        
        this.gameOverModal.classList.add('active');
    }
    
    getLeaderboard() {
        const stored = localStorage.getItem('typingGameLeaderboard');
        return stored ? JSON.parse(stored) : [];
    }
    
    loadLeaderboard() {
        // Leaderboard is loaded when modal is shown
    }
    
    saveScore() {
        const nameInput = document.getElementById('player-name-input');
        const name = nameInput.value.trim() || 'Nimetön';
        
        if (name.length === 0 || name.length > 20) {
            alert('Nimen on oltava 1-20 merkkiä pitkä.');
            return;
        }
        
        const leaderboard = this.getLeaderboard();
        leaderboard.push({
            name: name,
            score: this.score,
            date: new Date().toISOString()
        });
        
        // Sort by score (descending)
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        const top10 = leaderboard.slice(0, 10);
        
        localStorage.setItem('typingGameLeaderboard', JSON.stringify(top10));
        
        document.getElementById('leaderboard-section').style.display = 'none';
        nameInput.value = '';
        this.showLeaderboard();
    }
    
    showLeaderboard() {
        const leaderboard = this.getLeaderboard();
        const listElement = document.getElementById('leaderboard-list');
        
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
        
        this.leaderboardModal.classList.add('active');
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new TypingGame();
    // Focus input on load
    document.getElementById('word-input').focus();
});
