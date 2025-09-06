"""
Orchestra Agent VAD Integration
===============================

This module integrates VAD (Voice Activity Detection) with the existing 
orchestra agent, replacing spacebar-triggered recording with natural conversation.
"""

import os
import sys
import asyncio
from typing import Optional, Dict, Any
import importlib.util

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

class OrchestratVADIntegration:
    """Main class to integrate VAD with orchestra agent"""
    
    def __init__(self):
        self.vad_handler = None
        self.original_agent = None
        self.is_vad_active = False
    
    async def initialize_vad_system(self):
        """Initialize the VAD system"""
        try:
            from vad_audio_handler import VADAudioHandler, VADConfig
            
            # Configure VAD for optimal TARA interaction
            config = VADConfig(
                # Audio settings
                sample_rate=16000,
                chunk_duration_ms=30,
                
                # VAD sensitivity (2 = moderate, good for most environments)
                vad_aggressiveness=2,
                voice_threshold=0.3,  # 30% of frames must be speech (more sensitive)
                
                # Timing settings - optimized for faster response
                silence_timeout=1.2,      # 1.2s silence to end recording (faster)
                min_recording_duration=0.5,  # At least 0.5s of speech
                max_recording_duration=10.0, # Max 10s recording (reduced from 20s)
                
                # Audio processing
                pre_speech_buffer=0.2,    # 0.2s before speech starts
                post_speech_buffer=0.3,   # 0.3s after speech ends
                noise_gate_threshold=0.008,  # Noise gate
                
                # Language settings
                stt_language="hi-IN",
                tts_language="hi-IN",
                tts_speaker="anushka"
            )
            
            self.vad_handler = VADAudioHandler(config)
            print("✅ VAD system initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ VAD initialization failed: {e}")
            return False
    
    async def replace_spacebar_interaction(self):
        """
        Replace spacebar-based interaction with natural VAD conversation
        This is the main function to use instead of spacebar loops
        """
        if not self.vad_handler:
            if not await self.initialize_vad_system():
                print("❌ Cannot start VAD conversation")
                return
        
        print("🎙️ Starting Natural Conversation Mode")
        print("=" * 50)
        print("💡 Instructions:")
        print("   • TARA will greet you first")
        print("   • Just speak naturally when you want to ask something")
        print("   • Wait for TARA to finish speaking before responding")
        print("   • Press Ctrl+C anytime to end conversation")
        print("   • No spacebar needed - just talk!")
        print()
        
        try:
            # Start the natural conversation
            await self.vad_handler.start_conversation_mode()
            
        except KeyboardInterrupt:
            print("\\n🛑 Conversation ended by user")
        except Exception as e:
            print(f"\\n❌ Error in conversation: {e}")
        finally:
            self.cleanup()
    
    async def single_vad_capture(self) -> Optional[str]:
        """
        Capture a single utterance using VAD (replaces single spacebar capture)
        Returns the transcript or None if failed
        """
        if not self.vad_handler:
            if not await self.initialize_vad_system():
                return None
        
        print("👂 Listening for your voice... (speak naturally)")
        
        try:
            # Use a simplified version for single capture
            return await self._capture_single_utterance_vad()
            
        except Exception as e:
            print(f"❌ VAD capture error: {e}")
            return None
    
    async def _capture_single_utterance_vad(self) -> Optional[str]:
        """Internal method to capture single utterance with VAD"""
        import sounddevice as sd
        import numpy as np
        import time
        
        # Audio collection settings
        sample_rate = 16000
        frame_duration = 0.03  # 30ms frames
        frame_size = int(sample_rate * frame_duration)
        
        # VAD state
        speech_frames = []
        silence_frames = []
        recording_started = False
        speech_detected = False
        
        # Timing
        max_wait_time = 10.0  # Wait up to 10s for speech to start
        max_silence_time = 2.0  # 2s of silence to end
        start_time = time.time()
        speech_start_time = None
        last_speech_time = None
        
        audio_queue = asyncio.Queue()
        
        def callback(indata, frames, time_info, status):
            audio_queue.put_nowait(indata.copy())
        
        # Start audio stream
        stream = sd.InputStream(
            callback=callback,
            samplerate=sample_rate,
            channels=1,
            dtype='float32',
            blocksize=frame_size
        )
        
        stream.start()
        
        try:
            while True:
                current_time = time.time()
                
                # Check timeout
                if not speech_detected and (current_time - start_time) > max_wait_time:
                    print("⏱️ Timeout waiting for speech")
                    break
                
                # Get audio frame
                try:
                    frame = await asyncio.wait_for(audio_queue.get(), timeout=0.1)
                    frame_data = frame.flatten()
                    
                    # Convert to bytes for VAD
                    frame_int16 = (frame_data * 32767).astype(np.int16)
                    frame_bytes = frame_int16.tobytes()
                    
                    # Check for speech with VAD
                    is_speech = self.vad_handler.processor.is_speech_frame(frame_bytes)
                    
                    if is_speech:
                        speech_frames.append(frame_data)
                        silence_frames.clear()
                        
                        if not speech_detected:
                            speech_detected = True
                            speech_start_time = current_time
                            print("🗣️ Speech detected, recording...")
                        
                        last_speech_time = current_time
                        
                    else:
                        if speech_detected:
                            silence_frames.append(frame_data)
                            
                            # Check if we have enough silence to end
                            silence_duration = len(silence_frames) * frame_duration
                            if silence_duration >= max_silence_time:
                                print("🔇 Speech ended")
                                break
                
                except asyncio.TimeoutError:
                    continue
                
        finally:
            stream.stop()
            stream.close()
        
        # Process collected speech
        if speech_frames:
            # Combine all speech frames
            all_frames = speech_frames + silence_frames[:int(0.3/frame_duration)]  # Add some silence
            audio_data = np.concatenate(all_frames)
            
            duration = len(audio_data) / sample_rate
            print(f"📝 Captured {duration:.2f}s of speech")
            
            if duration >= 0.5:  # Minimum speech duration
                # Save and transcribe
                audio_file = self.vad_handler._save_audio_to_file(audio_data)
                if audio_file:
                    transcript_result = await self.vad_handler.audio_handler.transcribe_audio(audio_file)
                    
                    if transcript_result.get("success"):
                        transcript = transcript_result.get("transcript", "").strip()
                        if transcript:
                            print(f"📝 Transcript: {transcript}")
                            return transcript
        
        print("❌ No valid speech captured")
        return None
    
    def cleanup(self):
        """Cleanup VAD resources"""
        if self.vad_handler:
            self.vad_handler.cleanup()

