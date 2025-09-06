"""
Simple VAD Audio Capture - Direct Spacebar Replacement
======================================================

This module provides a simple drop-in replacement for capture_spacebar_audio()
that automatically detects when user starts and stops speaking.

No complex workflows - just automatic speech detection instead of spacebar.
"""

import os
import sys
import asyncio
import tempfile
import time
import numpy as np
import sounddevice as sd
import soundfile as sf
from typing import Optional

# Add current directory for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

async def simple_vad_capture() -> Optional[str]:
    """
    Simple automatic speech detection - replaces spacebar functionality
    Returns WAV file path just like the original capture_spacebar_audio()
    """
    try:
        from vad_audio_handler import VADAudioProcessor, VADConfig
        
        # Simple configuration for quick response
        config = VADConfig(
            sample_rate=16000,
            chunk_duration_ms=30,
            vad_aggressiveness=1,  # Sensitive detection
            voice_threshold=0.3,
            silence_timeout=1.0,   # Stop after 1 second of silence
            min_recording_duration=0.3,
            max_recording_duration=30.0
        )
        
        processor = VADAudioProcessor(config)
        
        # Recording state
        audio_frames = []
        speech_detected = False
        recording = False
        last_speech_time = None
        start_time = time.time()
        
        def callback(indata, frames, time_info, status):
            nonlocal audio_frames, speech_detected, recording, last_speech_time
            
            # Always collect audio data
            audio_frames.append(indata.copy())
            
            # Check for speech
            try:
                frame_data = indata.flatten().astype(np.int16)
                frame_bytes = frame_data.tobytes()
                is_speech = processor.is_speech_frame(frame_bytes)
                
                if is_speech and not speech_detected:
                    print("🎤 Recording...")
                    speech_detected = True
                    recording = True
                
                if is_speech:
                    last_speech_time = time.time()
                    
            except:
                # Fallback energy detection
                energy = np.mean(np.abs(indata))
                if energy > 0.01 and not speech_detected:
                    print("🎤 Recording...")
                    speech_detected = True
                    recording = True
                    last_speech_time = time.time()
                elif energy > 0.005:
                    last_speech_time = time.time()
        
        # Start recording
        stream = sd.InputStream(
            callback=callback,
            samplerate=config.sample_rate,
            channels=1,
            dtype=np.float32,
            blocksize=int(config.sample_rate * 0.03)  # 30ms blocks
        )
        
        with stream:
            # Wait for speech (max 10 seconds)
            while not speech_detected and (time.time() - start_time) < 10:
                await asyncio.sleep(0.1)
            
            if not speech_detected:
                print("⏰ No speech detected")
                # Create a very short silent audio file to maintain compatibility
                silent_data = np.zeros(int(config.sample_rate * 0.1), dtype=np.float32)  # 0.1s silence
                tmp = tempfile.NamedTemporaryFile(prefix="orchestra_", suffix=".wav", delete=False)
                tmp_path = tmp.name
                tmp.close()
                sf.write(tmp_path, silent_data, config.sample_rate)
                return tmp_path
            
            # Continue until silence
            while recording and (time.time() - start_time) < config.max_recording_duration:
                await asyncio.sleep(0.1)
                
                if last_speech_time and (time.time() - last_speech_time) > config.silence_timeout:
                    break
        
        if not audio_frames:
            return None
        
        # Save to file (exactly like original function)
        data = np.concatenate(audio_frames, axis=0).flatten()
        tmp = tempfile.NamedTemporaryFile(prefix="orchestra_", suffix=".wav", delete=False)
        tmp_path = tmp.name
        tmp.close()
        
        sf.write(tmp_path, data, config.sample_rate)
        print("⏳ Transcribing...")
        return tmp_path
        
    except Exception as e:
        print(f"❌ VAD error: {e}")
        return None


# Main function for backward compatibility
async def vad_capture_audio() -> Optional[str]:
    """Direct replacement for the existing vad_capture_audio import"""
    return await simple_vad_capture()
