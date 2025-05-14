class PomodoroTimer {
    constructor() {
        this.secondsElapsed = 0;
        this.timerId = null;
        this.isRunning = false;
        this.lastBreakTime = 0;
        this.selectedBreakTime = null;
        this.isRestMode = false;
        this.savedTime = 0;
        this.startTime = null; // Add startTime to track when timer started
        
        // Sound settings
        this.soundEnabled = true;
        this.volume = 0.5;
        
        // DOM Elements
        this.timeDisplay = document.querySelector('.time-display');
        this.breakCountdown = document.getElementById('break-countdown');
        this.breakTimer = document.querySelector('.break-timer');
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
                // If in rest mode, update the break timer display and start the timer
                if (this.isRestMode) {
                    const breakMinutes = Math.floor(this.selectedBreakTime / 60);
                    const breakSeconds = this.selectedBreakTime % 60;
                    this.breakTimer.textContent = `break ends in ${breakMinutes.toString().padStart(2, '0')}:${breakSeconds.toString().padStart(2, '0')}`;
                    this.start(); // Start the timer when a time is selected in rest mode
                }
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
        
        // Handle volume changes
        const updateVolume = (e) => {
            this.volume = e.target.value / 100;
            this.magicalSound.volume = this.volume;
        };

        // Update volume while sliding
        this.volumeSlider.addEventListener('input', updateVolume);
        
        // Play test sound only when sliding ends
        this.volumeSlider.addEventListener('change', (e) => {
            updateVolume(e);
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
        
        // If in rest mode, update the break timer display and start the break timer
        if (this.isRestMode) {
            const breakMinutes = Math.floor(this.selectedBreakTime / 60);
            const breakSeconds = this.selectedBreakTime % 60;
            this.breakTimer.textContent = `break ends in ${breakMinutes.toString().padStart(2, '0')}:${breakSeconds.toString().padStart(2, '0')}`;
            this.startBreakTimer(); // Start the break timer when a time is selected in rest mode
        }
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
            this.toggleButton.textContent = 'Enter Pain Cave';
            this.toggleButton.style.backgroundColor = '#ff8900';
            this.toggleButton.style.color = 'white';
            this.restModeButton.textContent = 'Start Chillin';
            document.querySelector('.container').classList.add('in-rest-mode');
            document.querySelector('.container').classList.remove('in-cave');
            // Show timer in rest mode with light teal color
            this.timeDisplay.style.display = 'block';
            this.timeDisplay.style.color = 'rgba(255, 255, 255, 0.7)';
            // Hide break countdown and show break timer
            this.breakCountdown.parentElement.style.display = 'none';
            this.breakTimer.style.display = 'block';
            // Change break button text
            this.collapseToggle.textContent = 'End break after...';
            
            // If a break time is selected, start the break timer
            if (this.selectedBreakTime !== null) {
                this.startBreakTimer();
            }
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
            // Remove inline color style from timer
            this.timeDisplay.style.color = '';
            // Show timers
            this.timeDisplay.style.display = 'block';
            this.breakCountdown.parentElement.style.display = 'block';
            this.breakTimer.style.display = 'none';
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
            // Remove inline color style from timer
            this.timeDisplay.style.color = '';
            // Show timers
            this.timeDisplay.style.display = 'block';
            this.breakCountdown.parentElement.style.display = 'block';
            this.breakTimer.style.display = 'none';
        } else {
            // Exit pain cave
            this.pause();
            // Save the current time before exiting
            this.savedTime = this.secondsElapsed;
            this.toggleButton.textContent = 'Enter Pain Cave';
            this.toggleButton.style.backgroundColor = '#ff8900';
            this.toggleButton.style.color = 'white';
            document.querySelector('.container').classList.remove('in-cave');
            // Remove inline color style from timer
            this.timeDisplay.style.color = '';
            // Show timers
            this.timeDisplay.style.display = 'block';
            this.breakCountdown.parentElement.style.display = 'block';
            this.breakTimer.style.display = 'none';
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
    
    startBreakTimer() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = new Date(); // Record start time
            
            const updateTimer = () => {
                if (!this.isRunning) return;
                
                // Calculate elapsed time based on actual time passed
                const now = new Date();
                const elapsed = Math.floor((now - this.startTime) / 1000);
                this.secondsElapsed = elapsed;
                
                if (this.isRestMode) {
                    // Only update the break timer display in rest mode
                    const timeUntilEnd = this.selectedBreakTime - (this.secondsElapsed - this.savedTime);
                    if (timeUntilEnd > 0) {
                        const breakMinutes = Math.floor(timeUntilEnd / 60);
                        const breakSeconds = timeUntilEnd % 60;
                        this.breakTimer.textContent = `break ends in ${breakMinutes.toString().padStart(2, '0')}:${breakSeconds.toString().padStart(2, '0')}`;
                    } else {
                        this.breakTimer.textContent = 'break ends in --:--';
                        this.pause();
                    }
                }
                
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
                    this.pause();
                    
                    if (this.soundEnabled) {
                        this.magicalSound.currentTime = 0;
                        this.magicalSound.play().catch(error => {
                            console.log('Error playing sound:', error);
                        });
                    }
                }
                
                this.timerId = requestAnimationFrame(updateTimer);
            };
            
            this.timerId = requestAnimationFrame(updateTimer);
        }
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = new Date(); // Record start time
            // Adjust startTime to account for existing elapsed time
            this.startTime = new Date(new Date().getTime() - (this.secondsElapsed * 1000));
            
            const updateTimer = () => {
                if (!this.isRunning) return;
                
                // Calculate elapsed time based on actual time passed
                const now = new Date();
                const elapsed = Math.floor((now - this.startTime) / 1000);
                this.secondsElapsed = elapsed;
                
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
                    this.pause();
                    
                    if (this.soundEnabled) {
                        this.magicalSound.currentTime = 0;
                        this.magicalSound.play().catch(error => {
                            console.log('Error playing sound:', error);
                        });
                    }
                }
                
                this.timerId = requestAnimationFrame(updateTimer);
            };
            
            this.timerId = requestAnimationFrame(updateTimer);
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            cancelAnimationFrame(this.timerId);
        }
    }
    
    reset() {
        this.pause();
        this.secondsElapsed = 0;
        this.lastBreakTime = 0;
        this.selectedBreakTime = null; // Clear break time selection
        this.isRestMode = false; // Reset rest mode state
        this.updateDisplay();
        this.toggleButton.textContent = 'Enter Pain Cave';
        this.toggleButton.style.backgroundColor = '#ff8900'; // Orange
        this.toggleButton.style.color = 'white';
        this.restModeButton.textContent = 'Rest Mode';
        this.breakCountdown.textContent = '--:--';
        document.querySelector('.container').classList.remove('in-cave', 'in-rest-mode'); // Exit both pain cave and rest mode states
        // Remove inline color style from timer
        this.timeDisplay.style.color = '';
        // Show timers
        this.timeDisplay.style.display = 'block';
        this.breakCountdown.parentElement.style.display = 'block';
        // Reset break time selection
        this.breakRadios.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('.break-toggle').querySelector('.custom-radio').classList.remove('checked');
        });
        this.customTimeInput.value = '10';
        this.customTimeInput.disabled = true;
        // Reset cave image
        this.caveImage.src = 'images/PAIN CAVE.png';
        this.caveImage.alt = 'Pain Cave';
        // Reset break button text
        this.collapseToggle.textContent = 'Take a break after...';
    }
    
    updateDisplay() {
        const totalSeconds = this.secondsElapsed;
        let timeString;
        
        if (totalSeconds >= 3600) {
            // Format as HH:MM:SS when over 60 minutes
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            // Format as MM:SS when under 60 minutes
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        this.timeDisplay.textContent = timeString;
        
        // Update browser tab title with timer
        document.title = `${timeString} - Pain Cave`;
        
        // Update break countdown only in pain cave mode
        if (this.selectedBreakTime !== null && !this.isRestMode) {
            const timeUntilBreak = this.selectedBreakTime - (this.secondsElapsed - this.lastBreakTime);
            if (timeUntilBreak > 0) {
                const breakMinutes = Math.floor(timeUntilBreak / 60);
                const breakSeconds = timeUntilBreak % 60;
                this.breakCountdown.textContent = `${breakMinutes.toString().padStart(2, '0')}:${breakSeconds.toString().padStart(2, '0')}`;
            } else {
                this.breakCountdown.textContent = '--:--';
            }
        }
        
        // Update break timer only in rest mode
        if (this.isRestMode && this.selectedBreakTime !== null) {
            const timeUntilEnd = this.selectedBreakTime - (this.secondsElapsed - this.savedTime);
            if (timeUntilEnd > 0) {
                const breakMinutes = Math.floor(timeUntilEnd / 60);
                const breakSeconds = timeUntilEnd % 60;
                this.breakTimer.textContent = `break ends in ${breakMinutes.toString().padStart(2, '0')}:${breakSeconds.toString().padStart(2, '0')}`;
            } else {
                this.breakTimer.textContent = 'break ends in --:--';
            }
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