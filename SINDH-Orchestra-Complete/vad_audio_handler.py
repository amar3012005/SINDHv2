"""
Voice Activity Detection (VAD) Audio Handler
==========================================

This module replaces the spacebar-triggered audio recording with natural
Voice Activity Detection for seamless conversation flow with TARA.

Features:
- Continuous listening with VAD
- Natural turn-taking conversation
- Automatic speech start/end detection
- Background noise filtering
- Integration with existing STT/TTS pipeline
- LiveKit VAD integration (optional)
"""

import os
import sys
import asyncio
import tempfile
import time
import json
import threading
from typing import Optional, Dict, Any, List, Callable, Tuple
from dataclasses import dataclass
from datetime import datetime
import numpy as np
import sounddevice as sd
import soundfile as sf
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
import webrtcvad
import collections

# Load environment
load_dotenv()

@dataclass
class VADConfig:
    """Configuration for VAD Audio Handler"""
    # Audio settings
    sample_rate: int = 16000
    channels: int = 1
    dtype: str = 'int16'
    chunk_duration_ms: int = 30  # VAD frame duration (10, 20, or 30ms)
    
    # VAD settings
    vad_aggressiveness: int = 2  # 0-3, higher = more aggressive
    voice_threshold: float = 0.6  # Fraction of frames that must be speech
    silence_timeout: float = 1.5  # Seconds of silence to end recording
    min_recording_duration: float = 0.5  # Minimum recording length
    max_recording_duration: float = 30.0  # Maximum recording length
    
    # Audio processing
    pre_speech_buffer: float = 0.3  # Seconds of audio before speech starts
    post_speech_buffer: float = 0.5  # Seconds of audio after speech ends
    noise_gate_threshold: float = 0.01  # RMS threshold for noise gate
    
    # STT/TTS settings
    stt_language: str = "hi-IN"
    tts_language: str = "hi-IN"
    tts_speaker: str = "anushka"

class VADAudioProcessor:
    """Handles audio processing with Voice Activity Detection"""
    
    def __init__(self, config: VADConfig):
        self.config = config
        self.vad = webrtcvad.Vad(config.vad_aggressiveness)
        
        # Calculate frame size for VAD
        self.frame_duration = config.chunk_duration_ms / 1000.0
        self.frame_size = int(config.sample_rate * self.frame_duration)
        self.bytes_per_frame = self.frame_size * 2  # 16-bit audio
        
        # Buffers
        self.audio_buffer = collections.deque(maxlen=int(config.pre_speech_buffer / self.frame_duration))
        self.recording_buffer = []
        
        print(f"🎤 VAD initialized: aggressiveness={config.vad_aggressiveness}, frame_size={self.frame_size}")
    
    def is_speech_frame(self, frame_bytes: bytes) -> bool:
        """Check if audio frame contains speech using WebRTC VAD"""
        try:
            return self.vad.is_speech(frame_bytes, self.config.sample_rate)
        except:
            return False
    
    def detect_voice_activity(self, audio_data: np.ndarray) -> List[Tuple[float, bool]]:
        """
        Analyze audio data and return voice activity timeline
        Returns list of (timestamp, is_speech) tuples
        """
        # Convert to bytes for VAD
        audio_int16 = (audio_data * 32767).astype(np.int16)
        audio_bytes = audio_int16.tobytes()
        
        voice_timeline = []
        
        # Process in VAD frame chunks
        for i in range(0, len(audio_bytes), self.bytes_per_frame):
            frame = audio_bytes[i:i + self.bytes_per_frame]
            
            if len(frame) == self.bytes_per_frame:
                timestamp = i / (self.config.sample_rate * 2)  # 2 bytes per sample
                is_speech = self.is_speech_frame(frame)
                voice_timeline.append((timestamp, is_speech))
        
        return voice_timeline
    
    def analyze_speech_segments(self, voice_timeline: List[Tuple[float, bool]]) -> List[Tuple[float, float]]:
        """
        Analyze voice timeline to find continuous speech segments
        Returns list of (start_time, end_time) for speech segments
        """
        if not voice_timeline:
            return []
        
        segments = []
        current_segment_start = None
        speech_frames = 0
        total_frames = 0
        
        for timestamp, is_speech in voice_timeline:
            total_frames += 1
            
            if is_speech:
                speech_frames += 1
                if current_segment_start is None:
                    current_segment_start = timestamp
            else:
                if current_segment_start is not None:
                    # Check if we have enough speech in this segment
                    segment_duration = timestamp - current_segment_start
                    if segment_duration >= self.config.min_recording_duration:
                        segments.append((current_segment_start, timestamp))
                    current_segment_start = None
        
        # Handle case where speech continues to the end
        if current_segment_start is not None:
            final_timestamp = voice_timeline[-1][0]
            segment_duration = final_timestamp - current_segment_start
            if segment_duration >= self.config.min_recording_duration:
                segments.append((current_segment_start, final_timestamp))
        
        return segments
    
    def apply_noise_gate(self, audio_data: np.ndarray) -> np.ndarray:
        """Apply noise gate to reduce background noise"""
        rms = np.sqrt(np.mean(audio_data ** 2))
        
        if rms < self.config.noise_gate_threshold:
            return audio_data * 0.1  # Reduce noise by 90%
        
        return audio_data
    
    def extract_speech_audio(self, audio_data: np.ndarray, start_time: float, end_time: float) -> np.ndarray:
        """Extract audio segment with pre/post speech buffers"""
        sample_rate = self.config.sample_rate
        
        # Add buffers
        buffer_start = max(0, start_time - self.config.pre_speech_buffer)
        buffer_end = min(len(audio_data) / sample_rate, end_time + self.config.post_speech_buffer)
        
        # Convert to sample indices
        start_idx = int(buffer_start * sample_rate)
        end_idx = int(buffer_end * sample_rate)
        
        # Extract segment
        segment = audio_data[start_idx:end_idx]
        
        # Apply noise gate
        segment = self.apply_noise_gate(segment)
        
        return segment

