"""
Persistent Gemini Live VAD Session Manager
==========================================

Manages a single persistent Gemini Live session to avoid reconnecting every time.
"""

import os
import sys
import asyncio
import time
import numpy as np
import soundfile as sf
import sounddevice as sd
from typing import Optional, Dict, Any
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

class PersistentGeminiLiveVAD:
    """Persistent Gemini Live VAD session manager"""
    
    def __init__(self):
        self.client = None
        self.session = None
        self.session_context = None
        self.is_initialized = False
        self.is_listening = False
        self.sample_rate = 16000
        self.language_code = "hi-IN"  # Hindi (India)
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
            return
        
        try:
            self.client = genai.Client(api_key=api_key)
            print("✅ Gemini Live API client initialized")
        except Exception as e:
            print(f"❌ Failed to initialize Gemini client: {e}")
    
    async def initialize_session(self):
        """Initialize persistent Gemini Live session"""
        if self.is_initialized or not self.client:
            return True
        
        try:
            session_config = {
                "response_modalities": ["TEXT"],
                "input_audio_transcription": {},
                "realtime_input_config": {
                    "automatic_activity_detection": {
                        "disabled": False,
                        "prefix_padding_ms": 100,  # Increased padding for better capture
                        "silence_duration_ms": 2000,  # Longer silence for complete sentences
                    }
                },
                "speech_config": {
                    "language_code": self.language_code
                }
            }
            
            # Create persistent session context manager
            self.session_context = self.client.aio.live.connect(
                model="gemini-2.0-flash-exp",
                config=session_config
            )
            
            self.session = await self.session_context.__aenter__()
            self.is_initialized = True
            print("🌐 Gemini Live session initialized (persistent)")
            return True
            
        except Exception as e:
            print(f"❌ Failed to initialize Gemini Live session: {e}")
            return False
    
    async def capture_speech(self) -> Optional[str]:
        """Capture speech using persistent session with improved robustness"""
        if not await self.initialize_session():
            return None
        
        try:
            transcript_result = None
            speech_started = False
            complete_transcript = []
            self.is_listening = True
            last_activity_time = None
            session_start_time = time.time()
            previous_full_text = ""
            
            print("🎤 Listening with Gemini Live API...")
            print("🌐 Gemini Live session connected")
            
            # Audio capture setup with better error handling
            audio_queue = asyncio.Queue(maxsize=100)  # Larger queue to handle more data
            
            def audio_callback(indata, frames, time_info, status):
                if status and status.input_overflow:
                    print("⚠️ Audio input overflow - adjusting...")
                    
                if self.is_listening and not audio_queue.full():
                    try:
                        # Convert to int16 format for Gemini
                        audio_data = (indata.flatten() * 32767).astype(np.int16).tobytes()
                        audio_queue.put_nowait(audio_data)
                    except Exception as e:
                        pass  # Silently handle queue errors to avoid spam
            
            stream = sd.InputStream(
                callback=audio_callback,
                samplerate=self.sample_rate,
                channels=1,
                dtype=np.float32,
                blocksize=int(self.sample_rate * 0.05),  # Even smaller blocks for ultra responsiveness
                latency='low'
            )
            
            async def send_audio():
                """Send audio data to Gemini with improved error handling"""
                consecutive_errors = 0
                max_consecutive_errors = 5
                
                try:
                    while self.is_listening:
                        try:
                            audio_data = await asyncio.wait_for(audio_queue.get(), timeout=0.05)  # Faster timeout
                            
                            if not self.is_listening:
                                break
                            
                            await self.session.send_realtime_input(
                                audio=types.Blob(
                                    data=audio_data,
                                    mime_type=f"audio/pcm;rate={self.sample_rate}"
                                )
                            )
                            consecutive_errors = 0  # Reset error counter on success
                            
                        except asyncio.TimeoutError:
                            # Normal timeout, continue quickly
                            continue
                        except Exception as e:
                            consecutive_errors += 1
                            if consecutive_errors >= max_consecutive_errors:
                                print(f"❌ Too many audio send errors, stopping: {e}")
                                self.is_listening = False
                                break
                            await asyncio.sleep(0.05)  # Shorter pause before retry
                            
                except Exception as e:
                    if self.is_listening:
                        print(f"❌ Audio sending failed: {e}")
            
            async def receive_transcripts():
                """Receive and process transcripts with better fragment handling"""
                nonlocal transcript_result, speech_started, complete_transcript, last_activity_time, previous_full_text
                
                fragment_count = 0
                
                try:
                    async for response in self.session.receive():
                        if not self.is_listening:
                            break
                            
                        if response.server_content and response.server_content.input_transcription:
                            current_text = response.server_content.input_transcription.text
                            
                            if current_text and current_text.strip():
                                if not speech_started:
                                    print("🗣️ Speech detected by Gemini!")
                                    speech_started = True
                                
                                # Improved fragment processing - more intelligent
                                current_text = current_text.strip()
                                
                                # Check if this is new content and meaningful
                                if current_text != previous_full_text and len(current_text) > len(previous_full_text):
                                    # Extract only the new part
                                    if previous_full_text and current_text.startswith(previous_full_text):
                                        new_fragment = current_text[len(previous_full_text):].strip()
                                        if new_fragment:
                                            # Only show meaningful fragments (more than single characters)
                                            if len(new_fragment) > 1 or new_fragment.isdigit():
                                                print(f"📝 Adding: {new_fragment}")
                                                fragment_count += 1
                                    else:
                                        # Completely new text
                                        if len(current_text) > 1:
                                            print(f"📝 Text: {current_text}")
                                            fragment_count += 1
                                    
                                    previous_full_text = current_text
                                    last_activity_time = time.time()
                                    
                                    # Show current complete text periodically
                                    if fragment_count % 3 == 0:  # Every 3 fragments
                                        print(f"📄 Current: '{current_text}'")
                        
                        # Check for completion signal
                        if (response.server_content and 
                            hasattr(response.server_content, 'turn_complete') and 
                            response.server_content.turn_complete):
                            
                            if previous_full_text:
                                transcript_result = previous_full_text
                                # Clean up the transcript
                                import re
                                transcript_result = re.sub(r'\s+', ' ', transcript_result).strip()
                                print(f"✅ Complete transcript: {transcript_result}")
                                self.is_listening = False
                                break
                                
                except Exception as e:
                    if self.is_listening:
                        print(f"❌ Transcript receiving failed: {e}")
            
            async def timeout_manager():
                """Improved timeout management with better handling"""
                nonlocal transcript_result, previous_full_text
                
                while self.is_listening:
                    await asyncio.sleep(0.3)  # More frequent checks for better responsiveness
                    current_time = time.time()
                    
                    # Overall session timeout (25 seconds - increased)
                    if (current_time - session_start_time) > 25:
                        print("⏰ Overall session timeout")
                        if previous_full_text:
                            transcript_result = previous_full_text
                            print(f"⏳ Processing transcript...")
                        self.is_listening = False
                        break
                    
                    # No speech detected timeout (12 seconds - increased)
                    if not speech_started and (current_time - session_start_time) > 12:
                        print("⏰ No speech detected within timeout")
                        self.is_listening = False
                        break
                    
                    # Dynamic speech timeout based on content - more intelligent
                    if (speech_started and last_activity_time and 
                        (current_time - last_activity_time) > self._get_dynamic_timeout(previous_full_text)):
                        
                        # Additional check: Don't timeout if the text looks incomplete
                        if previous_full_text:
                            text_words = previous_full_text.strip().split()
                            # If very short or looks incomplete, wait a bit more
                            if len(text_words) < 2 or previous_full_text.strip().endswith(("का", "की", "है", "मेरा", "आपका")):
                                print("🔄 Text seems incomplete, waiting longer...")
                                last_activity_time = current_time  # Reset timer
                                continue
                        
                        print("⏰ Speech timeout - finalizing...")
                        if previous_full_text:
                            transcript_result = previous_full_text
                            # Clean up the transcript
                            import re
                            transcript_result = re.sub(r'\s+', ' ', transcript_result).strip()
                            print(f"⏳ Processing transcript...")
                        self.is_listening = False
                        break
            
            # Start audio stream and run all tasks
            with stream:
                tasks = await asyncio.gather(
                    send_audio(),
                    receive_transcripts(), 
                    timeout_manager(),
                    return_exceptions=True
                )
                
                # Check for any critical errors
                for i, result in enumerate(tasks):
                    if isinstance(result, Exception):
                        print(f"⚠️ Task {i} had error: {result}")
            
            return transcript_result
            
        except Exception as e:
            print(f"❌ Gemini Live capture error: {e}")
            # Try to reset session for next attempt
            await self.reset_session()
            return None
        finally:
            self.is_listening = False
    
    async def reset_session(self):
        """Reset the session if it gets stuck"""
        try:
            self.is_listening = False
            if self.session_context and self.is_initialized:
                await self.session_context.__aexit__(None, None, None)
            self.session = None
            self.session_context = None
            self.is_initialized = False
            print("🔄 Session reset due to error")
        except Exception as e:
            print(f"⚠️ Error during session reset: {e}")
    
    def _get_dynamic_timeout(self, current_text: str) -> float:
        """Get dynamic timeout based on current transcript content - made more generous"""
        if not current_text:
            return 8.0  # Increased default timeout for better responsiveness
        
        text_lower = current_text.lower()
        
        # Phone number indicators - much longer timeout
        phone_indicators = ["फोन", "नंबर", "number", "mobile", "मोबाइल", "है कि", "है के", "का", "की"]
        if any(indicator in text_lower for indicator in phone_indicators):
            return 12.0  # 12 seconds for phone numbers
        
        # Contains digits - longer timeout 
        if any(char.isdigit() for char in current_text):
            return 10.0  # 10 seconds if digits are being spoken
        
        # Short fragments - wait longer for completion
        if len(current_text.strip().split()) < 3:
            return 8.0  # Wait longer for short fragments
        
        # Normal conversation - generous timeout
        return 7.0  # Increased from 4.0 to 7.0
    
    async def cleanup(self):
        """Clean up persistent session"""
        try:
            if self.session_context and self.is_initialized:
                await self.session_context.__aexit__(None, None, None)
                self.is_initialized = False
                print("🔄 Gemini Live session cleaned up")
        except Exception as e:
            print(f"⚠️ Session cleanup warning: {e}")

