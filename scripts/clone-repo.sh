#!/bin/bash

# Function to check if npm is available
has_npm() {
  command -v npm >/dev/null 2>&1
}

# Function to check if yarn is available
has_yarn() {
  command -v yarn >/dev/null 2>&1
}

# Check if npm is available, otherwise try yarn
if has_npm; then
  echo "Using npm for installation...😃"
  npm install
  echo "Packages installed successfully."
elif has_yarn; then
  echo "Using yarn for installation...😃"
  yarn install
  echo "Packages installed successfully.😃"
else
  echo "Neither npm nor yarn found on your system. Please install one of them and try again."
fi
