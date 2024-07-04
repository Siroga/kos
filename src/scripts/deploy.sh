#!/bin/bash

# Define the log file path
LOG_FILE="/var/www/html/error.log"
SUCCESS_FILE="/var/www/html/success.log"

# Function to log errors
log_error() {
    local message="$1"
    local timestamp="$(date +'%Y-%m-%d %H:%M:%S')"
    echo "[$timestamp] ERROR: $message" >> "$LOG_FILE"
}

log_success() {
    local message="$1"
    local timestamp="$(date +'%Y-%m-%d %H:%M:%S')"
    echo "[$timestamp] Success: $message" >> "$SUCCESS_FILE"
}

FOLDER="/home/user/kos"

# Check if the folder exists
if [ -d "$FOLDER" ]; then
    echo "Folder $FOLDER exists."
else
    echo "Folder $FOLDER does not exist."
    mkdir "$FOLDER" || { log_error "Failed to create directory"; exit 1; }
fi

# Change directory
cd "$FOLDER" || { log_error "Failed to change directory to $FOLDER"; exit 1; }

# If directory is not empty, fetch changes
if [ "$(ls -A)" ]; then
    # Fetch changes from the Git repository
    git fetch origin main || { log_error "Failed to fetch changes from Git repository"; exit 1; }
    git reset --hard origin/main || { log_error "Failed to reset local changes"; exit 1; }
else
    # Clone the repository if directory is empty
    git clone https://github.com/Siroga/kos.git . || { log_error "Failed to clone repository"; exit 1; }
fi

npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1

# Check if the application is already running
if pm2 list | grep -q "kos"; then
    pm2 restart "kos" || { log_error "Failed to restart the application with PM2"; exit 1; }
else
    pm2 start npm --name "kos" -- start || { log_error "Failed to start the application with PM2"; exit 1; }
fi

# Save PM2 process list
pm2 save || { log_error "Failed to save PM2 process list"; exit 1; }

log_success "Deployment successful"