# Global persistent VAD instance
_persistent_vad = None

async def gemini_live_capture_audio() -> Optional[str]:
    """
    Main function to capture audio using persistent Gemini Live VAD
    with improved robustness and error recovery
    """
    global _persistent_vad
    
    max_retries = 3
    retry_delay = 1.0
    
    for attempt in range(max_retries):
        try:
            if _persistent_vad is None:
                _persistent_vad = PersistentGeminiLiveVAD()
            
            result = await _persistent_vad.capture_speech()
            
            if result and result.strip():
                return result.strip()
            else:
                # If no result, try to reset session for next attempt
                if attempt < max_retries - 1:
                    print(f"🔄 No result on attempt {attempt + 1}, resetting session...")
                    await _persistent_vad.reset_session()
                    await asyncio.sleep(retry_delay)
                    continue
                else:
                    print("❌ No speech captured after all retries")
                    return None
                    
        except Exception as e:
            print(f"❌ Attempt {attempt + 1} failed: {e}")
            
            if attempt < max_retries - 1:
                # Reset VAD instance and try again
                if _persistent_vad:
                    await _persistent_vad.cleanup()
                _persistent_vad = None
                await asyncio.sleep(retry_delay)
                retry_delay *= 1.5  # Exponential backoff
            else:
                print("❌ All attempts failed, giving up")
                return None
    
    return None

