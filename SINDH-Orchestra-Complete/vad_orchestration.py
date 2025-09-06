"""
Enhanced VAD Integration Module
===============================

This module provides multiple VAD options and integrates seamlessly with 
the existing SINDH Orchestra Agent system.

Supported VAD methods:
1. WebRTC VAD (built-in, reliable)
2. LiveKit VAD (optional, more advanced)
3. Custom energy-based VAD (fallback)
"""

import os
import asyncio
import numpy as np
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import sounddevice as sd
from enum import Enum

class VADMethod(Enum):
    WEBRTC = "webrtc"
    LIVEKIT = "livekit"
    ENERGY = "energy"
    AUTO = "auto"

@dataclass
class VADSettings:
    """Settings for VAD system"""
    method: VADMethod = VADMethod.AUTO
    sensitivity: float = 0.6  # 0.0 to 1.0
    silence_timeout: float = 1.5  # seconds
    min_speech_duration: float = 0.5  # seconds
    max_speech_duration: float = 30.0  # seconds

class EnhancedVADHandler:
    """Enhanced VAD handler with multiple detection methods"""
    
    def __init__(self, settings: VADSettings = None):
        self.settings = settings or VADSettings()
        self.vad_engine = None
        self._initialize_vad()
    
    def _initialize_vad(self):
        """Initialize the appropriate VAD engine"""
        if self.settings.method == VADMethod.AUTO:
            # Try LiveKit first, fallback to WebRTC, then energy-based
            if self._try_initialize_livekit():
                self.settings.method = VADMethod.LIVEKIT
                print("🎙️ Using LiveKit VAD")
            elif self._try_initialize_webrtc():
                self.settings.method = VADMethod.WEBRTC
                print("🎙️ Using WebRTC VAD")
            else:
                self.settings.method = VADMethod.ENERGY
                print("🎙️ Using Energy-based VAD")
        
        elif self.settings.method == VADMethod.LIVEKIT:
            if not self._try_initialize_livekit():
                print("⚠️ LiveKit VAD not available, falling back to WebRTC")
                self._try_initialize_webrtc()
        
        elif self.settings.method == VADMethod.WEBRTC:
            if not self._try_initialize_webrtc():
                print("⚠️ WebRTC VAD not available, falling back to Energy-based")
                self.settings.method = VADMethod.ENERGY
    
    def _try_initialize_livekit(self) -> bool:
        """Try to initialize LiveKit VAD"""
        try:
            # Note: LiveKit VAD would need to be integrated here
            # For now, we'll use a placeholder that returns False
            return False
        except ImportError:
            return False
    
    def _try_initialize_webrtc(self) -> bool:
        """Try to initialize WebRTC VAD"""
        try:
            import webrtcvad
            aggressiveness = int(self.settings.sensitivity * 3)  # 0-3 scale
            self.vad_engine = webrtcvad.Vad(aggressiveness)
            return True
        except ImportError:
            return False
    
    def detect_speech(self, audio_chunk: bytes, sample_rate: int) -> bool:
        """Detect speech in audio chunk"""
        if self.settings.method == VADMethod.WEBRTC:
            return self._webrtc_detect(audio_chunk, sample_rate)
        elif self.settings.method == VADMethod.LIVEKIT:
            return self._livekit_detect(audio_chunk, sample_rate)
        else:
            return self._energy_detect(audio_chunk, sample_rate)
    
    def _webrtc_detect(self, audio_chunk: bytes, sample_rate: int) -> bool:
        """WebRTC VAD detection"""
        try:
            return self.vad_engine.is_speech(audio_chunk, sample_rate)
        except:
            return False
    
    def _livekit_detect(self, audio_chunk: bytes, sample_rate: int) -> bool:
        """LiveKit VAD detection (placeholder)"""
        # Implementation would go here when LiveKit is integrated
        return self._energy_detect(audio_chunk, sample_rate)
    
    def _energy_detect(self, audio_chunk: bytes, sample_rate: int) -> bool:
        """Energy-based VAD fallback"""
        # Convert bytes to numpy array
        audio_data = np.frombuffer(audio_chunk, dtype=np.int16).astype(np.float32) / 32767.0
        
        # Calculate RMS energy
        rms = np.sqrt(np.mean(audio_data ** 2))
        
        # Simple threshold-based detection
        threshold = 0.01 * self.settings.sensitivity
        return rms > threshold

# Modified orchestra agent integration
async def replace_spacebar_with_vad():
    """
    Integration function to replace existing spacebar mechanism with VAD
    This modifies the existing orchestra agent to use VAD instead of spacebar
    """
    print("🔄 Replacing spacebar mechanism with VAD...")
    
    # Import VAD handler
    from vad_audio_handler import VADAudioHandler, VADConfig
    
    # Create VAD configuration
    vad_config = VADConfig(
        vad_aggressiveness=2,  # Moderate sensitivity
        silence_timeout=1.5,   # 1.5s of silence to stop recording
        voice_threshold=0.6    # 60% of frames must be speech
    )
    
    # Initialize VAD handler
    vad_handler = VADAudioHandler(vad_config)
    
    print("✅ VAD system ready!")
    print("💡 TARA will now listen naturally - no need to hold spacebar")
    
    return vad_handler