class VADAudioHandler:
    """Main VAD Audio Handler for natural conversation"""
    
    def __init__(self, config: VADConfig = None):
        self.config = config or VADConfig()
        self.processor = VADAudioProcessor(self.config)
        
        # Import existing audio components
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'V2'))
        from audio_handler import AudioHandler
        
        # Use existing STT/TTS infrastructure
        self.audio_handler = AudioHandler()
        
        # State management
        self.is_listening = False
        self.is_processing = False
        self.is_speaking = False
        self.conversation_active = False
        
        # Recording state
        self.current_recording = []
        self.recording_start_time = None
        self.silence_start_time = None
        
        print("🎙️ VAD Audio Handler initialized")
    
    async def start_conversation_mode(self):
        """Start continuous conversation mode with VAD"""
        print("🗣️ Starting conversation mode...")
        print("💬 TARA is now listening naturally - just speak when ready!")
        
        self.conversation_active = True
        
        # Start background listening task
        listening_task = asyncio.create_task(self._continuous_listening_loop())
        
        try:
            await listening_task
        except KeyboardInterrupt:
            print("🛑 Conversation mode stopped by user")
        finally:
            await self.stop_conversation_mode()
    
    async def stop_conversation_mode(self):
        """Stop conversation mode"""
        print("🔴 Stopping conversation mode...")
        self.conversation_active = False
        self.is_listening = False
        self.is_processing = False
    
    async def _continuous_listening_loop(self):
        """Main listening loop with VAD"""
        print("👂 Continuous listening started...")
        
        # Audio stream setup
        audio_queue = asyncio.Queue()
        
        def audio_callback(indata, frames, time, status):
            if self.is_listening and not self.is_speaking:
                audio_queue.put_nowait(indata.copy())
        
        # Start audio stream
        stream = sd.InputStream(
            callback=audio_callback,
            samplerate=self.config.sample_rate,
            channels=self.config.channels,
            dtype='float32',
            blocksize=self.processor.frame_size
        )
        
        stream.start()
        self.is_listening = True
        
        try:
            while self.conversation_active:
                if not self.is_processing and not self.is_speaking:
                    # Collect audio for VAD analysis
                    audio_chunk = await self._collect_audio_chunk(audio_queue, duration=2.0)
                    
                    if audio_chunk is not None and len(audio_chunk) > 0:
                        # Analyze for speech
                        speech_detected = await self._analyze_and_process_speech(audio_chunk)
                        
                        if speech_detected:
                            # Wait for TTS to complete before listening again
                            await self._wait_for_tts_completion()
                
                await asyncio.sleep(0.1)
        
        finally:
            stream.stop()
            stream.close()
            print("👂 Listening loop stopped")
    
    async def _collect_audio_chunk(self, audio_queue: asyncio.Queue, duration: float) -> Optional[np.ndarray]:
        """Collect audio chunk for analysis"""
        frames = []
        start_time = time.time()
        
        while time.time() - start_time < duration:
            try:
                frame = await asyncio.wait_for(audio_queue.get(), timeout=0.1)
                frames.append(frame.flatten())
            except asyncio.TimeoutError:
                continue
        
        if frames:
            return np.concatenate(frames)
        return None
    
    async def _analyze_and_process_speech(self, audio_data: np.ndarray) -> bool:
        """Analyze audio for speech and process if found"""
        # Get voice activity timeline
        voice_timeline = self.processor.detect_voice_activity(audio_data)
        
        if not voice_timeline:
            return False
        
        # Find speech segments
        speech_segments = self.processor.analyze_speech_segments(voice_timeline)
        
        if not speech_segments:
            return False
        
        print(f"🗣️ Speech detected: {len(speech_segments)} segment(s)")
        
        # Process the longest speech segment
        longest_segment = max(speech_segments, key=lambda s: s[1] - s[0])
        start_time, end_time = longest_segment
        
        print(f"📝 Processing speech segment: {start_time:.2f}s - {end_time:.2f}s")
        
        # Extract speech audio
        speech_audio = self.processor.extract_speech_audio(audio_data, start_time, end_time)
        
        if len(speech_audio) > 0:
            # Process the speech
            await self._process_speech_input(speech_audio)
            return True
        
        return False
    
    async def _process_speech_input(self, speech_audio: np.ndarray):
        """Process detected speech input"""
        self.is_processing = True
        
        try:
            print("🔄 Processing speech...")
            
            # Save audio to temporary file
            audio_file = self._save_audio_to_file(speech_audio)
            
            if audio_file:
                # Transcribe using existing STT
                transcript_result = await self.audio_handler.transcribe_audio(audio_file)
                
                if transcript_result.get("success") and transcript_result.get("transcript"):
                    transcript = transcript_result["transcript"].strip()
                    print(f"📝 User said: {transcript}")
                    
                    # Process with TARA's pipeline
                    await self._handle_user_input(transcript)
                else:
                    print("❌ Transcription failed or empty")
            else:
                print("❌ Failed to save audio file")
                
        except Exception as e:
            print(f"❌ Error processing speech: {e}")
        finally:
            self.is_processing = False
    
    async def _handle_user_input(self, transcript: str):
        """Handle transcribed user input through TARA's pipeline"""
        try:
            # Import the RAG system
            from simple_rag import process_rag_query
            
            print("🤖 TARA is thinking...")
            
            # Get response from RAG system
            rag_result = await process_rag_query(transcript)
            
            if rag_result and rag_result.get('answer'):
                response_text = rag_result['answer']
                print(f"💬 TARA: {response_text}")
                
                # Speak the response
                await self._speak_response(response_text)
            else:
                # Fallback response
                fallback_response = "माफ़ करिए, मुझे समझ नहीं आया। कृपया फिर से कहिए।"
                print(f"💬 TARA: {fallback_response}")
                await self._speak_response(fallback_response)
                
        except Exception as e:
            print(f"❌ Error handling user input: {e}")
            error_response = "कुछ technical problem हो रही है। कृपया थोड़ी देर बाद कोशिश करें।"
            await self._speak_response(error_response)
    
    async def _speak_response(self, text: str):
        """Speak TARA's response using TTS"""
        self.is_speaking = True
        
        try:
            print("🔊 TARA speaking...")
            
            # Use existing TTS infrastructure
            tts_result = await self.audio_handler.synthesize_and_play(
                text,
                cache_name=f"vad_response_{hash(text)}"
            )
            
            if tts_result.get("success"):
                print("✅ Speech completed")
            else:
                print("❌ TTS failed")
                
        except Exception as e:
            print(f"❌ Error in TTS: {e}")
        finally:
            self.is_speaking = False
            print("👂 Listening for your response...")
    
    async def _wait_for_tts_completion(self):
        """Wait for TTS to complete before resuming listening"""
        while self.is_speaking:
            await asyncio.sleep(0.1)
        
        # Add small delay after TTS to avoid picking up echoes
        await asyncio.sleep(0.5)
    
    def _save_audio_to_file(self, audio_data: np.ndarray) -> Optional[str]:
        """Save audio data to temporary WAV file"""
        try:
            # Convert to int16
            audio_int16 = (audio_data * 32767).astype(np.int16)
            
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(
                prefix="vad_speech_", 
                suffix=".wav", 
                delete=False
            )
            temp_file.close()
            
            # Save audio
            sf.write(temp_file.name, audio_int16, self.config.sample_rate)
            
            print(f"💾 Audio saved: {temp_file.name} ({len(audio_data)/self.config.sample_rate:.2f}s)")
            return temp_file.name
            
        except Exception as e:
            print(f"❌ Error saving audio: {e}")
            return None
    
    def cleanup(self):
        """Cleanup resources"""
        print("🧹 Cleaning up VAD Audio Handler...")
        if hasattr(self, 'audio_handler'):
            self.audio_handler.cleanup()

