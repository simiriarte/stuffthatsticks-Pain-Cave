class PomodoroTimer {
    constructor() {
        this.secondsElapsed = 0;
        this.timerId = null;
        this.isRunning = false;
        this.lastBreakTime = 0;
        this.selectedBreakTime = null;
        this.isRestMode = false;
        this.savedTime = 0;
        
        // Sound settings
        this.soundEnabled = true;
        this.volume = 0.5;
        
        // DOM Elements
        this.timeDisplay = document.querySelector('.time-display');
        this.breakCountdown = document.getElementById('break-countdown');
        this.toggleButton = document.getElementById('toggle');
        this.resetButton = document.getElementById('reset');
        this.soundToggle = document.getElementById('sound-toggle');
        this.volumeSlider = document.getElementById('volume-slider');
        this.collapseToggle = document.getElementById('collapse-toggle');
        this.breakSettings = document.querySelector('.break-settings');
        this.caveImage = document.querySelector('.cave-image');
        this.restModeButton = document.getElementById('rest-mode');
        
        // Break time elements
        this.breakRadios = document.querySelectorAll('input[name="break-time"]');
        this.customTimeInput = document.getElementById('custom-time');
        
        // Modal elements
        this.breakModal = document.getElementById('break-modal');
        this.breakMessage = document.getElementById('break-message');
        this.takeBreakButton = document.getElementById('take-break');
        this.keepGoingButton = document.getElementById('keep-going');
        
        // Sound elements
        this.magicalSound = new Audio('sounds/magical twinkle.mp3');
        this.magicalSound.volume = this.volume;
        
        // Event Listeners
        this.toggleButton.addEventListener('click', () => this.toggle());
        this.resetButton.addEventListener('click', () => this.reset());
        this.collapseToggle.addEventListener('click', () => this.toggleCollapse());
        this.restModeButton.addEventListener('click', () => this.toggleRestMode());
        
        // Break time listeners
        this.breakRadios.forEach(radio => {
            const wrapper = radio.closest('.break-toggle');
            const label = wrapper.querySelector('label');
            
            // Create a custom radio button
            const customRadio = document.createElement('div');
            customRadio.className = 'custom-radio';
            radio.style.display = 'none'; // Hide the original radio
            wrapper.insertBefore(customRadio, label);
            
            // Update the custom radio appearance based on the actual radio state
            const updateCustomRadio = () => {
                customRadio.classList.toggle('checked', radio.checked);
            };
            
            // Handle clicks on the custom radio
            customRadio.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (radio.checked) {
                    // If already checked, uncheck it
                    radio.checked = false;
                    this.selectedBreakTime = null;
                    this.customTimeInput.disabled = true;
                    this.breakCountdown.textContent = '--:--';
                } else {
                    // If not checked, check it and uncheck others
                    this.breakRadios.forEach(otherRadio => {
                        otherRadio.checked = false;
                        otherRadio.closest('.break-toggle').querySelector('.custom-radio').classList.remove('checked');
                    });
                    radio.checked = true;
                    this.updateBreakTime(radio);
                }
                updateCustomRadio();
            });
            
            // Update the custom radio when the actual radio changes
            radio.addEventListener('change', updateCustomRadio);
            
            // Initial state
            updateCustomRadio();
        });
        
        this.customTimeInput.addEventListener('change', () => {
            if (document.getElementById('break-custom').checked) {
                this.selectedBreakTime = parseInt(this.customTimeInput.value) * 60;
            }
        });
        
        // Modal button listeners
        this.takeBreakButton.addEventListener('click', () => {
            this.pause();
            this.breakModal.style.display = 'none';
            this.toggleRestMode();
        });
        
        this.keepGoingButton.addEventListener('click', () => {
            this.breakModal.style.display = 'none';
            this.start();  // Resume the timer when clicking Keep Going
        });
        
        // Sound control listeners
        this.soundToggle.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            this.playTestSound();
        });
        
        this.volumeSlider.addEventListener('change', (e) => {
            this.volume = e.target.value / 100;
            this.magicalSound.volume = this.volume;
            if (this.soundEnabled) {
                this.playTestSound();
            }
        });
        
        this.updateDisplay();
    }
    
    updateBreakTime(checkbox) {
        if (checkbox.id === 'break-custom') {
            this.customTimeInput.disabled = false;
            this.selectedBreakTime = parseInt(this.customTimeInput.value) * 60;
        } else {
            this.customTimeInput.disabled = true;
            this.selectedBreakTime = parseInt(checkbox.value) * 60;
        }
        // Set lastBreakTime to current time when break time is changed
        this.lastBreakTime = this.secondsElapsed;
    }
    
    toggleRestMode() {
        if (this.isRestMode) {
            // Don't exit rest mode when clicking the button
            return;
        } else {
            // Enter rest mode
            this.isRestMode = true;
            this.savedTime = this.secondsElapsed; // Save current time
            this.pause();
            this.caveImage.src = 'images/DETOX.png';
            this.caveImage.alt = 'Detox';
            this.timeDisplay.style.color = 'white';
            this.toggleButton.textContent = 'Enter Pain Cave';
            this.toggleButton.style.backgroundColor = '#ff8900';
            this.toggleButton.style.color = 'white';
            this.restModeButton.textContent = 'Start Chillin';
            document.querySelector('.container').classList.add('in-rest-mode');
            document.querySelector('.container').classList.remove('in-cave');
            // Hide timers
            this.timeDisplay.style.display = 'none';
            this.breakCountdown.parentElement.style.display = 'none';
            // Change break button text
            this.collapseToggle.textContent = 'End break after...';
        }
    }
    
    toggle() {
        if (this.isRestMode) {
            // Enter pain cave from rest mode
            this.isRestMode = false;
            this.secondsElapsed = this.savedTime; // Restore saved time
            this.start();
            this.caveImage.src = 'images/PAIN CAVE.png';
            this.caveImage.alt = 'Pain Cave';
            this.toggleButton.textContent = 'Exit Pain Cave';
            this.toggleButton.style.backgroundColor = '#1abc9c';
            this.toggleButton.style.color = 'white';
            this.restModeButton.textContent = 'Rest Mode';
            document.querySelector('.container').classList.remove('in-rest-mode');
            document.querySelector('.container').classList.add('in-cave');
            this.timeDisplay.style.color = 'white';
            // Show timers
            this.timeDisplay.style.display = 'block';
            this.breakCountdown.parentElement.style.display = 'block';
            // Reset break button text
            this.collapseToggle.textContent = 'Take a break after...';
            return;
        }
        
        if (!this.isRunning) {
            // Enter pain cave
            this.start();
            this.caveImage.src = 'images/PAIN CAVE.png';
            this.caveImage.alt = 'Pain Cave';
            this.toggleButton.textContent = 'Exit Pain Cave';
            this.toggleButton.style.backgroundColor = '#1abc9c';
            this.toggleButton.style.color = 'white';
            document.querySelector('.container').classList.add('in-cave');
            this.timeDisplay.style.color = 'white';
            // Show timers
            this.timeDisplay.style.display = 'block';
            this.breakCountdown.parentElement.style.display = 'block';
        } else {
            // Exit pain cave
            this.pause();
            this.toggleButton.textContent = 'Enter Pain Cave';
            this.toggleButton.style.backgroundColor = '#ff8900';
            this.toggleButton.style.color = 'white';
            document.querySelector('.container').classList.remove('in-cave');
            this.timeDisplay.style.color = '#333';
            // Show timers
            this.timeDisplay.style.display = 'block';
            this.breakCountdown.parentElement.style.display = 'block';
        }
    }
    
    playTestSound() {
        if (this.soundEnabled) {
            this.magicalSound.currentTime = 0;
            this.magicalSound.play().catch(error => {
                console.log('Error playing test sound:', error);
            });
        }
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.timerId = setInterval(() => {
                this.secondsElapsed++;
                this.updateDisplay();
                
                // Check for break time only if a break time is selected
                if (this.selectedBreakTime !== null && 
                    this.secondsElapsed >= this.selectedBreakTime && 
                    this.secondsElapsed - this.lastBreakTime >= this.selectedBreakTime) {
                    
                    console.log('Break time reached:', {
                        secondsElapsed: this.secondsElapsed,
                        selectedBreakTime: this.selectedBreakTime,
                        lastBreakTime: this.lastBreakTime
                    });
                    
                    const totalMinutes = Math.floor(this.secondsElapsed / 60);
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    
                    let timeString = '';
                    if (hours > 0) {
                        timeString = `${hours} hour${hours > 1 ? 's' : ''}`;
                        if (minutes > 0) {
                            timeString += ` and ${minutes} minute${minutes > 1 ? 's' : ''}`;
                        }
                    } else {
                        timeString = `${minutes} minute${minutes > 1 ? 's' : ''}`;
                    }
                    
                    this.breakMessage.innerHTML = `you've been in the pain cave for:<br><span class="time-highlight">${timeString}</span>`;
                    this.breakModal.style.display = 'block';
                    this.lastBreakTime = this.secondsElapsed;
                    this.pause();  // Pause the timer when the modal appears
                    
                    if (this.soundEnabled) {
                        this.magicalSound.currentTime = 0;
                        this.magicalSound.play().catch(error => {
                            console.log('Error playing sound:', error);
                        });
                    }
                }
            }, 1000);
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.timerId);
        }
    }
    
    reset() {
        this.pause();
        this.secondsElapsed = 0;
        this.lastBreakTime = 0;
        this.selectedBreakTime = null; // Clear break time selection
        this.updateDisplay();
        this.toggleButton.textContent = 'Enter Pain Cave';
        this.toggleButton.style.backgroundColor = '#ff8900'; // Orange
        this.toggleButton.style.color = 'white';
        this.breakCountdown.textContent = '--:--';
        document.querySelector('.container').classList.remove('in-cave'); // Exit pain cave state
        
        // Reset break time selection
        this.breakRadios.forEach(checkbox => {
            checkbox.checked = false;
        });
        this.customTimeInput.value = '';
        this.customTimeInput.disabled = true;
    }
    
    updateDisplay() {
        const hours = Math.floor(this.secondsElapsed / 3600);
        const minutes = Math.floor((this.secondsElapsed % 3600) / 60);
        const seconds = this.secondsElapsed % 60;
        
        let timeString;
        if (hours > 0) {
            timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        this.timeDisplay.textContent = timeString;
        document.title = `${timeString} - Pain Cave`;

        // Update break countdown
        if (this.selectedBreakTime !== null) {
            const timeUntilBreak = this.selectedBreakTime - (this.secondsElapsed - this.lastBreakTime);
            if (timeUntilBreak > 0) {
                const breakMinutes = Math.floor(timeUntilBreak / 60);
                const breakSeconds = timeUntilBreak % 60;
                this.breakCountdown.textContent = `${breakMinutes.toString().padStart(2, '0')}:${breakSeconds.toString().padStart(2, '0')}`;
            } else {
                this.breakCountdown.textContent = '00:00';
            }
        } else {
            this.breakCountdown.textContent = '--:--';
        }
    }
    
    toggleCollapse() {
        this.breakSettings.classList.toggle('collapsed');
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});

// Set break button width to match main buttons
function setBreakButtonWidth() {
    const mainButtons = document.getElementById('main-buttons');
    const breakButton = document.querySelector('.break-button');
    if (mainButtons && breakButton) {
        breakButton.style.width = mainButtons.offsetWidth + 'px';
    }
}

// Call on load and resize
window.addEventListener('load', setBreakButtonWidth);
window.addEventListener('resize', setBreakButtonWidth);

// Add this at the end of the file, before the closing brace
document.getElementById('flip-card').addEventListener('click', function() {
    document.querySelector('.card').classList.toggle('flipped');
}); 