# Direct replacement functions for existing codebase
async def vad_capture_audio() -> Optional[str]:
    """
    Direct replacement for capture_spacebar_audio()
    Returns WAV file path (not transcript) for compatibility with existing code
    """
    import tempfile
    import sounddevice as sd
    import soundfile as sf
    import numpy as np
    import time
    
    try:
        # Import VAD processor
        from vad_audio_handler import VADAudioProcessor, VADConfig
        
        config = VADConfig(
            sample_rate=16000,
            chunk_duration_ms=30,
            vad_aggressiveness=1,  # More sensitive (0=most sensitive, 3=least sensitive)
            voice_threshold=0.25,  # Even lower threshold for faster detection
            silence_timeout=1.0,   # Reduced to 1 second for faster response
            min_recording_duration=0.3,  # Shorter minimum for quick responses
            max_recording_duration=15.0  # Reduced max duration
        )
        
        processor = VADAudioProcessor(config)
        print("🎤 VAD initialized: aggressiveness=2, frame_size=480")
        
        # Audio collection
        audio_data = []
        recording_active = False
        speech_detected = False
        last_speech_time = None
        start_time = time.time()
        
        def audio_callback(indata, frames, time_info, status):
            nonlocal audio_data, recording_active, speech_detected, last_speech_time
            
            if status:
                print(f"⚠️ Audio callback status: {status}")
            
            # Add to buffer
            audio_data.append(indata.copy())
            
            # VAD processing - convert to int16 for VAD
            frame_data = (indata.flatten() * 32767).astype(np.int16)
            
            try:
                # Convert frame to bytes for VAD
                frame_bytes = frame_data.tobytes()
                
                # Check if frame has sufficient length for VAD
                expected_bytes = int(config.sample_rate * config.chunk_duration_ms / 1000) * 2
                if len(frame_bytes) >= expected_bytes:
                    frame_for_vad = frame_bytes[:expected_bytes]
                    is_speech = processor.is_speech_frame(frame_for_vad)
                    
                    if is_speech and not speech_detected:
                        speech_detected = True
                        recording_active = True
                        print("🗣️ Speech detected!")
                    
                    if is_speech:
                        last_speech_time = time.time()  # Use time module, not callback parameter
                else:
                    # For short frames, use simple energy detection as fallback
                    energy = np.mean(np.abs(frame_data))
                    is_speech = energy > 1000  # Threshold for int16 audio
                    
                    if is_speech and not speech_detected:
                        speech_detected = True
                        recording_active = True
                        print("🗣️ Speech detected (energy)!")
                    
                    if is_speech:
                        last_speech_time = time.time()
                        
            except Exception as e:
                # Fallback to energy-based detection
                energy = np.mean(np.abs(frame_data))
                is_speech = energy > 1000
                
                if is_speech and not speech_detected:
                    speech_detected = True
                    recording_active = True
                    print("🗣️ Speech detected (fallback)!")
                
                if is_speech:
                    last_speech_time = time.time()
        
        # Start audio stream
        stream = sd.InputStream(
            callback=audio_callback,
            samplerate=config.sample_rate,
            channels=1,
            dtype=np.float32,
            blocksize=int(config.sample_rate * config.chunk_duration_ms / 1000)
        )
        
        print("🎧 Listening... (speak now)")
        
        with stream:
            # Wait for speech to start (max 8 seconds with progress indicators)
            wait_time = 0
            max_wait = 8.0  # Reduced from 15s to 8s
            
            while not speech_detected and wait_time < max_wait:
                await asyncio.sleep(0.3)  # Check more frequently
                wait_time += 0.3
                
                # Show progress every 2 seconds (more frequent updates)
                if int(wait_time) % 2 == 0 and wait_time > 0:
                    remaining = int(max_wait - wait_time)
                    print(f"👂 Still listening... ({remaining}s remaining)")
            
            if not speech_detected:
                print("⏰ No speech detected within timeout")
                # Return a very short silent audio file as fallback
                return await create_silent_audio_file()
                
            print("🗣️ Speech detected! Recording...")
            
            # Continue recording until silence detected
            while recording_active and (time.time() - start_time) < config.max_recording_duration:
                await asyncio.sleep(0.05)  # Check more frequently (50ms instead of 100ms)
                
                # Check if we have enough silence to stop
                if speech_detected and last_speech_time:
                    silence_duration = time.time() - last_speech_time
                    if silence_duration > config.silence_timeout:
                        print(f"✋ Silence detected ({silence_duration:.1f}s), stopping recording")
                        recording_active = False
                        break
                    
                    # Show progress every 3 seconds while recording
                    elapsed = time.time() - start_time
                    if int(elapsed) % 3 == 0 and elapsed > 3:
                        remaining = config.max_recording_duration - elapsed
                        print(f"🎤 Still recording... ({remaining:.0f}s max remaining)")
        
        if not audio_data:
            print("❌ No audio data captured")
            return None
            
        # Save to temporary file
        audio_array = np.concatenate(audio_data, axis=0).flatten()
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(
            prefix="vad_capture_",
            suffix=".wav",
            delete=False
        )
        temp_path = temp_file.name
        temp_file.close()
        
        # Save audio data
        sf.write(temp_path, audio_array, config.sample_rate)
        
        duration = len(audio_array) / config.sample_rate
        print(f"📁 Audio saved: {duration:.2f}s → {temp_path}")
        
        return temp_path
        
    except Exception as e:
        print(f"❌ VAD capture failed: {e}")
        import traceback
        traceback.print_exc()
        return None

