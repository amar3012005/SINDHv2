"""
Optimized Gemini Live VAD + STT System
======================================

A completely redesigned, high-performance implementation of Gemini Live API
for real-time voice activity detection and speech-to-text conversion.

Key improvements:
- Faster response times with optimized audio processing
- Better error handling and connection management
- Reduced latency with streamlined data flow
- More accurate transcript collection
- Robust session management
"""

import os
import sys
import asyncio
import tempfile
import time
import json
import numpy as np
import soundfile as sf
import sounddevice as sd
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from dotenv import load_dotenv
import threading
from queue import Queue, Empty

# Load environment variables
load_dotenv()

# Import Gemini SDK
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("❌ Error: google-genai library not installed. Run: pip install google-genai")
    sys.exit(1)

@dataclass
class OptimizedGeminiConfig:
    """Optimized configuration for Gemini Live API"""
    # Audio settings - optimized for speed and quality
    sample_rate: int = 16000
    model_name: str = "gemini-2.0-flash-exp"  # Latest, fastest model
    
    # Language settings
    language_code: str = "hi-IN"  # Hindi (India) with English support
    
    # VAD settings - tuned for responsiveness
    vad_sensitivity: str = "HIGH"    # More sensitive for faster detection
    silence_timeout: float = 1.0     # Shorter timeout for faster response
    speech_start_timeout: float = 6.0  # Reduced from 8s to 6s
    
    # Audio processing - optimized
    audio_chunk_duration: float = 0.05  # 50ms chunks for lower latency
    max_audio_buffer: int = 50          # Smaller buffer for faster processing
    
    # Session settings
    max_session_duration: float = 10.0 * 60  # 10 minutes max
    response_modality: str = "TEXT"


