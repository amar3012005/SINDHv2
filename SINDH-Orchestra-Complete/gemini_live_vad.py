"""
Gemini Live API VAD + STT Integration
=====================================

This module replaces WebRTC VAD with Google's Gemini Live API for superior:
- Cloud-based neural VAD (robust to accents and background noise)
- Real-time streaming STT with barge-in capability
- Automatic language detection (supports Hindi and English)
- Natural turn-taking with interruption detection

Integrates seamlessly with existing orchestra_agent_past.py workflow.
"""

import os
import sys
import asyncio
import tempfile
import time
import numpy as np
import soundfile as sf
import sounddevice as sd
from typing import Optional, Dict, Any, Callable
from dataclasses import dataclass
from dotenv import load_dotenv

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
class GeminiLiveConfig:
    """Configuration for Gemini Live API VAD+STT"""
    # Audio settings
    sample_rate: int = 16000
    model_name: str = "gemini-live-2.5-flash-preview"
    
    # Language settings
    language_code: str = "hi-IN"  # Hindi (India) - supports Hindi and English mixing
    
    # VAD settings
    vad_sensitivity: str = "MEDIUM"  # LOW, MEDIUM, HIGH
    silence_timeout: float = 1.5     # Seconds to wait after speech ends
    
    # Session settings
    max_session_duration: float = 15.0 * 60  # 15 minutes max
    response_modality: str = "TEXT"  # We only need transcription, not audio response


