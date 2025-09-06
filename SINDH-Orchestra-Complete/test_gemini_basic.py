"""
Simple Test for Gemini Live API
===============================

Test the basic Gemini Live API functionality without the complex audio streaming
"""

import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_basic_gemini_live():
    """Test basic Gemini Live connection"""
    try:
        from google import genai
        from google.genai import types
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("❌ No GEMINI_API_KEY found")
            return
        
        client = genai.Client(api_key=api_key)
        print("✅ Gemini client initialized")
        
        # Test basic connection
        config = {"response_modalities": ["TEXT"]}
        model = "gemini-live-2.5-flash-preview"
        
        async with client.aio.live.connect(model=model, config=config) as session:
            print("✅ Live session connected successfully")
            
            # Send a simple text message
            await session.send_client_content(
                turns={"role": "user", "parts": [{"text": "Hello, can you hear me?"}]},
                turn_complete=True
            )
            
            # Receive response
            async for response in session.receive():
                if response.text is not None:
                    print(f"📝 Gemini response: {response.text}")
                    break
    
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_basic_gemini_live())
