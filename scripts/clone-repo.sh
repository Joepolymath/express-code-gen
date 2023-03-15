#!/bin/bash

mkdir testing

cd testing

echo "Project structure downloading and structuring..."

git clone git@github.com:Joepolymath/baseNodeServer.git .

echo "Installing packages..."

exec npm install

echo "Packages installed successfully"