async def create_silent_audio_file() -> str:
    """Create a short silent audio file as fallback"""
    import tempfile
    import soundfile as sf
    import numpy as np
    
    # Create 0.5 seconds of silence
    sample_rate = 16000
    duration = 0.5
    samples = int(sample_rate * duration)
    silence = np.zeros(samples, dtype=np.float32)
    
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(
        prefix="silent_fallback_",
        suffix=".wav",
        delete=False
    )
    temp_path = temp_file.name
    temp_file.close()
    
    # Save silence
    sf.write(temp_path, silence, sample_rate)
    print(f"🔇 Created silent fallback: {temp_path}")
    
    return temp_path

async def start_vad_conversation():
    """
    Direct replacement for main conversation loops
    Starts continuous VAD-based conversation
    """
    integration = OrchestratVADIntegration()
    await integration.replace_spacebar_interaction()

# Migration helper for existing orchestra agent
def create_orchestra_vad_patch():
    """
    Create a patch function that can be applied to existing orchestra agent
    """
    
    patch_instructions = '''
🔧 ORCHESTRA AGENT VAD PATCH
===========================

1. IMPORT CHANGES:
------------------
Add at the top of orchestra_agent_past.py:

# VAD Integration
from orchestra_vad_integration import vad_capture_audio, start_vad_conversation

2. REPLACE SPACEBAR FUNCTIONS:
------------------------------
OLD:
    wav_path = capture_spacebar_audio()
    transcript = transcribe_file(wav_path)

NEW:
    transcript = await vad_capture_audio()

3. REPLACE MAIN CONVERSATION LOOPS:
-----------------------------------
OLD:
    while True:
        wav_path = capture_spacebar_audio()
        # ... process audio

NEW:
    # Start natural VAD conversation
    await start_vad_conversation()

4. UPDATE MAIN FUNCTION:
------------------------
OLD:
    def main():
        # ... spacebar interaction

NEW:
    async def main():
        await start_vad_conversation()
        
    if __name__ == "__main__":
        asyncio.run(main())

5. INDIVIDUAL CAPTURE REPLACEMENTS:
-----------------------------------
Replace ALL instances of:
- capture_spacebar_audio() → await vad_capture_audio()
- Any spacebar-related print statements → VAD equivalents

BENEFITS:
✅ Natural conversation flow
✅ No manual button pressing
✅ Better user experience  
✅ Automatic speech detection
✅ Seamless integration with existing pipeline
    '''
    
    return patch_instructions