# Integration function for existing orchestra agent
async def start_vad_conversation():
    """
    Main function to start VAD-based conversation with TARA
    This replaces the spacebar-triggered interaction
    """
    print("🎙️ Starting VAD-based conversation with TARA")
    print("=" * 50)
    
    # Initialize VAD handler
    vad_handler = VADAudioHandler()
    
    try:
        print("🤖 TARA: नमस्ते! मैं तारा हूँ। आप कुछ भी पूछ सकते हैं।")
        
        # Speak introduction
        await vad_handler._speak_response("नमस्ते! मैं तारा हूँ। आप कुछ भी पूछ सकते हैं।")
        
        print("\n💡 Instructions:")
        print("   - Just speak naturally - TARA will detect when you're talking")
        print("   - Wait for TARA to finish speaking before responding")
        print("   - Press Ctrl+C to end the conversation")
        print()
        
        # Start conversation mode
        await vad_handler.start_conversation_mode()
        
    except KeyboardInterrupt:
        print("🛑 Conversation ended by user")
    except Exception as e:
        print(f"❌ Error in conversation: {e}")
    finally:
        vad_handler.cleanup()
        print("👋 Goodbye!")

# Test function
async def test_vad_system():
    """Test the VAD system"""
    print("🧪 Testing VAD System")
    print("=" * 30)
    
    config = VADConfig(
        vad_aggressiveness=2,
        voice_threshold=0.6,
        silence_timeout=1.5
    )
    
    handler = VADAudioHandler(config)
    
    try:
        print("🎤 Say something to test VAD detection...")
        
        # Collect 5 seconds of audio for testing
        audio_data = []
        
        def callback(indata, frames, time, status):
            audio_data.append(indata.copy())
        
        stream = sd.InputStream(
            callback=callback,
            samplerate=config.sample_rate,
            channels=config.channels,
            dtype='float32',
            blocksize=int(config.sample_rate * 0.1)  # 100ms blocks
        )
        
        stream.start()
        await asyncio.sleep(5)  # Record for 5 seconds
        stream.stop()
        
        if audio_data:
            # Analyze the recorded audio
            full_audio = np.concatenate([chunk.flatten() for chunk in audio_data])
            
            voice_timeline = handler.processor.detect_voice_activity(full_audio)
            speech_segments = handler.processor.analyze_speech_segments(voice_timeline)
            
            print(f"📊 Analysis Results:")
            print(f"   Audio duration: {len(full_audio) / config.sample_rate:.2f}s")
            print(f"   Voice frames: {sum(1 for _, is_speech in voice_timeline if is_speech)}/{len(voice_timeline)}")
            print(f"   Speech segments found: {len(speech_segments)}")
            
            for i, (start, end) in enumerate(speech_segments):
                print(f"   Segment {i+1}: {start:.2f}s - {end:.2f}s ({end-start:.2f}s)")
        
    finally:
        handler.cleanup()

if __name__ == "__main__":
    # Test options
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        asyncio.run(test_vad_system())
    else:
        asyncio.run(start_vad_conversation())
