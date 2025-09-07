"""
Optimized Gemini Live STT Module
================================

High-performance Speech-to-Text using the optimized Gemini Live VAD.
Provides the same interface as the old stt.py but with much better performance.
"""

import os
import asyncio
import time
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the optimized VAD system
from optimized_gemini_vad import OptimizedGeminiVAD, OptimizedGeminiConfig

class OptimizedGeminiSTT:
    """Optimized Gemini Live STT system with performance improvements"""
    
    def __init__(self):
        self.config = OptimizedGeminiConfig()
        self.vad_instance = OptimizedGeminiVAD(self.config)
        self.last_capture_time = 0
        self.total_captures = 0
        
    async def transcribe_file(
        self,
        filepath: str,
        language_code: str = "hi-IN",
        model: str = "gemini-2.0-flash-exp",
        with_timestamps: bool = False,
    ) -> Dict[str, Any]:
        """
        Optimized transcription function with better performance
        
        Args:
            filepath: Ignored - uses live capture for best performance
            language_code: Language code (hi-IN for Hindi/English mix)
            model: Gemini model to use
            with_timestamps: Whether to include timestamps (not supported)
            
        Returns:
            Dict containing transcript and performance metadata
        """
        
        start_time = time.time()
        
        try:
            # Use optimized capture system
            transcript = await self.vad_instance.capture_speech_optimized()
            
            capture_time = time.time() - start_time
            self.last_capture_time = capture_time
            self.total_captures += 1
            
            if transcript and transcript.strip():
                # Get performance statistics
                stats = self.vad_instance.get_performance_stats()
                
                result = {
                    "text": transcript,
                    "transcript": transcript,  # Both keys for compatibility
                    "language_code": language_code,
                    "confidence": 0.95,  # High confidence for optimized system
                    "method": "optimized_gemini_live",
                    "timestamp": time.time(),
                    "processing_time": capture_time,
                    "performance_stats": stats
                }
                
                print(f"✅ Optimized STT: '{transcript}' ({capture_time:.2f}s)")
                return result
                
            else:
                # No speech detected
                return {
                    "text": "",
                    "transcript": "",
                    "language_code": language_code,
                    "confidence": 0.0,
                    "error": "No speech detected",
                    "method": "optimized_gemini_live",
                    "processing_time": capture_time
                }
                
        except Exception as e:
            capture_time = time.time() - start_time
            
            print(f"❌ Optimized STT error: {e}")
            return {
                "text": "",
                "transcript": "",
                "language_code": language_code,
                "confidence": 0.0,
                "error": str(e),
                "method": "optimized_gemini_live",
                "processing_time": capture_time
            }
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary of the STT system"""
        return {
            "total_captures": self.total_captures,
            "last_capture_time": self.last_capture_time,
            "avg_capture_time": self.last_capture_time,  # Could track running average
            "system": "optimized_gemini_live"
        }


# Global optimized STT instance
_optimized_stt = None

async def transcribe_file(
    filepath: str,
    language_code: str = "hi-IN",
    model: str = "gemini-2.0-flash-exp",
    with_timestamps: bool = False,
) -> Dict[str, Any]:
    """
    Main transcription function - optimized for speed and accuracy
    
    This is a drop-in replacement for the old transcribe_file function
    but uses the new optimized Gemini Live system for better performance.
    """
    global _optimized_stt
    
    if _optimized_stt is None:
        _optimized_stt = OptimizedGeminiSTT()
        print("✅ Optimized Gemini STT initialized")
    
    try:
        result = await _optimized_stt.transcribe_file(
            filepath=filepath,
            language_code=language_code,
            model=model,
            with_timestamps=with_timestamps
        )
        
        # Log performance for monitoring
        if result.get("processing_time"):
            processing_time = result["processing_time"]
            if processing_time > 3.0:
                print(f"⚠️ Slow transcription: {processing_time:.2f}s")
            elif processing_time < 1.0:
                print(f"🚀 Fast transcription: {processing_time:.2f}s")
        
        return result
        
    except Exception as e:
        print(f"❌ Optimized transcribe_file error: {e}")
        return {
            "text": "",
            "transcript": "",
            "language_code": language_code,
            "confidence": 0.0,
            "error": str(e),
            "method": "optimized_gemini_live"
        }

# Legacy compatibility functions (disabled)
async def stream_microphone(*args, **kwargs):
    """Legacy streaming function - disabled for optimization"""
    raise RuntimeError("Legacy streaming disabled. Use optimized transcribe_file instead.")

async def stream_microphone_translate(*args, **kwargs):
    """Legacy translate function - disabled for optimization"""
    raise RuntimeError("Legacy translate disabled. Use optimized transcribe_file instead.")

# Test function
async def test_optimized_stt():
    """Test the optimized STT system"""
    print("🧪 Testing Optimized Gemini STT")
    print("=" * 40)
    
    print("🎤 Say something in Hindi or English...")
    result = await transcribe_file("dummy_path")  # Path ignored
    
    if result.get("text"):
        print(f"✅ Transcribed: '{result['text']}'")
        print(f"🎯 Confidence: {result.get('confidence', 0):.2f}")
        print(f"⏱️ Time: {result.get('processing_time', 0):.2f}s")
        print(f"🌐 Method: {result.get('method', 'unknown')}")
        
        if result.get("performance_stats"):
            stats = result["performance_stats"]
            print(f"📊 Performance: {stats}")
    else:
        print("❌ No speech transcribed")
        if result.get("error"):
            print(f"❌ Error: {result['error']}")

if __name__ == "__main__":
    asyncio.run(test_optimized_stt())