class OptimizedGeminiVAD:
    """High-performance Gemini Live VAD + STT system"""
    
    def __init__(self, config: OptimizedGeminiConfig = None):
        self.config = config or OptimizedGeminiConfig()
        self.client = None
        self.is_listening = False
        self.audio_queue = None
        self.transcript_result = None
        self.speech_started = False
        self.last_activity_time = None
        self.session_start_time = None
        
        # Performance tracking
        self.total_processing_time = 0
        self.chunk_count = 0
        
        # Initialize Gemini client
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Gemini client with API key"""
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        
        if not api_key:
            # Check alternative environment variables
            for key_name in ["GOOGLE_AI_API_KEY", "GOOGLE_GENAI_API_KEY", "API_KEY"]:
                api_key = os.getenv(key_name)
                if api_key:
                    break
        
        if not api_key:
            print("⚠️ Warning: No Gemini API key found. Please set GEMINI_API_KEY environment variable")
            return
        
        try:
            self.client = genai.Client(api_key=api_key)
            print("✅ Optimized Gemini Live client initialized")
        except Exception as e:
            print(f"❌ Failed to initialize Gemini client: {e}")
    
    async def capture_speech_optimized(self) -> Optional[str]:
        """
        Optimized speech capture with improved performance and reliability
        """
        if not self.client:
            print("❌ Gemini client not initialized")
            return None
        
        start_time = time.time()
        
        # Reset state
        self.transcript_result = None
        self.speech_started = False
        self.last_activity_time = None
        self.session_start_time = time.time()
        self.chunk_count = 0
        
        try:
            # Optimized session configuration
            session_config = {
                "response_modalities": [self.config.response_modality],
                "input_audio_transcription": {
                    "model": "nova-2-conversational",  # Fastest transcription model
                },
                "realtime_input_config": {
                    "automatic_activity_detection": {
                        "disabled": False,
                        "prefix_padding_ms": 25,  # Reduced padding for speed
                        "silence_duration_ms": int(self.config.silence_timeout * 1000),
                    }
                },
                "speech_config": {
                    "language_code": self.config.language_code
                },
                # Add performance optimizations
                "generation_config": {
                    "temperature": 0.1,  # Lower temperature for more consistent results
                    "max_output_tokens": 50,  # Limit for faster processing
                }
            }
            
            print("🎤 Starting optimized speech capture...")
            self.is_listening = True
            
            # Connect to Live API with optimized settings
            async with self.client.aio.live.connect(
                model=self.config.model_name,
                config=session_config
            ) as session:
                
                # High-performance audio processing
                await self._process_audio_optimized(session)
            
            processing_time = time.time() - start_time
            self.total_processing_time = processing_time
            
            if self.transcript_result:
                print(f"✅ Optimized capture complete: '{self.transcript_result}' (took {processing_time:.2f}s)")
                return self.transcript_result
            else:
                print(f"⚠️ No speech captured in {processing_time:.2f}s")
                return None
                
        except Exception as e:
            error_msg = str(e)
            processing_time = time.time() - start_time
            
            if "1011" in error_msg and "Deadline expired" in error_msg:
                print(f"⏰ Session timeout after {processing_time:.2f}s - this is normal")
            elif "1006" in error_msg:
                print(f"🔌 Connection closed after {processing_time:.2f}s")
            else:
                print(f"❌ Capture error after {processing_time:.2f}s: {e}")
            
            return self.transcript_result  # Return any partial result
            
        finally:
            self.is_listening = False
    
    async def _process_audio_optimized(self, session):
        """Optimized audio processing with better performance"""
        
        # High-performance audio queue
        self.audio_queue = asyncio.Queue(maxsize=self.config.max_audio_buffer)
        transcript_fragments = []
        
        # Optimized audio callback with minimal processing
        def audio_callback(indata, frames, time_info, status):
            if self.is_listening and not self.audio_queue.full():
                # Fast audio conversion
                audio_data = (indata.flatten() * 32767).astype(np.int16).tobytes()
                try:
                    self.audio_queue.put_nowait(audio_data)
                    self.chunk_count += 1
                except asyncio.QueueFull:
                    pass  # Skip if queue is full (better than blocking)
        
        # Optimized audio stream with lower latency settings
        stream = sd.InputStream(
            callback=audio_callback,
            samplerate=self.config.sample_rate,
            channels=1,
            dtype=np.float32,
            blocksize=int(self.config.sample_rate * self.config.audio_chunk_duration),
            latency='low'  # Request low latency from audio system
        )
        
        # High-performance audio sender
        async def send_audio_optimized():
            try:
                while self.is_listening:
                    try:
                        # Non-blocking queue get with short timeout
                        audio_data = await asyncio.wait_for(
                            self.audio_queue.get(), 
                            timeout=0.02  # 20ms timeout for responsiveness
                        )
                        
                        # Send audio data immediately
                        await session.send_realtime_input(
                            audio=types.Blob(
                                data=audio_data,
                                mime_type=f"audio/pcm;rate={self.config.sample_rate}"
                            )
                        )
                        
                    except asyncio.TimeoutError:
                        # Continue listening - this is normal
                        continue
                    except Exception as e:
                        if "1011" in str(e):  # Expected timeout
                            break
                        print(f"⚠️ Audio send error: {e}")
                        break
                        
            except Exception as e:
                print(f"❌ Audio sender error: {e}")
        
        # High-performance transcript receiver
        async def receive_transcripts_optimized():
            nonlocal transcript_fragments
            
            try:
                # Process responses with timeout
                async with asyncio.timeout(self.config.speech_start_timeout + 5):
                    async for response in session.receive():
                        
                        # Fast transcript processing
                        if (response.server_content and 
                            response.server_content.input_transcription and
                            response.server_content.input_transcription.text):
                            
                            transcript_text = response.server_content.input_transcription.text.strip()
                            
                            if transcript_text:
                                if not self.speech_started:
                                    print("🗣️ Speech detected!")
                                    self.speech_started = True
                                
                                # Collect fragments efficiently
                                transcript_fragments.append(transcript_text)
                                self.last_activity_time = time.time()
                                
                                # Show progress
                                print(f"📝 {transcript_text}")
                        
                        # Check for completion
                        if (response.server_content and 
                            response.server_content.turn_complete):
                            
                            if transcript_fragments:
                                # Fast transcript assembly
                                self.transcript_result = ' '.join(transcript_fragments).strip()
                                print(f"✅ Complete: {self.transcript_result}")
                            
                            self.is_listening = False
                            break
                        
                        # Handle interruptions
                        if (response.server_content and 
                            response.server_content.interrupted):
                            
                            if transcript_fragments:
                                self.transcript_result = ' '.join(transcript_fragments).strip()
                                print(f"⚡ Interrupted: {self.transcript_result}")
                            break
                            
            except asyncio.TimeoutError:
                if transcript_fragments:
                    self.transcript_result = ' '.join(transcript_fragments).strip()
                    print(f"⏰ Timeout result: {self.transcript_result}")
                self.is_listening = False
                
            except Exception as e:
                if "1011" in str(e):
                    print("⏰ Expected session end")
                else:
                    print(f"❌ Receiver error: {e}")
                
                if transcript_fragments:
                    self.transcript_result = ' '.join(transcript_fragments).strip()
                    print(f"🔄 Partial result: {self.transcript_result}")
                
                self.is_listening = False
        
        # Optimized timeout manager
        async def timeout_manager_optimized():
            start_time = time.time()
            
            while self.is_listening:
                await asyncio.sleep(0.1)  # Check every 100ms
                
                current_time = time.time()
                
                # Speech start timeout
                if not self.speech_started and (current_time - start_time) > self.config.speech_start_timeout:
                    print("⏰ No speech detected, stopping...")
                    self.is_listening = False
                    break
                
                # Speech end timeout
                if (self.speech_started and self.last_activity_time and 
                    (current_time - self.last_activity_time) > self.config.silence_timeout):
                    print("⏰ Speech ended, finalizing...")
                    self.is_listening = False
                    break
        
        # Run optimized processing
        with stream:
            print("🌐 Optimized session active")
            
            # Run all tasks concurrently with optimized error handling
            tasks = [
                send_audio_optimized(),
                receive_transcripts_optimized(), 
                timeout_manager_optimized()
            ]
            
            try:
                await asyncio.gather(*tasks, return_exceptions=True)
            except Exception as e:
                print(f"⚠️ Task error: {e}")
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        return {
            "total_time": self.total_processing_time,
            "chunks_processed": self.chunk_count,
            "avg_chunk_time": self.total_processing_time / max(1, self.chunk_count),
            "speech_detected": self.speech_started,
            "result_length": len(self.transcript_result) if self.transcript_result else 0
        }


# Global optimized instance
_optimized_vad = None

async def optimized_gemini_capture() -> Optional[str]:
    """
    High-performance speech capture function
    Replacement for the slower gemini_live_capture_audio()
    """
    global _optimized_vad
    
    if _optimized_vad is None:
        _optimized_vad = OptimizedGeminiVAD()
    
    # Capture with optimized system
    transcript = await _optimized_vad.capture_speech_optimized()
    
    if transcript:
        # Get performance stats
        stats = _optimized_vad.get_performance_stats()
        print(f"📊 Performance: {stats['total_time']:.2f}s, {stats['chunks_processed']} chunks")
        
        return transcript
    else:
        print("❌ No speech captured by optimized system")
        return None


# Test function
async def test_optimized_vad():
    """Test the optimized VAD system"""
    print("🧪 Testing Optimized Gemini Live VAD")
    print("=" * 50)
    
    vad = OptimizedGeminiVAD()
    
    print("🎤 Speak in Hindi or English...")
    start_time = time.time()
    
    transcript = await vad.capture_speech_optimized()
    
    total_time = time.time() - start_time
    stats = vad.get_performance_stats()
    
    if transcript:
        print(f"✅ Success: '{transcript}'")
        print(f"⏱️ Total time: {total_time:.2f}s")
        print(f"📊 Stats: {stats}")
    else:
        print(f"❌ Failed after {total_time:.2f}s")


if __name__ == "__main__":
    asyncio.run(test_optimized_vad())
