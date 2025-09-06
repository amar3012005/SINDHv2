"""
Debug Gemini Live API Response Structure
=======================================
"""

import os
import sys
import asyncio
import time
import numpy as np
import sounddevice as sd
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

async def debug_gemini_live_transcript():
    """Debug the actual response structure from Gemini Live"""
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ No GEMINI_API_KEY found")
        return
    
    client = genai.Client(api_key=api_key)
    
    session_config = {
        "response_modalities": ["TEXT"],
        "input_audio_transcription": {},  # Enable input transcription
        "realtime_input_config": {
            "automatic_activity_detection": {
                "disabled": False,
                "prefix_padding_ms": 50,
                "silence_duration_ms": 1500,
            }
        },
    }
    
    print("🔍 Starting debug session...")
    
    try:
        async with client.aio.live.connect(
            model="gemini-live-2.5-flash-preview",
            config=session_config
        ) as session:
            
            is_listening = True
            speech_started = False
            
            # Audio capture setup
            audio_queue = asyncio.Queue(maxsize=100)
            
            def audio_callback(indata, frames, time_info, status):
                if is_listening and not audio_queue.full():
                    audio_data = (indata.flatten() * 32767).astype(np.int16).tobytes()
                    try:
                        audio_queue.put_nowait(audio_data)
                    except asyncio.QueueFull:
                        pass
            
            # Start audio stream
            stream = sd.InputStream(
                callback=audio_callback,
                samplerate=16000,
                channels=1,
                dtype=np.float32,
                blocksize=1600
            )
            
            async def send_audio():
                while is_listening:
                    try:
                        audio_data = await asyncio.wait_for(audio_queue.get(), timeout=0.1)
                        await session.send_realtime_input(
                            audio=types.Blob(
                                data=audio_data,
                                mime_type="audio/pcm;rate=16000"
                            )
                        )
                    except asyncio.TimeoutError:
                        continue
                    except Exception as e:
                        print(f"❌ Audio send error: {e}")
                        break
            
            async def receive_responses():
                nonlocal is_listening, speech_started
                start_time = time.time()
                
                print("🎤 Say something... (debugging responses)")
                
                async for response in session.receive():
                    print(f"\n🔍 DEBUG: Full response: {response}")
                    print(f"🔍 DEBUG: Response type: {type(response)}")
                    
                    if hasattr(response, 'server_content'):
                        print(f"🔍 DEBUG: Server content: {response.server_content}")
                        
                        if response.server_content and hasattr(response.server_content, 'input_transcription'):
                            print(f"🔍 DEBUG: Input transcription object: {response.server_content.input_transcription}")
                            
                            if response.server_content.input_transcription:
                                transcript_obj = response.server_content.input_transcription
                                print(f"🔍 DEBUG: Transcription attributes: {dir(transcript_obj)}")
                                
                                if hasattr(transcript_obj, 'text'):
                                    text = transcript_obj.text
                                    print(f"📝 TRANSCRIPT TEXT: '{text}'")
                                    
                                    if not speech_started and text:
                                        speech_started = True
                                        print("🗣️ First speech detected!")
                                
                                # Check for other attributes
                                for attr in ['partial', 'final', 'complete', 'finished', 'is_final']:
                                    if hasattr(transcript_obj, attr):
                                        value = getattr(transcript_obj, attr)
                                        print(f"🔍 DEBUG: {attr} = {value}")
                    
                    # Check for timeout
                    if time.time() - start_time > 15:  # 15 second timeout
                        print("⏰ Timeout reached")
                        is_listening = False
                        break
            
            with stream:
                await asyncio.gather(
                    send_audio(),
                    receive_responses(),
                    return_exceptions=True
                )
    
    except Exception as e:
        print(f"❌ Debug session failed: {e}")

if __name__ == "__main__":
    asyncio.run(debug_gemini_live_transcript())