class GeminiLiveVAD:
    """Gemini Live API-based VAD and STT system"""
    
    def __init__(self, config: GeminiLiveConfig = None):
        self.config = config or GeminiLiveConfig()
        self.client = None
        self.is_listening = False
        self.current_transcript = ""
        self.speech_detected = False
        self.last_activity_time = None
        
        # Initialize Gemini client
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Gemini client with API key"""
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        
        if not api_key:
            # Check if using existing Google AI Studio API key from environment
            for key_name in ["GOOGLE_AI_API_KEY", "GOOGLE_GENAI_API_KEY", "API_KEY"]:
                api_key = os.getenv(key_name)
                if api_key:
                    break
        
        if not api_key:
            print("⚠️ Warning: No Gemini API key found. Please set GEMINI_API_KEY or GOOGLE_API_KEY environment variable")
            print("   You can get an API key from: https://aistudio.google.com/app/apikey")
            return
        
        try:
            self.client = genai.Client(api_key=api_key)
            print("✅ Gemini Live API client initialized")
        except Exception as e:
            print(f"❌ Failed to initialize Gemini client: {e}")
    
    async def capture_speech_with_gemini_vad(self) -> Optional[str]:
        """
        Capture speech using Gemini Live API VAD+STT
        Returns transcript string (not file path) - seamless replacement for spacebar
        """
        if not self.client:
            print("❌ Gemini client not initialized")
            return None
        
        try:
            # Session configuration for VAD + STT only
            session_config = {
                "response_modalities": [self.config.response_modality],
                "input_audio_transcription": {},  # Enable input transcription
                "realtime_input_config": {
                    "automatic_activity_detection": {
                        "disabled": False,
                        "prefix_padding_ms": 50,
                        "silence_duration_ms": int(self.config.silence_timeout * 1000),
                    }
                },
            }
            
            # Add language configuration if specified
            if self.config.language_code:
                session_config["speech_config"] = {
                    "language_code": self.config.language_code
                }
            
            # Start audio streaming
            transcript_result = None
            speech_started = False
            
            print("🎤 Listening with Gemini Live API...")
            self.is_listening = True
            
            # Connect to Live API and process audio
            async with self.client.aio.live.connect(
                model=self.config.model_name,
                config=session_config
            ) as session:
                # Audio capture setup
                audio_queue = asyncio.Queue(maxsize=100)
                
                def audio_callback(indata, frames, time_info, status):
                    if self.is_listening and not audio_queue.full():
                        # Convert to correct format for Gemini (16-bit PCM)
                        audio_data = (indata.flatten() * 32767).astype(np.int16).tobytes()
                        try:
                            audio_queue.put_nowait(audio_data)
                        except asyncio.QueueFull:
                            pass  # Skip if queue is full
                
                # Start audio stream
                stream = sd.InputStream(
                    callback=audio_callback,
                    samplerate=self.config.sample_rate,
                    channels=1,
                    dtype=np.float32,
                    blocksize=int(self.config.sample_rate * 0.1)  # 100ms blocks
                )
                
                # Task for sending audio to Gemini
                async def send_audio():
                    try:
                        while self.is_listening:
                            try:
                                audio_data = await asyncio.wait_for(audio_queue.get(), timeout=0.1)
                                await session.send_realtime_input(
                                    audio=types.Blob(
                                        data=audio_data,
                                        mime_type=f"audio/pcm;rate={self.config.sample_rate}"
                                    )
                                )
                            except asyncio.TimeoutError:
                                continue
                            except Exception as e:
                                print(f"⚠️ Audio send error: {e}")
                                break
                    except Exception as e:
                        print(f"❌ Audio sending failed: {e}")
                
                # Task for receiving transcripts from Gemini
                async def receive_transcripts():
                    nonlocal transcript_result, speech_started
                    transcript_fragments = []  # Collect all fragments
                    
                    try:
                        async for response in session.receive():
                            # Check for input transcription (our speech)
                            if response.server_content and response.server_content.input_transcription:
                                transcript_text = response.server_content.input_transcription.text
                                
                                if transcript_text and transcript_text.strip():
                                    if not speech_started:
                                        print("🗣️ Speech detected by Gemini!")
                                        speech_started = True
                                    
                                    # Collect fragment
                                    fragment = transcript_text.strip()
                                    transcript_fragments.append(fragment)
                                    
                                    # Update current transcript for display (latest fragment)
                                    self.current_transcript = fragment
                                    self.last_activity_time = time.time()
                                    print(f"📝 Fragment: {fragment}")
                            
                            # Check for turn completion (end of speech)
                            if response.server_content and response.server_content.turn_complete:
                                if transcript_fragments:
                                    # Combine all fragments to create complete transcript
                                    full_transcript = ' '.join(transcript_fragments).strip()
                                    transcript_result = full_transcript
                                    print(f"✅ Complete transcript: {transcript_result}")
                                    self.is_listening = False
                                    break
                            
                            # Ignore model responses (we only want transcription)
                            if response.server_content and response.server_content.model_turn:
                                continue
                            
                            # Check for interruptions or session end
                            if response.server_content and response.server_content.interrupted:
                                print("✋ Speech interrupted")
                                if transcript_fragments:
                                    full_transcript = ' '.join(transcript_fragments).strip()
                                    transcript_result = full_transcript
                                    print(f"⚡ Partial transcript: {transcript_result}")
                                break
                            
                    except Exception as e:
                        print(f"❌ Transcript receiving failed: {e}")
                        # Return accumulated fragments even on error
                        if transcript_fragments:
                            transcript_result = ' '.join(transcript_fragments).strip()
                            print(f"🔄 Recovered transcript: {transcript_result}")
                
                # Task for timeout management
                async def timeout_manager():
                    nonlocal transcript_result
                    start_time = time.time()
                    
                    while self.is_listening:
                        await asyncio.sleep(0.5)
                        
                        # Check for speech start timeout (8 seconds)
                        if not speech_started and (time.time() - start_time) > 8:
                            print("⏰ No speech detected within timeout")
                            self.is_listening = False
                            break
                        
                        # Check for speech end timeout
                        if (speech_started and self.last_activity_time and 
                            (time.time() - self.last_activity_time) > self.config.silence_timeout):
                            # Stop listening but let the receive_transcripts function handle final transcript
                            print("⏰ Speech timeout - finalizing...")
                            self.is_listening = False
                            break
                
                # Run audio capture and processing
                with stream:
                    print("🌐 Gemini Live session connected")
                    # Run all tasks concurrently
                    await asyncio.gather(
                        send_audio(),
                        receive_transcripts(),
                        timeout_manager(),
                        return_exceptions=True
                    )
            
            return transcript_result
            
        except Exception as e:
            print(f"❌ Gemini Live capture error: {e}")
            return None
        finally:
            self.is_listening = False


# Global instance for easy integration
_gemini_vad = None

async def gemini_live_capture_audio() -> Optional[str]:
    """
    Direct replacement for simple_vad_capture() using Gemini Live API
    Returns transcript string for immediate use in existing workflow
    """
    global _gemini_vad
    
    if _gemini_vad is None:
        _gemini_vad = GeminiLiveVAD()
    
    # Capture speech and get transcript
    transcript = await _gemini_vad.capture_speech_with_gemini_vad()
    
    if transcript:
        print("⏳ Processing transcript...")
        
        # For compatibility with existing code that expects file paths,
        # we create a temporary text file with the transcript
        # But since the orchestra agent now processes transcripts directly,
        # we can return the transcript string
        return transcript
    else:
        print("❌ No transcript captured")
        return None


# Backward compatibility function that returns file path (if needed)
async def gemini_live_capture_as_file() -> Optional[str]:
    """
    Alternative function that saves transcript to file for full backward compatibility
    """
    transcript = await gemini_live_capture_audio()
    
    if transcript:
        # Create a temporary file with the transcript for compatibility
        temp_file = tempfile.NamedTemporaryFile(
            mode='w', 
            prefix="gemini_transcript_", 
            suffix=".txt", 
            delete=False,
            encoding='utf-8'
        )
        
        temp_file.write(transcript)
        temp_file.close()
        
        return temp_file.name
    
    return None


# Test function
async def test_gemini_live_vad():
    """Test Gemini Live VAD system"""
    print("🧪 Testing Gemini Live VAD System")
    print("=" * 40)
    
    vad = GeminiLiveVAD()
    
    print("🎤 Say something in Hindi or English...")
    transcript = await vad.capture_speech_with_gemini_vad()
    
    if transcript:
        print(f"✅ Captured: {transcript}")
    else:
        print("❌ No speech captured")


if __name__ == "__main__":
    asyncio.run(test_gemini_live_vad())
