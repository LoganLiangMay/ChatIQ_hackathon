#!/bin/bash

# Permanent macOS File Limit Fix for Metro Bundler
# This script increases the system-wide file descriptor limits

echo "🔧 Increasing macOS File Limits for Metro Bundler"
echo "================================================"
echo ""
echo "This script will permanently increase file watching limits on macOS."
echo "You will be asked for your password (for sudo commands)."
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

echo "Setting system-wide file limits..."
echo ""

# Set system-wide file limits
sudo launchctl limit maxfiles 65536 200000

# Update /etc/sysctl.conf
if [ ! -f /etc/sysctl.conf ]; then
  echo "Creating /etc/sysctl.conf..."
  sudo touch /etc/sysctl.conf
fi

# Add settings if not already present
if ! grep -q "kern.maxfiles" /etc/sysctl.conf 2>/dev/null; then
  echo "kern.maxfiles=65536" | sudo tee -a /etc/sysctl.conf
fi

if ! grep -q "kern.maxfilesperproc" /etc/sysctl.conf 2>/dev/null; then
  echo "kern.maxfilesperproc=65536" | sudo tee -a /etc/sysctl.conf
fi

# Apply settings immediately
sudo sysctl -w kern.maxfiles=65536
sudo sysctl -w kern.maxfilesperproc=65536

echo ""
echo "✅ System-wide file limits increased:"
sudo launchctl limit maxfiles
echo ""

# Add ulimit to shell config
if [ -f ~/.zshrc ]; then
  if ! grep -q "ulimit -n 10240" ~/.zshrc; then
    echo ""  >> ~/.zshrc
    echo "# Increase file limit for Metro bundler" >> ~/.zshrc
    echo "ulimit -n 10240" >> ~/.zshrc
    echo "✅ Added ulimit to ~/.zshrc"
  else
    echo "✅ ulimit already in ~/.zshrc"
  fi
fi

# Apply to current session
ulimit -n 10240
echo "✅ File limit for this session: $(ulimit -n)"
echo ""

echo "================================================"
echo "🎉 macOS file limits permanently increased!"
echo ""
echo "These limits will persist across restarts."
echo "All future terminal sessions will have increased limits."
echo ""
echo "You can now run: npx expo start"
echo "================================================"