# Integration with existing codebase
class VADOrchestrationManager:
    """
    Manager class to orchestrate VAD with existing TARA systems
    """
    
    def __init__(self):
        self.vad_handler = None
        self.is_active = False
        
    async def initialize(self):
        """Initialize VAD system"""
        try:
            from vad_audio_handler import VADAudioHandler, VADConfig
            
            config = VADConfig(
                vad_aggressiveness=2,
                silence_timeout=1.5,
                min_recording_duration=0.5,
                max_recording_duration=30.0
            )
            
            self.vad_handler = VADAudioHandler(config)
            print("🎙️ VAD Orchestration Manager initialized")
            return True
            
        except Exception as e:
            print(f"❌ Failed to initialize VAD: {e}")
            return False
    
    async def start_natural_conversation(self):
        """Start natural conversation mode"""
        if not self.vad_handler:
            if not await self.initialize():
                print("❌ Cannot start conversation - VAD initialization failed")
                return
        
        print("🗣️ Starting natural conversation with TARA...")
        print("💬 Just speak when you want to talk - TARA is listening!")
        
        self.is_active = True
        
        try:
            await self.vad_handler.start_conversation_mode()
        except KeyboardInterrupt:
            print("🛑 Conversation stopped by user")
        finally:
            self.is_active = False
    
    def stop_conversation(self):
        """Stop conversation mode"""
        self.is_active = False
        if self.vad_handler:
            asyncio.create_task(self.vad_handler.stop_conversation_mode())
    
    async def process_single_utterance(self) -> Optional[str]:
        """
        Process a single user utterance using VAD
        This can replace individual spacebar captures
        """
        if not self.vad_handler:
            if not await self.initialize():
                return None
        
        print("👂 Listening for your voice...")
        
        # Implementation would involve collecting audio until speech ends
        # This is a simplified version - full implementation in vad_audio_handler.py
        
        try:
            # Collect audio with VAD detection
            audio_data = await self._collect_single_utterance()
            
            if audio_data:
                # Process through existing STT pipeline
                transcript_result = await self.vad_handler.audio_handler.transcribe_audio(audio_data)
                
                if transcript_result.get("success"):
                    return transcript_result.get("transcript", "").strip()
            
        except Exception as e:
            print(f"❌ Error processing utterance: {e}")
        
        return None
    
    async def _collect_single_utterance(self) -> Optional[str]:
        """Collect a single utterance using VAD"""
        # This would implement the core VAD collection logic
        # For now, return None - full implementation in main VAD handler
        return None

# Quick migration helper
def create_vad_migration_guide():
    """Create a migration guide for replacing spacebar with VAD"""
    
    migration_guide = """
🔄 VAD MIGRATION GUIDE
=====================

STEP 1: Replace spacebar imports
OLD: from orchestra_agent_past import capture_spacebar_audio
NEW: from vad_orchestration import VADOrchestrationManager

STEP 2: Replace spacebar calls
OLD: wav_path = capture_spacebar_audio()
NEW: 
    vad_manager = VADOrchestrationManager()
    transcript = await vad_manager.process_single_utterance()

STEP 3: Replace conversation loops
OLD: 
    while True:
        wav_path = capture_spacebar_audio()
        # process audio...
        
NEW:
    vad_manager = VADOrchestrationManager()
    await vad_manager.start_natural_conversation()

STEP 4: Update main function
OLD:
    def main():
        # spacebar-based interaction
        
NEW:
    async def main():
        vad_manager = VADOrchestrationManager()
        await vad_manager.start_natural_conversation()

BENEFITS:
✅ Natural conversation flow
✅ No manual button pressing required
✅ Better user experience
✅ Automatic speech detection
✅ Configurable sensitivity
✅ Multiple VAD engine support
    """
    
    return migration_guide

# Main entry point for testing
async def main():
    """Main function to test VAD integration"""
    print("🎙️ VAD Integration Test")
    print("=" * 30)
    
    # Test VAD orchestration manager
    manager = VADOrchestrationManager()
    
    if await manager.initialize():
        print("✅ VAD system initialized successfully")
        
        print("\\nChoose test mode:")
        print("1. Single utterance test")
        print("2. Continuous conversation test")
        
        choice = input("Enter choice (1 or 2): ").strip()
        
        if choice == "1":
            print("\\n🎤 Single utterance test")
            transcript = await manager.process_single_utterance()
            print(f"📝 Result: {transcript}")
            
        elif choice == "2":
            print("\\n💬 Starting continuous conversation...")
            await manager.start_natural_conversation()
        
        else:
            print("❌ Invalid choice")
    
    else:
        print("❌ VAD initialization failed")

if __name__ == "__main__":
    # Print migration guide
    print(create_vad_migration_guide())
    print()
    
    # Run test
    asyncio.run(main())