# Test and demonstration
async def demonstrate_vad_integration():
    """Demonstrate VAD integration capabilities"""
    
    print("🎙️ VAD Integration Demonstration")
    print("=" * 40)
    
    integration = OrchestratVADIntegration()
    
    if await integration.initialize_vad_system():
        print("\\n✅ VAD system ready!")
        
        print("\\nChoose demo mode:")
        print("1. Single utterance capture (replaces spacebar)")
        print("2. Continuous conversation (replaces conversation loops)")
        print("3. Show migration guide")
        
        try:
            choice = input("\\nEnter choice (1-3): ").strip()
            
            if choice == "1":
                print("\\n🎤 Single Utterance Demo")
                print("Speak something...")
                transcript = await integration.single_vad_capture()
                print(f"\\n📝 Captured: {transcript}")
                
            elif choice == "2":
                print("\\n💬 Starting continuous conversation demo...")
                await integration.replace_spacebar_interaction()
                
            elif choice == "3":
                print("\\n" + create_orchestra_vad_patch())
                
            else:
                print("❌ Invalid choice")
                
        except KeyboardInterrupt:
            print("\\n🛑 Demo stopped")
        finally:
            integration.cleanup()
    else:
        print("❌ VAD system initialization failed")

# Main entry point
if __name__ == "__main__":
    try:
        asyncio.run(demonstrate_vad_integration())
    except KeyboardInterrupt:
        print("\\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error: {e}")