async def cleanup_gemini_live_vad():
    """Clean up the global VAD instance"""
    global _persistent_vad
    if _persistent_vad:
        await _persistent_vad.cleanup()
        _persistent_vad = None

# Global instance for persistent session
_gemini_vad_instance = None

def get_persistent_gemini_vad():
    """Get or create persistent Gemini VAD instance"""
    global _gemini_vad_instance
    if _gemini_vad_instance is None:
        _gemini_vad_instance = PersistentGeminiLiveVAD()
        print("🎤 Created persistent Gemini Live VAD instance")
    return _gemini_vad_instance

async def gemini_live_capture_audio() -> Optional[str]:
    """Use persistent Gemini Live VAD for audio capture"""
    gemini_vad = get_persistent_gemini_vad()
    return await gemini_vad.capture_speech()

async def cleanup_gemini_live_vad():
    """Cleanup persistent Gemini Live VAD"""
    global _gemini_vad_instance
    if _gemini_vad_instance:
        await _gemini_vad_instance.cleanup()
        _gemini_vad_instance = None

if __name__ == "__main__":
    async def test():
        print("🧪 Testing Persistent Gemini Live VAD")
        result = await gemini_live_capture_audio()
        print(f"Result: {result}")
        await cleanup_gemini_live_vad()
    
    asyncio.run(test())
