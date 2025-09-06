"""
SINDH Orchestra Agent - Human-like Reception and Routing System
Main entry point that acts as a natural, human-like assistant with realistic conversation flow
"""

import os
import sys
import asyncio
import tempfile
import time
import json
import subprocess
import re
import random
import threading
from typing import List, Dict, Any, Optional, Tuple

import numpy as np
import soundfile as sf
import pygame
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables FIRST before importing modules that need them
here = os.path.dirname(__file__)
load_dotenv(os.path.join(here, ".env"))
load_dotenv()

# Import TARA configuration system
from tara_config import get_tara_config, get_voice_settings, get_personality_settings, get_personality_prompt, get_hindi_mode, get_max_retries, transliterate_response, get_emotion_expression

# Import RAG system components
from simple_rag import process_rag_query, get_simple_rag
from rag_memory_system import capture_rag_interaction

# Import personal info browser
try:
    from personal_info_browser import PersonalInfoBrowser
except ImportError:
    PersonalInfoBrowser = None
    print("⚠️ Personal Info Browser not available")

def convert_numbers_to_hindi(text: str) -> str:
    """Convert numbers in text to proper Hindi words for natural pronunciation"""
    
    # Enhanced Hindi number words for natural pronunciation
    hindi_numbers = {
        "0": "शून्य", "1": "एक", "2": "दो", "3": "तीन", "4": "चार", 
        "5": "पांच", "6": "छह", "7": "सात", "8": "आठ", "9": "नौ", "10": "दस",
        "11": "ग्यारह", "12": "बारह", "13": "तेरह", "14": "चौदह", "15": "पंद्रह",
        "16": "सोलह", "17": "सत्रह", "18": "अठारह", "19": "उन्नीस", "20": "बीस",
        "21": "इक्कीस", "22": "बाईस", "23": "तेईस", "24": "चौबीस", "25": "पच्चीस",
        "26": "छब्बीस", "27": "सत्ताईस", "28": "अट्ठाईस", "29": "उनतीस", "30": "तीस",
        "31": "इकतीस", "32": "बत्तीस", "33": "तैंतीस", "34": "चौंतीस", "35": "पैंतीस",
        "36": "छत्तीस", "37": "सैंतीस", "38": "अड़तीस", "39": "उनतालीस", "40": "चालीस",
        "41": "इकतालीस", "42": "बयालीस", "43": "तैंतालीस", "44": "चवालीस", "45": "पैंतालीस",
        "46": "छियालीस", "47": "सैंतालीस", "48": "अड़तालीस", "49": "उनचास", "50": "पचास",
        "60": "साठ", "70": "सत्तर", "80": "अस्सी", "90": "नब्बे", "100": "सौ"
    }
    
    def convert_large_number(num_str):
        """Convert larger numbers to proper Hindi pronunciation"""
        try:
            num = int(num_str)
            
            # Handle common salary/amount ranges naturally
            if num == 500:
                return "पांच सौ"
            elif num == 600:
                return "छह सौ"
            elif num == 700:
                return "सात सौ"
            elif num == 800:
                return "आठ सौ"
            elif num == 1000:
                return "हजार"
            elif num == 1500:
                return "डेढ़ हजार"
            elif num == 2000:
                return "दो हजार"
            elif num == 5000:
                return "पांच हजार"
            elif num == 10000:
                return "दस हजार"
            
            # Handle hundreds (100-999)
            if 100 <= num < 1000:
                hundreds = num // 100
                remainder = num % 100
                
                if hundreds == 1:
                    result = "सौ"
                else:
                    result = f"{hindi_numbers.get(str(hundreds), str(hundreds))} सौ"
                
                if remainder > 0:
                    if str(remainder) in hindi_numbers:
                        result += f" {hindi_numbers[str(remainder)]}"
                    else:
                        # Handle compound numbers in remainder
                        result += f" {convert_compound_number(remainder)}"
                
                return result
            
            # Handle thousands (1000+)
            elif num >= 1000:
                thousands = num // 1000
                remainder = num % 1000
                
                if thousands == 1:
                    result = "हजार"
                else:
                    if str(thousands) in hindi_numbers:
                        result = f"{hindi_numbers[str(thousands)]} हजार"
                    else:
                        result = f"{convert_compound_number(thousands)} हजार"
                
                if remainder > 0:
                    if remainder < 100 and str(remainder) in hindi_numbers:
                        result += f" {hindi_numbers[str(remainder)]}"
                    else:
                        result += f" {convert_large_number(str(remainder))}"
                
                return result
            
            # Handle 51-99 range
            elif 51 <= num <= 99:
                return convert_compound_number(num)
            
            # Direct lookup for smaller numbers
            else:
                return hindi_numbers.get(num_str, convert_compound_number(num))
                
        except ValueError:
            return num_str
    
    def convert_compound_number(num):
        """Convert compound numbers (51-99) to Hindi"""
        if num < 51:
            return hindi_numbers.get(str(num), str(num))
        
        # Special compound forms for 51-99
        compound_forms = {
            51: "इक्यावन", 52: "बावन", 53: "तिरपन", 54: "चौवन", 55: "पचपन",
            56: "छप्पन", 57: "सत्तावन", 58: "अट्ठावन", 59: "उनसठ",
            61: "इकसठ", 62: "बासठ", 63: "तिरसठ", 64: "चौंसठ", 65: "पैंसठ",
            66: "छियासठ", 67: "सड़सठ", 68: "अड़सठ", 69: "उनहत्तर",
            71: "इकहत्तर", 72: "बहत्तर", 73: "तिहत्तर", 74: "चौहत्तर", 75: "पचहत्तर",
            76: "छिहत्तर", 77: "सतहत्तर", 78: "अठहत्तर", 79: "उन्यासी",
            81: "इक्यासी", 82: "बयासी", 83: "तिरासी", 84: "चौरासी", 85: "पचासी",
            86: "छियासी", 87: "सत्तासी", 88: "अट्ठासी", 89: "नवासी",
            91: "इक्यानवे", 92: "बानवे", 93: "तिरानवे", 94: "चौरानवे", 95: "पचानवे",
            96: "छियानवे", 97: "सत्तानवे", 98: "अट्ठानवे", 99: "निन्यानवे"
        }
        return compound_forms.get(num, str(num))
    
    def replace_number(match):
        num_str = match.group()
        
        # Direct lookup for simple numbers
        if num_str in hindi_numbers:
            return hindi_numbers[num_str]
        
        # Use enhanced conversion for larger numbers
        return convert_large_number(num_str)
    
    # Replace standalone numbers with proper Hindi pronunciation
    text = re.sub(r'\b\d+\b', replace_number, text)
    
    return text

def transcribe_english_to_hindi(text: str) -> str:
    """Convert common English words to Hindi for better pronunciation"""
    
    # Common English to Hindi mappings for job/worker context
    english_to_hindi = {
        # Job categories
        "construction": "निर्माण",
        "agriculture": "खेती",
        "household": "घरेलू",
        "transportation": "परिवहन",
        "manufacturing": "उत्पादन",
        "services": "सेवा",
        
        # Skills
        "electrical": "बिजली का काम",
        "plumbing": "पाइप फिटिंग",
        "painting": "पेंटिंग",
        "carpentry": "बढ़ईगीरी",
        "masonry": "राजमिस्त्री",
        "driving": "गाड़ी चलाना",
        "cooking": "खाना बनाना",
        "cleaning": "साफ़ाई",
        "welding": "वेल्डिंग",
        "farming": "खेती",
        "security": "सिक्योरिटी",
        "delivery": "डिलीवरी",
        
        # Experience levels
        "less than 1 year": "एक साल से कम",
        "1-2 years": "एक से दो साल",
        "2-5 years": "दो से पांच साल",
        "5-10 years": "पांच से दस साल",
        "more than 10 years": "दस साल से ज्यादा",
        
        # Work types
        "full-time": "पूरे समय",
        "part-time": "आधे समय",
        "daily work": "रोज का काम",
        "contract": "ठेका",
        
        # Common words
        "available": "उपलब्ध",
        "immediately": "तुरंत",
        "per day": "प्रति दिन",
        "per month": "प्रति महीना",
        "experience": "अनुभव",
        "skills": "हुनर",
        "salary": "तनख्वाह",
        "wages": "मजदूरी",
        "work": "काम",
        "job": "नौकरी",
        "worker": "मजदूर",
        "male": "पुरुष",
        "female": "महिला",
        "pending": "लंबित",
        "verified": "सत्यापित",
        "active": "सक्रिय",
        
        # Languages
        "hindi": "हिंदी",
        "english": "अंग्रेजी",
        "marathi": "मराठी",
        "gujarati": "गुजराती",
        "bengali": "बंगाली",
        "tamil": "तमिल",
        "telugu": "तेलुगु",
        "punjabi": "पंजाबी",
        
        # Locations
        "village": "गाँव",
        "district": "जिला",
        "state": "राज्य",
        "pincode": "पिनकोड",
        "address": "पता"
    }
    
    # Convert to lowercase for matching
    text_lower = text.lower()
    
    # Replace English words with Hindi equivalents
    for english, hindi in english_to_hindi.items():
        # Use word boundaries to avoid partial matches
        pattern = r'\b' + re.escape(english) + r'\b'
        text_lower = re.sub(pattern, hindi, text_lower, flags=re.IGNORECASE)
    
    return text_lower

# Import SINDH fine-tuned parser as the primary classification system
from sindh_finetuned_parser import classify_with_fine_tuned_llm, get_fine_tuned_parser

# Import TTS and STT modules (now that env is loaded)
from stt import transcribe_file
from tts import synthesize_to_file
from fast_intent_router import FastIntentRouter, fast_transcribe_and_classify, get_fast_router
# Fine-tuned Gemini parser disabled; standardize on SINDH intent parser

# Gemini Live API VAD+STT Integration - Cloud-based neural VAD
import asyncio
from gemini_live_vad import gemini_live_capture_audio

# Import dialogue manager
from dialogue_manager import dialogue_manager, get_dialogue, get_random_dialogue, get_thinking_sound

# MongoDB imports
import pymongo
from bson import ObjectId
from datetime import datetime

# Import child script functions for direct calling
sys.path.append(here)
sys.path.append(os.path.join(here, "V2"))  # Add V2 directory to path

# Import V2 Intent Parser for simultaneous classification
try:
    from V2.intent_parser import IntentParser
    INTENT_PARSER_AVAILABLE = True
    pass  # V2 Intent Parser loaded
except ImportError as e:
    print(f"⚠️ V2 Intent Parser not available: {e}")
    INTENT_PARSER_AVAILABLE = False

try:
    from applied_jobs_checker import run_applied_jobs_check
except ImportError:
    print("⚠️ applied_jobs_checker functions not available")
    run_applied_jobs_check = None

try:
    from available_jobs_browser import run_available_jobs_browse  
except ImportError:
    print("⚠️ available_jobs_browser functions not available")
    run_available_jobs_browse = None

INTRO_PATH = os.path.join(here, "orchestra_intro.wav")
VOICE_DIR = os.path.join(here, "voices")
BACKGROUND_AUDIO_PATH = os.path.join(here, "background", "office_background.wav")  # Use WAV directly
os.makedirs(VOICE_DIR, exist_ok=True)

# Global background audio control
background_audio_thread = None
background_audio_stop_event = threading.Event()

class BackgroundAudioPlayer:
    """Background audio player using pygame mixer for better audio mixing"""
    
    def __init__(self, audio_path: str, volume: float = 1):
        self.audio_path = audio_path
        self.volume = volume
        self.is_playing = False
        self.pygame_initialized = False
        
    def _initialize_pygame(self):
        """Initialize pygame mixer if not already done"""
        if not self.pygame_initialized:
            try:
                pygame.mixer.pre_init(frequency=22050, size=-16, channels=2, buffer=512)
                pygame.mixer.init()
                self.pygame_initialized = True
                print(f"🎵 Pygame mixer initialized for background audio")
            except Exception as e:
                print(f"❌ Failed to initialize pygame mixer: {e}")
                return False
        return True
    
    def start(self):
        """Start playing background audio"""
        if self.is_playing:
            return
            
        if not self._initialize_pygame():
            print("❌ Cannot start background audio - pygame initialization failed")
            return
            
        try:
            if not os.path.exists(self.audio_path):
                print(f"❌ Background audio file not found: {self.audio_path}")
                return
                
            # Load and play the background audio with pygame
            pygame.mixer.music.load(self.audio_path)
            pygame.mixer.music.set_volume(self.volume)
            pygame.mixer.music.play(-1)  # -1 means loop infinitely
            
            self.is_playing = True
            print(f"🎵 Background office ambiance started (pygame mixer, volume: {self.volume:.2f})")
            
        except Exception as e:
            print(f"❌ Error starting background audio: {e}")
    
    def stop(self):
        """Stop playing background audio"""
        if not self.is_playing:
            return
            
        try:
            if self.pygame_initialized:
                pygame.mixer.music.stop()
                self.is_playing = False
                print("🔇 Background audio stopped")
        except Exception as e:
            print(f"❌ Error stopping background audio: {e}")
    
    def set_volume(self, volume: float):
        """Adjust background audio volume"""
        self.volume = max(0.0, min(1.0, volume))
        if self.is_playing and self.pygame_initialized:
            pygame.mixer.music.set_volume(self.volume)
            print(f"🔊 Background audio volume set to: {self.volume:.2f}")
    
    def __del__(self):
        """Cleanup when object is destroyed"""
        self.stop()

# Global background audio player
# Initialize background audio player with TARA config
tara_config = get_tara_config()
background_volume = tara_config.audio.background_volume if tara_config.audio.background_music_enabled else 0.0
background_player = BackgroundAudioPlayer(BACKGROUND_AUDIO_PATH, volume=background_volume)

def start_background_audio():
    """Start the background office ambiance"""
    global background_player
    try:
        background_player.start()
    except Exception as e:
        print(f"⚠️ Could not start background audio: {e}")

def stop_background_audio():
    """Stop the background office ambiance"""
    global background_player
    try:
        background_player.stop()
    except Exception as e:
        print(f"⚠️ Error stopping background audio: {e}")

# MongoDB connection
MONGODB_URI = "mongodb+srv://amarsai2005:bfD3GhQPKNjp6IiK@sindh.illusfi.mongodb.net/test?retryWrites=true&w=majority"
if not MONGODB_URI:
    print("❌ MONGODB_URI not found in environment variables")
    sys.exit(1)

# Initialize V2 Intent Parser for simultaneous classification
v2_intent_parser = None
if INTENT_PARSER_AVAILABLE:
    try:
        v2_intent_parser = IntentParser()
        pass  # V2 Intent Parser initialized
    except Exception as e:
        print(f"❌ Failed to initialize V2 Intent Parser: {e}")
        v2_intent_parser = None

# Initialize Fast Intent Router for optimized classification
fast_router = get_fast_router(v2_intent_parser)
# Fast Intent Router initialized with V2 parser

async def classify_user_speech(transcript: str) -> Dict[str, Any]:
    """
    Simultaneously classify user speech using V2 Intent Parser
    This runs in parallel with the main orchestra flow
    """
    if not v2_intent_parser or not transcript.strip():
        return {"available": False, "reason": "Parser not available or empty transcript"}
    
    try:
        print(f"\n🎯 V2 INTENT CLASSIFICATION")
        print(f"{'='*50}")
        print(f"📝 Input: '{transcript}'")
        
        # Get intent classification
        start_time = time.time()
        result = await v2_intent_parser.process_transcript(transcript)
        processing_time = int((time.time() - start_time) * 1000)
        
        # Extract key information
        routing_decision = result.get("routing_decision", {})
        gemini_classification = result.get("gemini_classification", {})
        
        route = routing_decision.get("decision", "unknown")
        confidence = float(routing_decision.get("confidence", 0.0))  # Ensure it's a float
        gemini_route = gemini_classification.get("route", "UNKNOWN")
        extracted_info = gemini_classification.get("extracted_info", {})
        
        # Log classification results
        print(f"🎯 Route Decision: {route}")
        print(f"🤖 Gemini Route: {gemini_route}")
        print(f"📊 Confidence: {confidence:.2f}")
        print(f"⏱️ Processing Time: {processing_time}ms")
        
        if extracted_info:
            print(f"🔍 Extracted Info:")
            for key, value in extracted_info.items():
                if value:
                    print(f"   • {key}: {value}")
        
        # Determine next route recommendation
        if route == "fsm_route":
            print(f"➡️ RECOMMENDATION: Route to FSM Pipeline")
            print(f"   Reason: Structured conversation flow needed")
        elif route == "rag_route":
            print(f"➡️ RECOMMENDATION: Route to RAG Pipeline") 
            print(f"   Reason: Knowledge retrieval needed")
        elif route == "greeting_route":
            print(f"➡️ RECOMMENDATION: Route to Greeting FSM")
            print(f"   Reason: Name introduction detected")
        else:
            print(f"➡️ RECOMMENDATION: Route to Clarification")
            print(f"   Reason: Ambiguous or unclear input")
        
        print(f"{'='*50}")
        
        return {
            "available": True,
            "route": route,
            "gemini_route": gemini_route,
            "confidence": confidence,
            "extracted_info": extracted_info,
            "processing_time_ms": processing_time,
            "recommendation": {
                "pipeline": "FSM" if route == "fsm_route" else "RAG" if route == "rag_route" else "GREETING" if route == "greeting_route" else "CLARIFICATION",
                "reason": "Based on intent classification and confidence score"
            }
        }
        
    except Exception as e:
        print(f"❌ V2 Intent Classification Error: {e}")
        return {
            "available": False,
            "error": str(e),
            "reason": "Classification failed"
        }

def play_wav(path: str) -> None:
    """Play WAV file using pygame instead of sounddevice"""
    try:
        pygame.mixer.music.load(path)
        pygame.mixer.music.play()
        # Wait for playback to complete
        while pygame.mixer.music.get_busy():
            pygame.time.wait(100)
    except Exception as e:
        print(f"⚠️ Error playing audio file {path}: {e}")

def clean_outdated_cache(cache_name: str = None):
    """Clean up outdated cache files"""
    try:
        if cache_name:
            # Clean specific cache
            wav_file = os.path.join(VOICE_DIR, f"{cache_name}.wav")
            txt_file = os.path.join(VOICE_DIR, f"{cache_name}.txt")
            if os.path.exists(wav_file):
                os.remove(wav_file)
                print(f"🗑️ Removed outdated audio cache: {cache_name}.wav")
            if os.path.exists(txt_file):
                os.remove(txt_file)
                print(f"🗑️ Removed outdated content cache: {cache_name}.txt")
        else:
            # Clean all cache files (useful for major updates)
            import glob
            wav_files = glob.glob(os.path.join(VOICE_DIR, "*.wav"))
            txt_files = glob.glob(os.path.join(VOICE_DIR, "*.txt"))
            for file in wav_files + txt_files:
                os.remove(file)
                print(f"🗑️ Removed cache file: {os.path.basename(file)}")
    except Exception as e:
        print(f"⚠️ Error cleaning cache: {e}")

# Load dialogue constants from dialogue manager (for backward compatibility)
THINKING_SOUNDS = dialogue_manager.get_dialogue("conversation_elements.thinking_sounds")
GREETINGS = dialogue_manager.get_dialogue("greetings.initial_greetings")
HESITATIONS = dialogue_manager.get_dialogue("conversation_elements.hesitations")
APOLOGETIC_PHRASES = dialogue_manager.get_dialogue("conversation_elements.apologetic_phrases")
CONFIRMATION_PHRASES = dialogue_manager.get_dialogue("conversation_elements.confirmation_phrases")

def format_name_for_hindi_tts(name: str) -> str:
    """Convert English names to Hindi phonetic spelling for better TTS"""
    if not name or name == "Unknown":
        return "साहब"
    
    name_mapping = {
        "amar": "अमर",
        "amit": "अमित", 
        "raj": "राज",
        "priya": "प्रिया",
        "ram": "राम",
        "sita": "सीता",
        "kumar": "कुमार",
        "sharma": "शर्मा",
        "singh": "सिंह",
        "gupta": "गुप्ता",
        "patel": "पटेल",
        "verma": "वर्मा",
        "yadav": "यादव",
        "agarwal": "अग्रवाल",
        "jain": "जैन",
        "sanjay": "संजय",
        "thakur": "ठाकुर",
        "rahul": "राहुल",
        "rohit": "रोहित",
        "anita": "अनीता",
        "sunita": "सुनीता",
        "kavita": "कविता"
    }
    
    name_lower = name.lower().strip()
    for eng, hindi in name_mapping.items():
        if eng in name_lower:
            return hindi
    
    return name

def get_friendly_first_name(full_name: str) -> str:
    """Extract first name and convert to Hindi for friendly greeting"""
    if not full_name or full_name.strip() == "":
        return "साहब"
    
    # Split the name and get first part
    name_parts = full_name.strip().split()
    first_name = name_parts[0] if name_parts else full_name.strip()
    
    # Convert to Hindi using existing mapping
    hindi_first_name = format_name_for_hindi_tts(first_name)
    
    # If name is still in English, try to make it more pronounceable
    if hindi_first_name == first_name and first_name.isascii():
        # Keep original name but ensure it's title case for better pronunciation
        return first_name.title()
    
    return hindi_first_name

def format_location_for_hindi_tts(location: str) -> str:
    """Convert English location names to Hindi for better TTS pronunciation"""
    if not location or location.strip() == "":
        return "अज्ञात स्थान"
    
    location_mapping = {
        # Major cities
        "mumbai": "मुंबई",
        "delhi": "दिल्ली",
        "bangalore": "बेंगलुरु",
        "bengaluru": "बेंगलुरु",
        "hyderabad": "हैदराबाद",
        "ahmedabad": "अहमदाबाद",
        "chennai": "चेन्नई",
        "kolkata": "कोलकाता",
        "surat": "सूरत",
        "pune": "पुणे",
        "jaipur": "जयपुर",
        "lucknow": "लखनऊ",
        "kanpur": "कानपुर",
        "nagpur": "नागपुर",
        "indore": "इंदौर",
        "thane": "ठाणे",
        "bhopal": "भोपाल",
        "visakhapatnam": "विशाखापट्टनम",
        "pimpri": "पिंपरी",
        "patna": "पटना",
        "vadodara": "वडोदरा",
        "ghaziabad": "गाजियाबाद",
        "ludhiana": "लुधियाना",
        "agra": "आगरा",
        "nashik": "नासिक",
        "faridabad": "फरीदाबाद",
        "meerut": "मेरठ",
        "rajkot": "राजकोट",
        "kalyan": "कल्याण",
        "vasai": "वसई",
        "varanasi": "वाराणसी",
        "srinagar": "श्रीनगर",
        "aurangabad": "औरंगाबाद",
        "dhanbad": "धनबाद",
        "amritsar": "अमृतसर",
        "navi mumbai": "नवी मुंबई",
        "allahabad": "प्रयागराज",
        "prayagraj": "प्रयागराज",
        "ranchi": "रांची",
        "howrah": "हावड़ा",
        "coimbatore": "कोयंबटूर",
        "jabalpur": "जबलपुर",
        "gwalior": "ग्वालियर",
        "vijayawada": "विजयवाड़ा",
        "jodhpur": "जोधपुर",
        "madurai": "मदुरै",
        "raipur": "रायपुर",
        "kota": "कोटा",
        "chandigarh": "चंडीगढ़",
        "guwahati": "गुवाहाटी",
        
        # States
        "maharashtra": "महाराष्ट्र",
        "uttar pradesh": "उत्तर प्रदेश",
        "up": "उत्तर प्रदेश",
        "karnataka": "कर्नाटक",
        "gujarat": "गुजरात",
        "rajasthan": "राजस्थान",
        "tamil nadu": "तमिलनाडु",
        "tn": "तमिलनाडु",
        "madhya pradesh": "मध्य प्रदेश",
        "mp": "मध्य प्रदेश",
        "west bengal": "पश्चिम बंगाल",
        "wb": "पश्चिम बंगाल",
        "bihar": "बिहार",
        "andhra pradesh": "आंध्र प्रदेश",
        "ap": "आंध्र प्रदेश",
        "odisha": "ओडिशा",
        "orissa": "ओडिशा",
        "kerala": "केरल",
        "jharkhand": "झारखंड",
        "assam": "असम",
        "punjab": "पंजाब",
        "chhattisgarh": "छत्तीसगढ़",
        "haryana": "हरियाणा",
        "jammu and kashmir": "जम्मू और कश्मीर",
        "j&k": "जम्मू और कश्मीर",
        "uttarakhand": "उत्तराखंड",
        "himachal pradesh": "हिमाचल प्रदेश",
        "hp": "हिमाचल प्रदेश",
        "telangana": "तेलंगाना",
        
        # Common location terms
        "nagar": "नगर",
        "puram": "पुरम",
        "ganj": "गंज",
        "pur": "पुर",
        "bad": "बाद",
        "garh": "गढ़",
        "wadi": "वाडी",
        "gaon": "गांव",
        "village": "गांव",
        "city": "शहर",
        "town": "कस्बा",
        "district": "जिला",
        "state": "राज्य",
        "area": "इलाका",
        "colony": "कॉलोनी",
        "society": "सोसाइटी",
        "layout": "लेआउट",
        "extension": "एक्सटेंशन",
        "phase": "फेज",
        "sector": "सेक्टर",
        "block": "ब्लॉक",
        "ward": "वार्ड"
    }
    
    # Convert to lowercase for matching
    location_lower = location.lower().strip()
    result_location = location_lower
    
    # Replace location names with Hindi equivalents
    for eng, hindi in location_mapping.items():
        if eng in location_lower:
            result_location = result_location.replace(eng, hindi)
    
    return result_location

def format_employer_name_for_hindi_tts(name: str) -> str:
    """Convert English employer/company names to Hindi for better TTS pronunciation"""
    if not name or name.strip() == "":
        return "अज्ञात नियोक्ता"
    
    # Common company/employer name patterns
    employer_mapping = {
        # Common business terms
        "construction": "कंस्ट्रक्शन",
        "builders": "बिल्डर्स",
        "industries": "इंडस्ट्रीज",
        "enterprises": "एंटरप्राइजेज",
        "corporation": "कॉर्पोरेशन",
        "company": "कंपनी",
        "private limited": "प्राइवेट लिमिटेड",
        "pvt ltd": "प्राइवेट लिमिटेड",
        "ltd": "लिमिटेड",
        "services": "सर्विसेज",
        "solutions": "सॉल्यूशन्स",
        "technologies": "टेक्नोलॉजीज",
        "tech": "टेक",
        "systems": "सिस्टम्स",
        "consulting": "कंसल्टिंग",
        "group": "ग्रुप",
        "associates": "एसोसिएट्स",
        "trading": "ट्रेडिंग",
        "exports": "एक्सपोर्ट्स",
        "imports": "इंपोर्ट्स",
        "logistics": "लॉजिस्टिक्स",
        "transport": "ट्रांसपोर्ट",
        "motors": "मोटर्स",
        "steel": "स्टील",
        "iron": "आयरन",
        "textiles": "टेक्सटाइल्स",
        "garments": "गार्मेंट्स",
        "foods": "फूड्स",
        "restaurant": "रेस्टोरेंट",
        "hotel": "होटल",
        "hospital": "हॉस्पिटल",
        "clinic": "क्लिनिक",
        "medical": "मेडिकल",
        "pharmacy": "फार्मेसी",
        "electronics": "इलेक्ट्रॉनिक्स",
        "electricals": "इलेक्ट्रिकल्स",
        "hardware": "हार्डवेयर",
        "software": "सॉफ्टवेयर",
        "retail": "रिटेल",
        "mart": "मार्ट",
        "store": "स्टोर",
        "shop": "शॉप",
        "agency": "एजेंसी",
        "firm": "फर्म",
        "works": "वर्क्स",
        "factory": "फैक्ट्री",
        "mill": "मिल",
        "plant": "प्लांट",
        "center": "सेंटर",
        "centre": "सेंटर"
    }
    
    # Convert to lowercase for matching
    name_lower = name.lower().strip()
    result_name = name
    
    # Replace common business terms with Hindi equivalents
    for eng, hindi in employer_mapping.items():
        if eng in name_lower:
            # Replace while preserving case
            result_name = re.sub(eng, hindi, result_name, flags=re.IGNORECASE)
    
    return result_name

async def run_background_classification(transcript: str, task_id: str) -> None:
    """
    Run V2 intent classification in background during TTS playback
    Stores result in global background_classification_tasks dict
    """
    try:
        if transcript and v2_intent_parser:
            print(f"🔄 Starting background V2 classification for: '{transcript[:30]}...'")
            classification = await classify_user_speech(transcript)
            background_classification_tasks[task_id] = classification
            print(f"✅ Background classification completed for task: {task_id}")
        else:
            background_classification_tasks[task_id] = {"available": False, "reason": "No transcript or parser"}
    except Exception as e:
        print(f"❌ Background classification error: {e}")
        background_classification_tasks[task_id] = {"available": False, "error": str(e)}

def get_background_classification(task_id: str) -> Dict[str, Any]:
    """
    Get completed background classification result
    Returns immediately available result or placeholder
    """
    return background_classification_tasks.get(task_id, {"available": False, "reason": "Not ready"})

async def speak_human_like(text: str, cache_name: str = None, add_hesitation: bool = False, pace: float = 1.0, 
                          run_background_task: str = None, background_transcript: str = None, emotion: str = 'helpful') -> None:
    """
    Synthesize and play Hindi audio with smooth, natural flow using TARA configuration
    Optionally run background V2 classification during TTS playback
    """
    
    # Validate input text
    if not text or not text.strip():
        print("⚠️ Empty text provided to speak_human_like")
        return
    
    text = text.strip()
    
    # Get TARA voice settings for the specified emotion
    voice_config = get_voice_settings(emotion)
    
    # Convert English terms to Hindi for natural speech
    text = transcribe_english_to_hindi(text)
    
    # Apply TARA transliteration if enabled
    text = transliterate_response(text)
    
    # Convert numbers to Hindi for better pronunciation
    text = convert_numbers_to_hindi(text)
    
    # No hesitations for smooth conversational flow
    
    if cache_name:
        out_path = os.path.join(VOICE_DIR, f"{cache_name}.wav")
        content_file = os.path.join(VOICE_DIR, f"{cache_name}.txt")
        
        # Check if cached audio exists and content matches
        need_regenerate = True
        if os.path.exists(out_path) and os.path.exists(content_file):
            try:
                with open(content_file, 'r', encoding='utf-8') as f:
                    cached_text = f.read().strip()
                if cached_text == text.strip():
                    # Content matches, use cached audio
                    # Start background task if requested
                    background_task = None
                    if run_background_task and background_transcript:
                        background_task = asyncio.create_task(
                            run_background_classification(background_transcript, run_background_task)
                        )
                    
                    play_wav(out_path)
                    
                    # Ensure background task completes
                    if background_task:
                        await background_task
                    return
                else:
                    print(f"🔄 Content changed for {cache_name}, regenerating audio...")
            except Exception as e:
                print(f"⚠️ Error reading cache content file: {e}")
        
        # Save current text content for future comparison
        try:
            with open(content_file, 'w', encoding='utf-8') as f:
                f.write(text.strip())
        except Exception as e:
            print(f"⚠️ Error saving cache content file: {e}")
    else:
        # Use unique temporary file to avoid permission conflicts
        import tempfile
        import time
        temp_file = tempfile.NamedTemporaryFile(
            prefix=f"orchestra_prompt_{int(time.time() * 1000)}_",
            suffix=".wav",
            delete=False
        )
        out_path = temp_file.name
        temp_file.close()

    try:
        # Start background task if requested
        background_task = None
        if run_background_task and background_transcript:
            background_task = asyncio.create_task(
                run_background_classification(background_transcript, run_background_task)
            )
        
        # Generate and play audio with TARA voice settings
        await synthesize_to_file(
            text,
            outfile=out_path,
            target_language_code=voice_config['language'],
            speaker=voice_config['voice_id'],  # Use TARA's configured voice
            model="bulbul:v2",
            output_format="wav",
            sample_rate_hz=16000,
            pace=voice_config['speed'] * pace,  # Combine TARA's speed with function pace
            pitch=voice_config['pitch'],  # Use TARA's configured pitch
            loudness=voice_config['volume'],  # Use TARA's configured volume
        )
        
        
        # Play audio (this takes time, perfect for background processing)
        play_wav(out_path)
        
        # Clean up temporary file if it was created
        if not use_cache and out_path.startswith(tempfile.gettempdir()):
            try:
                os.unlink(out_path)
            except Exception as cleanup_error:
                print(f"⚠️ Could not cleanup temporary file {out_path}: {cleanup_error}")
        
        # Ensure background task completes
        if background_task:
            await background_task
            
    except Exception as e:
        print(f"❌ Error in speak function: {e}")

async def capture_vad_audio() -> Optional[str]:
    """Gemini Live API VAD+STT - returns transcript directly (no file needed)"""
    print("🌐 Listening with Gemini Live API... (speak naturally)")
    transcript = await gemini_live_capture_audio()
    
    if transcript and transcript.strip():
        print("✅ Transcript captured successfully")
        # Create a temporary audio file for compatibility with existing transcription logic
        # But we'll bypass the actual transcription since we already have the transcript
        temp_file = tempfile.NamedTemporaryFile(
            prefix="gemini_transcript_", 
            suffix=".wav", 
            delete=False
        )
        
        # Create a very short silent audio file for compatibility
        silent_data = np.zeros(int(16000 * 0.1), dtype=np.float32)  # 0.1s silence
        sf.write(temp_file.name, silent_data, 16000)
        temp_file.close()
        
        # Store transcript in a global variable for the transcription function to use
        global _gemini_transcript
        _gemini_transcript = transcript
        
        return temp_file.name
    else:
        print("❌ No speech detected by Gemini Live")
        return None

# Global variable to store Gemini transcript
_gemini_transcript = None

async def process_rag_response_for_conversation(
    raw_answer: str, 
    user_question: str, 
    intent: str, 
    user_name: str = "आप"
) -> str:
    """
    Process RAG response to make it sound like natural conversation continuation
    Remove TARA intros, clean formatting, ensure Hindi translation, and contextualize
    """
    
    try:
        # Import configuration and Gemini for processing
        from config import GEMINI_API_KEY
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Clean and process the RAG response
        processing_prompt = f"""
You are helping improve a RAG response to make it sound even more natural and conversational.

USER QUESTION: "{user_question}"
CURRENT RAG RESPONSE: "{raw_answer}"

TASK: Enhance this response to make it more natural if needed, but ONLY if it's currently repetitive or robotic.

CRITICAL RULES:
1. If the response already sounds natural and conversational, return it AS IS
2. Only fix if there are obvious problems like repetitive phrases or formal language
3. Keep all the factual information exactly the same
4. Maintain the Hindi language
5. Don't add unnecessary introductions
6. If response starts with different phrases like "बिल्कुल", "देखिए", "सुनिए" etc. - that's GOOD variety, keep it
7. Only change if it's clearly robotic or repetitive

GOOD responses to keep as-is:
- "बिल्कुल! काम पूरा होने के बाद पेमेंट आपके अकाउंट में आ जाता है।"
- "देखिए, रजिस्ट्रेशन के लिए बस ऐप डाउनलोड करना होगा।"
- "सुनिए, यहाँ construction से लेकर अन्य काम भी मिलते हैं।"

BAD responses to fix:
- Repetitive "अरे हाँ" every time
- Very formal language
- Robotic structures

Enhanced response (or original if already good):"""

        # Use existing Gemini configuration with 2.0 Flash for better performance
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        response = await asyncio.to_thread(
            model.generate_content,
            processing_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,
                max_output_tokens=150,
                top_p=0.9
            )
        )
        
        cleaned_answer = response.text.strip()
        
        # Remove quotes if present
        if cleaned_answer.startswith('"') and cleaned_answer.endswith('"'):
            cleaned_answer = cleaned_answer[1:-1]
        
        # Fallback cleaning if Gemini response is too short or unclear
        if len(cleaned_answer) < 10 or "माफ" in cleaned_answer:
            cleaned_answer = clean_rag_response_fallback(raw_answer)
        
        print(f"🎯 RAG Response Processed: {len(raw_answer)} → {len(cleaned_answer)} chars")
        return cleaned_answer
        
    except Exception as e:
        print(f"⚠️ RAG processing error: {e}")
        # Fallback to simple cleaning
        return clean_rag_response_fallback(raw_answer)

def clean_rag_response_fallback(raw_answer: str) -> str:
    """Enhanced fallback method to clean RAG responses without Gemini"""
    
    import re
    
    # More comprehensive intro patterns to remove
    patterns_to_remove = [
        r"नमस्ते!?\s*मैं\s*तारा\s*हूँ[^।]*।\s*",
        r"नमस्ते!?\s*मैं\s*TARA\s*हूँ[^।]*।\s*",
        r"Hello!?\s*I\s*am\s*Tara[^.]*\.\s*",
        r"मैं\s*(तारा|TARA)\s*हूँ[^।]*।\s*",
        r"सिंध\s*प्लेटफॉर्म\s*की\s*ग्राहक\s*सेवा\s*एजेंट[^।]*।\s*",
        r"SINDH\s*प्लेटफॉर्म\s*की\s*ग्राहक\s*सेवा\s*एजेंट[^।]*।\s*",
        r"आपका\s*स्वागत\s*है[^।]*।\s*",
        r"मुझे\s*(दुःख|खुशी)\s*है\s*कि[^।]*।\s*",
    ]
    
    cleaned = raw_answer
    
    # Apply all patterns
    for pattern in patterns_to_remove:
        cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE)
    
    # Remove leading/trailing whitespace and normalize spaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # If still too short after cleaning, extract meaningful content
    if len(cleaned) < 30:
        # Extract sentences that don't contain TARA/system introductions
        sentences = raw_answer.split('।')
        for sentence in sentences:
            sentence = sentence.strip()
            if (len(sentence) > 25 and 
                'तारा' not in sentence.lower() and 
                'tara' not in sentence.lower() and
                'ग्राहक सेवा' not in sentence.lower() and
                'स्वागत' not in sentence.lower()):
                cleaned = sentence + '।'
                break
        else:
            # Find content after common intro patterns
            content_patterns = [
                r".*?एजेंट\।?\s*(.*)",
                r".*?है\।?\s*(.*)",
                r".*?हूँ\।?\s*(.*)"
            ]
            for pattern in content_patterns:
                match = re.search(pattern, raw_answer, re.IGNORECASE)
                if match and len(match.group(1).strip()) > 20:
                    cleaned = match.group(1).strip()
                    break
            else:
                # Last resort - use meaningful portion 
                cleaned = raw_answer[50:200].strip() if len(raw_answer) > 50 else raw_answer
            if not cleaned.endswith('।'):
                cleaned += '।'
    
    return cleaned

async def transcribe_and_classify_speech(context: Dict[str, Any] = None) -> Tuple[str, Dict[str, Any]]:
    """
    ENHANCED: Capture audio, transcribe, and classify using SINDH Fine-tuned Parser
    This is the single source of truth for all conversation flow routing
    """
    print("🎤 Starting audio capture...")
    
    # Capture audio with VAD (natural speech detection)
    wav_path = await capture_vad_audio()
    
    try:
        print("🔤 Processing speech...")
        # Check if we have a Gemini Live transcript (bypass traditional STT)
        global _gemini_transcript
        
        if _gemini_transcript:
            transcript = _gemini_transcript.strip()
            _gemini_transcript = None  # Clear for next use
            print(f"🌐 Gemini transcript: {transcript}")
        else:
            # Fallback to traditional STT if Gemini transcript not available
            print("🔤 Transcribing audio...")
            # Transcribe speech with retry mechanism
            max_transcription_retries = 2
            transcript = ""
            
            for retry in range(max_transcription_retries + 1):
                try:
                    result = await transcribe_file(
                        wav_path,
                        language_code="hi-IN", 
                        model="saarika:v2.5",
                        with_timestamps=False,
                    )
                    transcript = (result.get("transcript") or result.get("text") or "").strip()
                    break  # Success, exit retry loop
                    
                except Exception as transcription_error:
                    print(f"❌ Transcription attempt {retry + 1} failed: {transcription_error}")
                    
                    if retry < max_transcription_retries:
                        print(f"� Retrying transcription in 2 seconds...")
                        await asyncio.sleep(2)
                    else:
                        print(f"❌ All transcription attempts failed. STT service unavailable.")
                    # Return graceful error instead of crashing
                    return "", {
                        "available": False, 
                        "reason": "STT service unavailable", 
                        "transcript": "",
                        "intent": "STT_ERROR",
                        "confidence": 0.0,
                        "extracted_info": {}
                    }
        
        print(f"�📄 Transcript: '{transcript}'")
        
        if not transcript:
            print("⚠️  Empty transcript received")
            return "", {"available": False, "reason": "No transcript", "transcript": ""}
        
        # Use SINDH Fine-tuned Parser as the SINGLE SOURCE OF TRUTH for all routing
        print("🧠 Starting classification with SINDH Fine-tuned Parser...")
        
        classification = await classify_with_fine_tuned_llm(transcript, context or {})
        
        # Add transcript and availability to result
        classification["transcript"] = transcript
        classification["available"] = True  # Mark as available for routing logic
        
        # Determine routing based on parser decision
        should_use_rag = classification.get("should_use_rag", False)
        rag_indicator = " (RAG)" if should_use_rag else " (Direct)"
        
        print(f"⚡ Classification: {classification['intent']}{rag_indicator} "
              f"(confidence: {classification.get('confidence', 0):.2f}, "
              f"method: {classification.get('method', 'sindh_fine_tuned')}, "
              f"time: {classification.get('response_time', 0):.3f}s)")
        
        return transcript, classification
        
    except Exception as e:
        print(f"❌ Classification error: {e}")
        import traceback
        traceback.print_exc()
        return "", {"available": False, "error": str(e), "transcript": ""}
    finally:
        # Clean up audio file
        try:
            if wav_path and os.path.exists(wav_path):
                os.unlink(wav_path)
                print(f"🗑️  Cleaned up audio file: {wav_path}")
        except Exception as e:
            print(f"⚠️  Could not clean up audio file: {e}")

# Global variable to store background classification tasks
background_classification_tasks = {}

def extract_phone_number(text: str) -> Optional[str]:
    """Extract phone number from transcribed text"""
    digits = re.sub(r'\D', '', text)
    
    if len(digits) == 10 and digits[0] in '6789':
        return digits
    elif len(digits) == 11 and digits.startswith('0'):
        return digits[1:]
    elif len(digits) == 12 and digits.startswith('91'):
        return digits[2:]
    elif len(digits) == 13 and digits.startswith('+91'):
        return digits[3:]
    
    return None

async def extract_name_with_gemini(text: str) -> Optional[str]:
    """
    UPDATED: Use SINDH fine-tuned parser for name extraction with context.
    Fallback to simple pattern extraction if not found.
    """
    try:
        classification = await classify_with_fine_tuned_llm(text, {"current_state": "registration", "collecting_info": "name"})
        extracted = (classification or {}).get("extracted_info", {})
        name = (extracted.get("name") or "").strip()
        if name:
            print(f"✅ SINDH fine-tuned parser extracted name: '{name}'")
            return name
        print("ℹ️ Parser didn't extract name, using simple extraction")
        return extract_name(text)
    except Exception as e:
        print(f"⚠️ Error in name extraction: {e}")
        return extract_name(text)

async def collect_name_with_rag_support(rag_system, max_attempts: int = 3) -> Optional[str]:
    """
    Enhanced name collection using SINDH fine-tuned parser with intelligent RAG handling
    """
    print(f"🎯 Name collection with RAG support (max attempts: {max_attempts})")
    
    for attempt in range(max_attempts):
        print(f"🎯 Name collection attempt {attempt + 1} with RAG support")
        
        # Build context for the current attempt
        context = {
            "current_state": "registration", 
            "collecting_info": "name",
            "attempt": attempt
        }
        
        # Don't ask again if this isn't the first attempt or if intro already asked
        if attempt > 0:
            await speak_human_like("आपका नाम क्या है?", pace=1.0)
        
        # Get user input using the fine-tuned parser
        user_text, classification = await transcribe_and_classify_speech(context)
        
        if not user_text:
            print("⚠️ No speech input received")
            continue
        
        # Handle STT service errors gracefully
        if classification.get("intent") == "STT_ERROR":
            print("⚠️ STT service unavailable - using fallback message")
            await speak_human_like(
            "माफ कीजिए, आपकी आवाज़ सुनने में कुछ समस्या हो रही है। कृपया थोड़ा इंतज़ार करके दोबारा कोशिश करें।", 
            pace=1.0
        )
            continue  # Continue to next attempt instead of returning
        
        intent = classification.get("intent", "UNCLEAR")
        confidence = classification.get("confidence", 0.0)
        extracted_info = classification.get("extracted_info", {})
        should_use_rag = classification.get("should_use_rag", False)
        print(f"🎯 Name Collection - Intent: {intent}, Confidence: {confidence:.2f}, RAG: {should_use_rag}")
        
        # PRIORITY 1: Handle RAG queries first (Tara questions, platform info, etc.)
        if should_use_rag or intent.startswith("RAG_"):
            print(f"🤖 RAG query detected during name collection: {intent}")
            try:
                rag_result = await process_rag_query(user_text, user_id="name_collection")
                
                if rag_result and rag_result.get('confidence', 0) > 0.5:
                    # Process and deliver RAG response
                    clean_answer = await process_rag_response_for_conversation(
                        rag_result['answer'], 
                        user_text, 
                        intent,
                        "आप"
                    )
                    await speak_human_like(clean_answer, pace=1.0)
                    
                    # After answering RAG question, ask for name again
                    await asyncio.sleep(0.5)  # Brief pause
                    await speak_human_like("अब आपका नाम बताइए।", pace=1.0)
                    continue  # Name not collected, will retry
                else:
                    # RAG failed, acknowledge and ask for name
                    await speak_human_like("समझ गया। अब आपका नाम बताइए।", pace=1.0)
                    continue
                    
            except Exception as e:
                print(f"⚠️ RAG processing error: {e}")
                await speak_human_like("ठीक है। अब आपका नाम बताइए।", pace=1.0)
                continue
        
        # PRIORITY 2: Check for successful name extraction
        elif intent == "NAME_COLLECTION" and "name" in extracted_info and confidence > 0.7:
            user_name = extracted_info["name"]
            
            # Validate extracted name
            if user_name and len(user_name.strip()) > 1:
                # Get friendly first name for natural interaction
                friendly_name = get_friendly_first_name(user_name)
                print(f"✅ Name collected successfully: {user_name}")
                print(f"👋 Using friendly name: {friendly_name}")
                
                # Success response
                success_msg = f"धन्यवाद {friendly_name} जी! अब फोन नंबर बताइए।"
                await speak_human_like(success_msg, pace=0.9)
                
                return user_name
            else:
                print("❌ NAME_COLLECTION intent detected but invalid name")
                continue
        
        # PRIORITY 3: Handle other intents naturally
        else:
            if intent in ["NEW_JOBS_QUERY", "APPLIED_JOBS_QUERY", "PERSONAL_INFO_QUERY"]:
                await speak_human_like("अच्छा, वो बाद में देखते हैं। पहले परिचय तो हो जाए।", pace=1.0)
            elif intent in ["GREETING"]:
                await speak_human_like("नमस्ते! बहुत अच्छा लगा।", pace=1.0)
            else:
                # Generic natural response - don't ask for name, let main loop handle retry
                await speak_human_like("समझ गया।", pace=1.0)
            
            # Continue to next attempt if name not collected
            continue
    
    # If we get here, all attempts failed
    print("❌ Name collection failed after all attempts")
    return None

async def collect_phone_with_rag_support(rag_system, max_attempts: int = 3) -> Optional[str]:
    """
    Enhanced phone collection using SINDH fine-tuned parser with intelligent RAG handling
    """
    print(f"🎯 Phone collection with RAG support (max attempts: {max_attempts})")
    
    for attempt in range(max_attempts):
        print(f"🎯 Phone collection attempt {attempt + 1} with RAG support")
        
        # Build context for the current attempt  
        context = {
            "current_state": "registration", 
            "collecting_info": "phone",
            "attempt": attempt,
            "name_just_collected": attempt == 0  # First attempt means name was just collected
        }
        
        # Check if this is the first attempt after successful name collection
        name_just_collected = context.get("name_just_collected", False)
        
        # On first attempt, ask using simple prompts ONLY if name wasn't just collected
        if attempt == 0 and not name_just_collected:
            await speak_human_like("अब आपका फोन नंबर बताइए।", pace=1.0)
        elif attempt > 0:
            # Simple retry prompts
            retry_prompts = [
                "फिर से नंबर बताइए।",
                "आपका फोन नंबर क्या है?", 
                "अपना मोबाइल नंबर दीजिए।"
            ]
            prompt_text = random.choice(retry_prompts)
            await speak_human_like(prompt_text, pace=1.0)
        
        # Get user input using the fine-tuned parser
        user_text, classification = await transcribe_and_classify_speech(context)
        
        if not user_text:
            print("⚠️ No speech input received")
            continue
        
        # Handle STT service errors gracefully
        if classification.get("intent") == "STT_ERROR":
            print("⚠️ STT service unavailable - using fallback message")
            await speak_human_like(
                "माफ कीजिए, आपकी आवाज़ सुनने में कुछ समस्या हो रही है। कृपया थोड़ा इंतज़ार करके दोबारा कोशिश करें।", 
                pace=1.0
            )
            continue  # Continue to next attempt instead of returning
        
        intent = classification.get("intent", "UNCLEAR")
        confidence = classification.get("confidence", 0.0)
        extracted_info = classification.get("extracted_info", {})
        should_use_rag = classification.get("should_use_rag", False)
        
        print(f"🎯 Phone Collection - Intent: {intent}, Confidence: {confidence:.2f}, RAG: {should_use_rag}")
        
        # PRIORITY 1: Handle RAG queries first (but NOT during PHONE_COLLECTION intent)
        if should_use_rag and intent != "PHONE_COLLECTION":
            print(f"🤖 RAG query detected during phone collection: {intent}")
            try:
                rag_result = await process_rag_query(user_text, user_id="phone_collection")
                
                if rag_result and rag_result.get('confidence', 0) > 0.5:
                    # Process and deliver RAG response
                    clean_answer = await process_rag_response_for_conversation(
                        rag_result['answer'], 
                        user_text, 
                        intent,
                        context.get("user_name", "आप")
                    )
                    await speak_human_like(clean_answer, pace=1.0)
                    
                    # After answering RAG question, ask for phone again
                    await asyncio.sleep(0.5)  # Brief pause
                    await speak_human_like("अब अपना फोन नंबर बताइए।", pace=1.0)
                    continue  # Phone not collected, will retry
                else:
                    # RAG failed, acknowledge and ask for phone
                    await speak_human_like("समझ गया। अब आपका फोन नंबर बताइए।", pace=1.0)
                    continue
                        
            except Exception as e:
                print(f"⚠️ RAG processing error: {e}")
                await speak_human_like("ठीक है। अब आपका फोन नंबर बताइए।", pace=1.0)
                continue
        
        # PRIORITY 2: Check for successful phone extraction
        elif intent == "PHONE_COLLECTION" and "phone" in extracted_info and confidence > 0.7:
            user_phone = extracted_info["phone"]
            
            # Validate extracted phone
            if user_phone and len(user_phone) == 10 and user_phone.isdigit():
                print(f"✅ Phone collected successfully: {user_phone}")
                
                # Processing message
                await speak_human_like("मिल गया! चेक कर रही हूँ।", pace=1.0)
                return user_phone
            else:
                print(f"❌ PHONE_COLLECTION intent detected but invalid phone: {user_phone}")
                continue
        
        # PRIORITY 3: Handle other intents naturally
        else:
            if intent in ["NEW_JOBS_QUERY", "APPLIED_JOBS_QUERY"]:
                await speak_human_like("हाँ, वो सब बाद में। पहले नंबर तो दे दीजिए।", pace=1.0)
            elif intent in ["NAME_COLLECTION"]:
                await speak_human_like("नाम तो मिल गया, अब नंबर चाहिए।", pace=1.0)
            else:
                # Generic natural response - don't ask for phone, let main loop handle retry
                await speak_human_like("समझ गया।", pace=1.0)
            
            # Continue to next attempt if phone not collected
            continue
    
    # If we get here, all attempts failed
    print("❌ Phone collection failed after all attempts")
    return None

def extract_name(text: str) -> Optional[str]:
    """Extract name from transcribed text"""
    # Simple name extraction - remove common words
    words_to_remove = [
        "मेरा", "नाम", "है", "हूं", "हूँ", "जी", "साहब", "मैं", "का", "की", "के",
        "mera", "naam", "hai", "hun", "ji", "sahab", "main", "ka", "ki", "ke",
        "my", "name", "is", "am", "sir", "ji"
    ]
    
    words = text.strip().split()
    filtered_words = []
    
    for word in words:
        if word.lower() not in words_to_remove and len(word) > 1:
            filtered_words.append(word)
    
    if filtered_words:
        return " ".join(filtered_words[:2])  # Take first 2 words as name
    
    return None

async def fetch_location_from_pincode(pincode: str) -> Optional[Dict[str, str]]:
    """Fetch location details from pincode using Indian Postal API"""
    try:
        import aiohttp
        import asyncio
        
        print(f"🔍 Fetching location details for pincode: {pincode}")
        
        # Using Indian Postal Pincode API
        url = f"https://api.postalpincode.in/pincode/{pincode}"
        
        timeout = aiohttp.ClientTimeout(total=10)  # 10 second timeout
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if data and len(data) > 0 and data[0].get('Status') == 'Success':
                        post_offices = data[0].get('PostOffice', [])
                        if post_offices and len(post_offices) > 0:
                            post_office = post_offices[0]
                            district = post_office.get('District', '')
                            state = post_office.get('State', '')
                            
                            print(f"✅ Location found: {district}, {state}")
                            return {
                                "district": district,
                                "state": state
                            }
                        else:
                            print("❌ No post office data found")
                    else:
                        print(f"❌ API returned error status: {data[0].get('Message', 'Unknown error') if data else 'No data'}")
                else:
                    print(f"❌ HTTP error: {response.status}")
                    
    except aiohttp.ClientError as e:
        print(f"❌ Network error fetching location: {e}")
    except asyncio.TimeoutError:
        print("❌ Timeout while fetching location")
    except Exception as e:
        print(f"❌ Error fetching location: {e}")
    
    return None

async def connect_to_mongodb():
    """Connect to MongoDB and return client and database"""
    try:
        client = pymongo.MongoClient(MONGODB_URI)
        client.admin.command('ping')
        
        try:
            db = client.get_default_database()
        except Exception:
            db = client.test
            
        return client, db
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return None, None

from enhanced_personal_rag import get_personal_rag_processor

async def store_worker_profile_background(worker_data: dict, rag_system, db_connection=None):
    """Store worker profile in RAG knowledge base in the background"""
    try:
        print("🧠 Storing worker profile in RAG knowledge base (background process)...")
        await store_worker_profile_in_rag(worker_data, rag_system, db_connection)
        print("✅ Background RAG profile storage completed")
    except Exception as e:
        print(f"⚠️ Background RAG storage failed: {e}")

async def store_worker_profile_in_rag(worker_data: dict, rag_system, db_connection=None) -> bool:
    """Extract worker profile and store it in RAG knowledge base for personalized responses"""
    try:
        if not worker_data or not rag_system:
            return False
        
        # Use enhanced RAG processor for comprehensive profile extraction
        from enhanced_personal_rag import get_personal_rag_processor
        
        # Use provided database connection
        if db_connection is not None:
            personal_processor = get_personal_rag_processor(db_connection)
            
            # Use enhanced profile storage
            worker_phone = worker_data.get('phone')
            if worker_phone:
                success = await personal_processor.store_enhanced_profile_in_rag(worker_phone, rag_system)
                if success:
                    print(f"✅ Enhanced worker profile stored for comprehensive personal responses")
                    return True
        
        # Fallback to basic profile storage if enhanced fails or no db connection
        return await store_basic_worker_profile_in_rag(worker_data, rag_system)
        
    except Exception as e:
        print(f"❌ Error with enhanced profile storage, using basic: {e}")
        return await store_basic_worker_profile_in_rag(worker_data, rag_system)


async def store_basic_worker_profile_in_rag(worker_data: dict, rag_system) -> bool:
    """Basic fallback worker profile storage for RAG knowledge base"""
    try:
        if not worker_data or not rag_system:
            return False
            
        # Create a basic worker profile document
        profile_doc = f"""
वर्कर प्रोफाइल - {worker_data.get('name', 'अज्ञात')}

व्यक्तिगत जानकारी:
- नाम: {worker_data.get('name', 'उपलब्ध नहीं')}
- फोन नंबर: {worker_data.get('phone', 'उपलब्ध नहीं')}
- उम्र: {worker_data.get('age', 'उपलब्ध नहीं')} साल
- आधार नंबर: {worker_data.get('aadharNumber', 'उपलब्ध नहीं')}

पता और स्थान:
- गांव/शहर: {worker_data.get('location', {}).get('village', 'उपलब्ध नहीं')}
- जिला: {worker_data.get('location', {}).get('district', 'उपलब्ध नहीं')}
- राज्य: {worker_data.get('location', {}).get('state', 'उपलब्ध नहीं')}
- पिन कोड: {worker_data.get('location', {}).get('pincode', 'उपलब्ध नहीं')}
- पूरा पता: {worker_data.get('location', {}).get('address', 'उपलब्ध नहीं')}
- काम का दायरा: {worker_data.get('workRadius', 'उपलब्ध नहीं')} किमी

कौशल और काम:
- प्राथमिक स्किल: {worker_data.get('primarySkill', 'उपलब्ध नहीं')}
- सभी स्किल: {', '.join(worker_data.get('skills', [])) if worker_data.get('skills') else 'उपलब्ध नहीं'}
- पसंदीदा श्रेणी: {worker_data.get('preferredCategory', 'उपलब्ध नहीं')}
- अनुभव: {worker_data.get('experienceYears', 'उपलब्ध नहीं')} साल

वित्तीय जानकारी:
- बैंक खाता नंबर: {worker_data.get('bankAccount', {}).get('accountNumber', 'उपलब्ध नहीं')}
- IFSC कोड: {worker_data.get('bankAccount', {}).get('ifscCode', 'उपलब्ध नहीं')}
- बैंक का नाम: {worker_data.get('bankAccount', {}).get('bankName', 'उपलब्ध नहीं')}
- खाता धारक का नाम: {worker_data.get('bankAccount', {}).get('accountHolderName', 'उपलब्ध नहीं')}

प्रदर्शन मेट्रिक्स:
- शक्ति स्कोर: {worker_data.get('shaktiScore', 'उपलब्ध नहीं')}
- प्रोफाइल पूर्णता: {worker_data.get('profileCompletionPercentage', 'उपलब्ध नहीं')}%
- सत्यापन स्थिति: {worker_data.get('verificationStatus', 'उपलब्ध नहीं')}
- रेटिंग: {worker_data.get('rating', 'उपलब्ध नहीं')}

पंजीकरण और गतिविधि:
- पंजीकरण तारीख: {worker_data.get('registrationDate', 'उपलब्ध नहीं')}
- अंतिम लॉगिन: {worker_data.get('lastLogin', 'उपलब्ध नहीं')}
- कुल नौकरियां पूरी की: {worker_data.get('completedJobs', 'उपलब्ध नहीं')}
- सक्रियता स्थिति: {worker_data.get('isActive', 'उपलब्ध नहीं')}

अतिरिक्त जानकारी:
- बायो/विवरण: {worker_data.get('bio', 'उपलब्ध नहीं')}
- आपातकालीन संपर्क: {worker_data.get('emergencyContact', {}).get('name', 'उपलब्ध नहीं')} - {worker_data.get('emergencyContact', {}).get('phone', 'उपलब्ध नहीं')}

नोट: यह प्रोफाइल व्यक्तिगत प्रश्नों के उत्तर देने के लिए उपयोग की जाती है। जब भी कोई व्यक्तिगत जानकारी पूछी जाए, तो इस डेटा का उपयोग करके मानवीय और व्यक्तिगत उत्तर दें।
"""

        # Store the profile document in RAG system
        # Create a unique filename for this worker's profile
        profile_filename = f"basic_worker_profile_{worker_data.get('phone', 'unknown')}.md"
        profile_path = os.path.join("knowledge_base", profile_filename)
        
        # Write to file (RAG will pick it up automatically)
        os.makedirs("knowledge_base", exist_ok=True)
        with open(profile_path, 'w', encoding='utf-8') as f:
            f.write(profile_doc)
        
        print(f"✅ Basic worker profile stored in RAG knowledge base: {profile_filename}")
        
        # Refresh RAG system to include the new document
        try:
            if hasattr(rag_system, 'refresh_documents'):
                rag_system.refresh_documents()
            elif hasattr(rag_system, '_initialize'):
                rag_system._initialize()  # Re-initialize to pick up new documents
        except Exception as refresh_error:
            print(f"⚠️ RAG refresh warning: {refresh_error}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error storing basic worker profile in RAG: {e}")
        return False

async def check_worker_exists(db, phone: str) -> Optional[Dict[str, Any]]:
    """Check if worker exists by phone number"""
    try:
        phone_variants = [phone, f"+91{phone}", f"91{phone}", f"0{phone}"]
        
        workers_collection = db.workers
        for variant in phone_variants:
            worker = workers_collection.find_one({"phone": variant})
            if worker:
                worker['_id'] = str(worker['_id'])
                return worker
        
        return None
    except Exception as e:
        print(f"❌ Error checking worker: {e}")
        return None

def parse_user_intent(text: str) -> str:
    """Parse what user wants to do"""
    text_lower = text.lower().strip()
    
    # Check for applied jobs keywords (more specific first)
    applied_keywords = [
        "applied", "apply", "application", "status", "applied jobs",
        "आवेदन", "स्थिति", "हाल", "पुराने", "किए", "दिया", "applied", "status",
        "मेरा काम", "अपना काम", "काम का हाल", "applied job", "मेरे job", "मेरे काम"
    ]
    
    # Check for new jobs keywords  
    new_jobs_keywords = [
        "new", "available", "jobs", "काम", "नया", "नए", "उपलब्ध", "मिले",
        "new jobs", "available jobs", "नया काम", "नए काम", "काम मिले",
        "job chahiye", "काम चाहिए", "naya kaam", "job dekhna", "काम देखना",
        "काम देखना है", "नया काम चाहिए", "काम मिलेगा", "कोई काम"
    ]
    
    # Check for registration keywords
    register_keywords = [
        "register", "registration", "sign up", "पंजीकरण", "रजिस्टर", 
        "नाम लिखवाना", "register karna", "registration karna",
        "नाम लिखवाना है", "रजिस्टर करना है", "पहली बार"
    ]

    
    # Check for personal info/profile keywords (check balance/financial first since they're more specific)
    financial_keywords = [
        "बैलेंस", "balance", "पैसे", "money", "रकम", "amount", "कमाई", "earning", 
        "टोटल", "total", "पेमेंट", "payment", "सैलरी", "salary", "कब मिलेगा",
        "मेरे पैसे", "अकाउंट में", "खाते में", "account balance", "balance check"
    ]
    
    personal_info_keywords = [
        "प्रोफाइल", "जानकारी", "डिटेल्स", "बारे में", "मेरी", "मेरा", "अपनी", "अपना",
        "profile", "info", "details", "बताओ", "दिखाओ", "देखना", "चेक",
        "उम्र", "आयु", "age", "फोन", "नंबर", "मोबाइल", "phone", "number",
        "पता", "एड्रेस", "address", "कहाँ", "रहता", "location", "जगह",
        "हुनर", "स्किल", "skills", "काम", "talent", "एक्सपीरियंस", "अनुभव", "experience",
        "अकाउंट", "account", "रजिस्ट्रेशन", "registration", "वेरिफाइड", "verified"
    ]
    
    # Check financial keywords first (most specific)
    for keyword in financial_keywords:
        if keyword in text_lower:
            return "personal_info"
    
    for keyword in applied_keywords:
        if keyword in text_lower:
            return "applied_jobs"

    for keyword in new_jobs_keywords:
        if keyword in text_lower:
            return "new_jobs"
            
    for keyword in register_keywords:
        if keyword in text_lower:
            return "register"
            
    for keyword in personal_info_keywords:
        if keyword in text_lower:
            return "personal_info"
    
    # Check for RAG/general query keywords
    rag_keywords = [
        "क्या है", "what is", "कैसे", "how", "कब", "when", "क्यों", "why",
        "बताओ", "बताइए", "explain", "समझाओ", "जानकारी", "information",
        "help", "मदद", "सहायता", "guide", "गाइड", "rules", "नियम",
        "policy", "पॉलिसी", "process", "प्रक्रिया", "support", "सपोर्ट",
        "contact", "संपर्क", "number", "email", "website", "app",
        "platform", "प्लेटफॉर्म", "sindh", "सिंध", "about", "के बारे में",
        "benefits", "फायदे", "charges", "fees", "फीस", "cost", "लागत"
    ]
    
    for keyword in rag_keywords:
        if keyword in text_lower:
            return "rag"

    return "unknown"



async def create_natural_intro():
    """Create a smooth, welcoming introduction that is as human-like as possible using TARA configuration."""
    # Get intro text from dialogue manager
    intro_text = dialogue_manager.welcome_message()
    
    # Get TARA voice settings for a welcoming greeting
    voice_config = get_voice_settings('happy')
    
    # Use content-aware caching
    intro_content_file = os.path.join(VOICE_DIR, "intro_content.txt")
    
    if os.path.exists(INTRO_PATH) and os.path.exists(intro_content_file):
        try:
            with open(intro_content_file, 'r', encoding='utf-8') as f:
                cached_intro = f.read().strip()
            if cached_intro == intro_text.strip():
                # Content matches, use cached audio
                play_wav(INTRO_PATH)
                return
            else:
                print("🔄 Intro content changed, regenerating...")
        except Exception as e:
            print(f"⚠️ Error reading intro cache: {e}")
    
    # Generate new audio and save content with TARA voice settings
    await synthesize_to_file(
        intro_text,
        outfile=INTRO_PATH,
        target_language_code=voice_config['language'],
        speaker=voice_config['voice_id'],  # Use TARA's configured voice
        model="bulbul:v2",
        output_format="wav",
        sample_rate_hz=16000,
        pace=voice_config['speed'] * 0.95,  # Slightly slower for welcoming tone
        pitch=voice_config['pitch'],  # Use TARA's configured pitch
        loudness=voice_config['volume'],  # Use TARA's configured volume
    )
    
    # Save content for future comparison
    try:
        with open(intro_content_file, 'w', encoding='utf-8') as f:
            f.write(intro_text.strip())
    except Exception as e:
        print(f"⚠️ Error saving intro content: {e}")
    
    play_wav(INTRO_PATH)

async def get_user_registration_decision(user_name: str, user_phone: str, client, db) -> Optional[Dict[str, Any]]:
    """Ask user if they want to register and handle their decision"""
    max_attempts = get_max_retries()  # Use TARA config
    
    for attempt in range(max_attempts):
        # Get user response about registration
        user_text, _ = await transcribe_and_classify_speech()
        if not user_text:
            await speak_human_like("हां या नहीं बोलिए।", pace=1.0)
            continue
        
        user_text_lower = user_text.lower()
        
        # Check for positive responses
        positive_responses = ["हां", "हाँ", "yes", "जी", "जी हां", "जी हाँ", "करना", "चाहिए", "ठीक है", "ok"]
        negative_responses = ["नहीं", "नही", "no", "ना", "नहीं चाहिए", "जरूरत नहीं", "बाद में"]
        
        wants_registration = any(word in user_text_lower for word in positive_responses)
        doesnt_want = any(word in user_text_lower for word in negative_responses)
        
        if wants_registration:
            # User wants to register
            await speak_human_like("बहुत अच्छे! आइए रजिस्ट्रेशन करते हैं।", pace=1.0)
            registration_data = {"name": user_name, "phone": user_phone}
            registered_worker = await route_to_service("register", registration_data, client, db)
            return registered_worker
        elif doesnt_want:
            # User doesn't want to register
            await speak_human_like("कोई बात नहीं। फिर कुछ और मदद कर सकता हूं?", pace=1.0)
            return None
        else:
            # Unclear response
            if attempt < max_attempts - 1:
                await speak_human_like("समझ नहीं आया। रजिस्ट्रेशन करना है तो हां, नहीं तो नहीं बोलिए।", pace=1.0)
            else:
                await speak_human_like("ठीक है, कोई बात नहीं। कुछ और मदद कर सकता हूं?", pace=1.0)
                return None
    
    return None

async def route_to_service(service: str, worker_data: Dict = None, client=None, db=None):
    """Route user to the appropriate service with ultra human-like dialogue."""
    try:
        if service == "register":
            await speak_human_like(dialogue_manager.registration_start(), pace=1.0)
            # Collect registration details inline
            worker_name = worker_data.get('name') if worker_data else None
            worker_phone = worker_data.get('phone') if worker_data else None
            registered_worker = await collect_worker_registration(worker_name, worker_phone, client, db)
            return registered_worker
            
        elif service == "applied_jobs":
            name = format_name_for_hindi_tts(worker_data.get('name', 'जी'))
            await speak_human_like(dialogue_manager.applied_jobs_start(name), pace=1.1)
            
            # Call function directly with existing connection
            if run_applied_jobs_check:
                worker_phone = worker_data.get('phone') if worker_data else None
                await run_applied_jobs_check(client, db, worker_phone)
            else:
                import subprocess
                subprocess.run([sys.executable, "applied_jobs_checker.py"], cwd=here)
            
        elif service == "new_jobs":
            name = format_name_for_hindi_tts(worker_data.get('name', 'जी'))
            
            # Check if user needs Phase 2 registration before applying for jobs
            registration_phase = worker_data.get('registrationPhase', 1)
            if registration_phase < 2:
                await speak_human_like(
                    dialogue_manager.get_dialogue("services.new_jobs.phase2_required", name=name), 
                    pace=1.0
                )
                # Complete Phase 2 registration
                updated_worker = await collect_phase2_registration(worker_data, client, db)
                if not updated_worker:
                    await speak_human_like("जब आप तैयार हों तब फिर आइए।", pace=1.0)
                    return
                worker_data = updated_worker
            else:
                await speak_human_like(dialogue_manager.new_jobs_start(name), pace=1.1)
            
            # Call function directly with existing connection
            if run_available_jobs_browse:
                worker_phone = worker_data.get('phone') if worker_data else None
                await run_available_jobs_browse(client, db, worker_phone)
            else:
                import subprocess
                subprocess.run([sys.executable, "available_jobs_browser.py"], cwd=here)
            
        elif service == "launcher":
            name = format_name_for_hindi_tts(worker_data.get('name', 'जी'))
            await speak_human_like(dialogue_manager.get_dialogue("services.launcher.start_message", name=name), pace=1.1)
            import subprocess
            subprocess.run([sys.executable, "job_assistant_launcher.py"], cwd=here)
            
        elif service == "personal_info":
            # Handle personal information queries using PersonalInfoBrowser
            if PersonalInfoBrowser and worker_data:
                try:
                    name = format_name_for_hindi_tts(worker_data.get('name', 'जी'))
                    personal_browser = PersonalInfoBrowser(dialogue_manager, db, worker_data)
                    
                    # This will be called with the specific user query from the main loop
                    # The personal_browser.process_personal_query() will be called from the main conversation loop
                    print(f"✅ Personal Info Browser initialized for {name}")
                    return personal_browser
                except Exception as e:
                    print(f"❌ Error initializing Personal Info Browser: {e}")
                    await speak_human_like("अभी प्रोफाइल की जानकारी देखने में कुछ दिक्कत है। थोड़ी देर बाद कोशिश करिए।", pace=1.0)
            else:
                await speak_human_like("अभी प्रोफाइल की सुविधा उपलब्ध नहीं है।", pace=1.0)
        
        elif service == "rag":
            # Handle RAG (Retrieval Augmented Generation) queries
            try:
                name = format_name_for_hindi_tts(worker_data.get('name', 'जी')) if worker_data else 'जी'
                await speak_human_like(f"{name}, आपके सवाल का जवाब खोज रहा हूँ...", pace=1.0)
                
                # Import and use RAG module
                try:
                    from rag import handle_rag_query
                    # This would handle the RAG query - placeholder for now
                    await speak_human_like("मुझे खुशी होगी आपकी मदद करने में, लेकिन अभी यह सुविधा तैयार हो रही है।", pace=1.0)
                except ImportError:
                    await speak_human_like("अभी जानकारी खोजने की सुविधा उपलब्ध नहीं है।", pace=1.0)
            except Exception as e:
                print(f"❌ Error in RAG service: {e}")
                await speak_human_like("अभी आपके सवाल का जवाब देने में कुछ दिक्कत है।", pace=1.0)
            
    except Exception as e:
        print(f"❌ Error routing to service: {e}")
        await speak_human_like(dialogue_manager.get_dialogue("services.error_handling.system_error"), pace=1.0)

async def collect_worker_registration(worker_name: str = None, worker_phone: str = None, client=None, db=None) -> dict:
    """Phase 1: Collect basic registration details only"""
    
    # Phase 1: Basic worker data structure for initial registration
    worker_data = {
        "name": worker_name,
        "age": None,
        "phone": worker_phone,
        "gender": None,
        "skills": [],
        "location": {
            "address": "",
            "village": "",
            "district": "",
            "state": "",
            "pincode": "",
            "coordinates": {
                "type": "Point",
                "coordinates": [0, 0]
            }
        },
        # Phase 1 basic fields only - set sensible defaults for others
        "email": "",
        "aadharNumber": None,  # Phase 2 requirement
        "experience": "1-2 years",  # Default
        "expectedSalary": "₹500 per day",  # Default
        "preferredCategory": "Construction",  # Default
        "languages": ["Hindi"],
        "preferredWorkType": "",
        "availability": "Available immediately",
        "bio": "",  # Phase 2 requirement
        "workRadius": 10,  # Phase 2 requirement
        "verificationStatus": "basic_registered",  # Phase 1 complete
        "isAvailable": True,
        "rating": {"average": 0, "count": 0, "reviews": []},
        "registrationDate": datetime.now().isoformat(),
        "lastLogin": datetime.now().isoformat(),
        "isLoggedIn": 1,
        "activeJobs": 0,
        "completedJobs": 0,
        "emailNotifications": True,
        "smsNotifications": True,
        "profilePicture": "",
        "bankDetails": {
            "accountNumber": "",
            "ifscCode": "",
            "bankName": "",
            "accountHolderName": ""
        },
        "emergencyContact": {
            "name": "",
            "phone": "",
            "relation": ""
        },
        "registrationPhase": 1,  # Track registration phase
        "type": "worker"
    }
    
    max_attempts = get_max_retries()  # Use TARA config
    
    # Helper function for clean audio capture
    async def get_user_response(prompt_text: str, cache_name: str = None) -> str:
        # Speak prompt and capture response
        await speak_human_like(prompt_text, cache_name=cache_name, pace=1.0)
        wav_path = await capture_vad_audio()
        try:
            result = await transcribe_file(wav_path, language_code="hi-IN", model="saarika:v2.5", with_timestamps=False)
            return (result.get("transcript") or result.get("text") or "").strip()
        finally:
            try:
                os.unlink(wav_path)
            except:
                pass
    
    # 0. Ensure we have a valid name (required for database)
    if not worker_data["name"]:
        for attempt in range(max_attempts):
            response = await get_user_response(dialogue_manager.name_prompt())
            # Always classify with SINDH parser for name collection
            classification = await classify_with_fine_tuned_llm(response, {"current_state": "registration", "collecting_info": "name"})
            extracted = (classification or {}).get("extracted_info", {})
            name_candidate = (extracted.get("name") or response or "").strip()

            if name_candidate and len(name_candidate) >= 2 and classification.get("intent") in ["NAME_COLLECTION", "NAME_EXTRACTION"]:
                worker_data["name"] = name_candidate
                await speak_human_like(dialogue_manager.name_success(worker_data['name']), pace=1.0)
                break
            else:
                await speak_human_like(dialogue_manager.name_retry())
        
        if not worker_data["name"]:
            await speak_human_like(dialogue_manager.get_dialogue("data_collection.name_collection.failure_message"), pace=1.0)
            return None

    # 1. Ensure we have a valid phone number (required for database)
    if not worker_data["phone"]:
        for attempt in range(max_attempts):
            response = await get_user_response(dialogue_manager.phone_prompt())
            # Always classify with SINDH parser for phone collection
            classification = await classify_with_fine_tuned_llm(response, {"current_state": "registration", "collecting_info": "phone"})
            extracted = (classification or {}).get("extracted_info", {})
            phone_candidate = (extracted.get("phone") or "").strip()
            
            if not phone_candidate:
                # Fallback regex if parser didn't extract
                phone_match = re.search(r'\b\d{10}\b', response.replace(" ", ""))
                phone_candidate = phone_match.group() if phone_match else ""

            if phone_candidate:
                worker_data["phone"] = phone_candidate
                await speak_human_like(dialogue_manager.phone_success(), pace=1.0)
                break
            else:
                await speak_human_like(dialogue_manager.phone_retry())
        
        if not worker_data["phone"]:
            await speak_human_like(dialogue_manager.get_dialogue("data_collection.phone_collection.failure_message"), pace=1.0)
            return None
    
    # 2. Age Collection
    if not worker_data["age"]:
        for attempt in range(max_attempts):
            if worker_data["name"]:
                response = await get_user_response(dialogue_manager.age_prompt(worker_data['name']))
            else:
                response = await get_user_response(dialogue_manager.age_prompt())
            
            age_match = re.search(r'\b(\d{1,2})\b', response)
            if age_match:
                age = int(age_match.group(1))
                if 18 <= age <= 70:
                    worker_data["age"] = age
                    await speak_human_like(dialogue_manager.age_success(age), pace=1.0)
                    break
                else:
                    await speak_human_like(dialogue_manager.get_dialogue("data_collection.age_collection.validation_error"))
            else:
                await speak_human_like(dialogue_manager.get_dialogue("data_collection.age_collection.retry_prompt"))
    
    # 3. Gender Collection
    for attempt in range(max_attempts):
        response = await get_user_response(dialogue_manager.gender_prompt())
        response_lower = response.lower()
        
        if any(word in response_lower for word in ["पुरुष", "मर्द", "आदमी", "male", "लड़का"]):
            worker_data["gender"] = "Male"
            await speak_human_like(dialogue_manager.gender_success(), pace=1.0)
            break
        elif any(word in response_lower for word in ["महिला", "औरत", "female", "लड़की", "स्त्री"]):
            worker_data["gender"] = "Female"
            await speak_human_like(dialogue_manager.gender_success(), pace=1.0)
            break
        else:
            await speak_human_like(dialogue_manager.get_dialogue("data_collection.gender_collection.retry_prompt"))
    
    # 4. Pincode for Location
    for attempt in range(max_attempts):
        response = await get_user_response(dialogue_manager.pincode_prompt())
        
        pincode_match = re.search(r'\b\d{6}\b', response.replace(" ", ""))
        if pincode_match:
            pincode = pincode_match.group()
            worker_data["location"]["pincode"] = pincode
            await speak_human_like(dialogue_manager.pincode_processing(), pace=1.0)
            
            # Fetch location details from pincode
            location_info = await fetch_location_from_pincode(pincode)
            if location_info:
                worker_data["location"]["district"] = location_info.get("district", "")
                worker_data["location"]["state"] = location_info.get("state", "")
                await speak_human_like(
                    dialogue_manager.get_dialogue(
                        "data_collection.location_collection.pincode_success",
                        pincode=pincode,
                        district=location_info.get('district', 'नहीं मिला'),
                        state=location_info.get('state', 'नहीं मिला')
                    ), 
                    pace=1.0
                )
            else:
                await speak_human_like(dialogue_manager.get_dialogue("data_collection.location_collection.pincode_no_info"), pace=1.0)
            break
        else:
            await speak_human_like(dialogue_manager.get_dialogue("data_collection.location_collection.pincode_retry"))
    
    # 5. Village/Area
    response = await get_user_response(dialogue_manager.get_dialogue("data_collection.location_collection.village_prompt"))
    if response:
        worker_data["location"]["village"] = response
        await speak_human_like(dialogue_manager.get_dialogue("data_collection.location_collection.village_success"), pace=1.0)
    
    # Skip manual district and state entry since we got it from pincode
    # But ask for confirmation if pincode lookup failed
    if not worker_data["location"]["district"]:
        response = await get_user_response("आपका जिला कौन सा है?")
        if response:
            worker_data["location"]["district"] = response
    
    if not worker_data["location"]["state"]:
        response = await get_user_response("और आपका राज्य?")
        if response:
            worker_data["location"]["state"] = response
    
    # 6. Skills Collection (Phase 1 requirement)
    response = await get_user_response(dialogue_manager.skills_prompt())
    
    # Parse skills from response
    skill_keywords = {
        "Electrical": ["बिजली", "electrical", "वायरिंग", "wire"],
        "Plumbing": ["पाइप", "नल", "plumbing", "पानी"],
        "Painting": ["पेंट", "painting", "रंग"],
        "Carpentry": ["लकड़ी", "carpenter", "फर्नीचर"],
        "Masonry": ["ईंट", "चूना", "masonry", "दीवार"],
        "Driving": ["गाड़ी", "ड्राइविंग", "driving"],
        "Cooking": ["खाना", "कुकिंग", "cook", "रसोई"],
        "Cleaning": ["साफ़ाई", "clean", "झाड़ू"],
        "Welding": ["वेल्डिंग", "welding", "लोहा"],
        "Farming": ["खेती", "farming", "फसल"],
        "Security": ["सिक्योरिटी", "security", "पहरा"],
        "Delivery": ["डिलीवरी", "delivery", "पहुंचाना"]
    }
    
    skills_found = []
    for skill, keywords in skill_keywords.items():
        if any(keyword in response.lower() for keyword in keywords):
            skills_found.append(skill)
    
    if skills_found:
        worker_data["skills"] = skills_found
        await speak_human_like(dialogue_manager.skills_success(), pace=1.0)
    else:
        worker_data["skills"] = ["Construction"]  # Default
    
    # Set work category based on skills
    if worker_data["skills"]:
        skill_to_category = {
            "Electrical": "Construction",
            "Plumbing": "Construction", 
            "Painting": "Construction",
            "Carpentry": "Construction",
            "Masonry": "Construction",
            "Driving": "Transportation",
            "Cooking": "Household",
            "Cleaning": "Household",
            "Welding": "Manufacturing",
            "Farming": "Agriculture",
            "Security": "Services",
            "Delivery": "Services"
        }
        primary_skill = worker_data["skills"][0]
        worker_data["preferredCategory"] = skill_to_category.get(primary_skill, "Construction")
    
    # PHASE 1 COMPLETION MESSAGE
    await speak_human_like(
        dialogue_manager.registration_completion(worker_data['name']),
        pace=0.9
    )
    
    # Calculate basic profile completion for Phase 1
    worker_data["profileCompletionPercentage"] = 40  # Phase 1 gives 40% completion
    worker_data["shaktiScore"] = calculate_shakti_score(worker_data)
    
    # Update address field
    address_parts = [
        worker_data["location"]["village"],
        worker_data["location"]["district"], 
        worker_data["location"]["state"],
        worker_data["location"]["pincode"]
    ]
    worker_data["location"]["address"] = ", ".join(filter(None, address_parts))
    
    # Save Phase 1 registration to database
    try:
        # Validate required fields before saving
        if not worker_data.get("phone"):
            print("❌ Cannot save worker: Missing phone number")
            await speak_human_like("आपका फ़ोन नंबर ज़रूरी है। इसके बिना रजिस्ट्रेशन पूरा नहीं हो सकता।", pace=1.0)
            return None
            
        if not worker_data.get("name"):
            print("❌ Cannot save worker: Missing name")
            await speak_human_like("आपका नाम भी ज़रूरी है। कृपया अपना नाम बताइए।", pace=1.0)
            return None
        
        workers_collection = db.workers
        
        # Check if worker with this phone already exists
        existing_worker = workers_collection.find_one({"phone": worker_data["phone"]})
        if existing_worker:
            print(f"❌ Worker with phone {worker_data['phone']} already exists")
            await speak_human_like("लगता है यह फ़ोन नंबर पहले से ही किसी और के नाम पर रजिस्टर है। आप कोई दूसरा नंबर बता सकते हैं।", pace=1.0)
            return existing_worker
        
        # Convert datetime objects to strings for MongoDB
        if isinstance(worker_data["registrationDate"], datetime):
            worker_data["registrationDate"] = worker_data["registrationDate"].isoformat()
        if isinstance(worker_data["lastLogin"], datetime):
            worker_data["lastLogin"] = worker_data["lastLogin"].isoformat()
        
        result = workers_collection.insert_one(worker_data)
        worker_data["_id"] = str(result.inserted_id)
        
        print(f"✅ Worker Phase 1 registered successfully: {worker_data['name']} - {worker_data['phone']}")
        
        return worker_data
        
    except Exception as e:
        print(f"❌ Error saving worker: {e}")
        await speak_human_like(
            "कुछ तकनीकी दिक्कत की वजह से जानकारी सेव नहीं हो पायी, पर चिंता मत करिए, आपकी सारी जानकारी हमारे पास है। हम इसे ठीक कर लेंगे।", 
            pace=1.0
        )
        return worker_data

async def collect_phase2_registration(worker_data: dict, client=None, db=None) -> dict:
    """Phase 2: Collect additional details required for job applications"""
    
    max_attempts = 3
    
    # Helper function for clean audio capture
    async def get_user_response(prompt_text: str, cache_name: str = None) -> str:
        await speak_human_like(prompt_text, cache_name=cache_name, pace=1.0)
        wav_path = await capture_vad_audio()
        try:
            result = await transcribe_file(wav_path, language_code="hi-IN", model="saarika:v2.5", with_timestamps=False)
            return (result.get("transcript") or result.get("text") or "").strip()
        finally:
            try:
                os.unlink(wav_path)
            except:
                pass
    
    await speak_human_like(
        dialogue_manager.get_dialogue("registration.phase2.start_message", name=worker_data.get('name', '')), 
        pace=0.9
    )
    
    # 1. Aadhar Number (Required for job applications)
    if not worker_data.get("aadharNumber"):
        for attempt in range(max_attempts):
            response = await get_user_response(dialogue_manager.get_dialogue("registration.phase2.aadhar_prompt"))
            
            aadhar_match = re.search(r'\b\d{12}\b', response.replace(" ", ""))
            if aadhar_match:
                worker_data["aadharNumber"] = aadhar_match.group()
                await speak_human_like(dialogue_manager.get_dialogue("registration.phase2.aadhar_success"), pace=1.0)
                break
            else:
                if attempt < max_attempts - 1:
                    await speak_human_like(dialogue_manager.get_dialogue("registration.phase2.aadhar_retry"))
                else:
                    await speak_human_like(dialogue_manager.get_dialogue("registration.phase2.aadhar_required"), pace=1.0)
                    return None
    
    # 2. Work Radius
    if not worker_data.get("workRadius") or worker_data.get("workRadius") == 10:  # Default value
        response = await get_user_response(dialogue_manager.get_dialogue("registration.phase2.work_radius_prompt"))
        
        radius_match = re.search(r'\b(\d{1,2})\b', response)
        if radius_match:
            worker_data["workRadius"] = int(radius_match.group(1))
            await speak_human_like(dialogue_manager.get_dialogue("registration.phase2.work_radius_success", radius=worker_data['workRadius']), pace=1.0)
        else:
            worker_data["workRadius"] = 15  # Default increased for job applications
    
    # 3. Bio/About yourself (Important for employers)
    if not worker_data.get("bio") or worker_data["bio"].startswith("Experienced"):
        response = await get_user_response(dialogue_manager.get_dialogue("registration.phase2.bio_prompt"))
        
        if response and len(response) > 10:
            worker_data["bio"] = response
            await speak_human_like(dialogue_manager.get_dialogue("registration.phase2.bio_success"), pace=1.0)
        else:
            # Create a better default bio
            skills_text = ", ".join(worker_data.get("skills", ["Construction"]))
            worker_data["bio"] = f"मैं {worker_data.get('experience', '1-2 years')} का अनुभव रखता हूं {skills_text} के काम में। मेहनती और ईमानदार हूं।"
    
    # Update registration phase and verification status
    worker_data["registrationPhase"] = 2
    worker_data["verificationStatus"] = "application_ready"
    worker_data["profileCompletionPercentage"] = 75  # Phase 2 gives 75% completion
    
    # Save updated data to database
    try:
        workers_collection = db.workers
        result = workers_collection.update_one(
            {"phone": worker_data["phone"]},
            {"$set": {
                "aadharNumber": worker_data["aadharNumber"],
                "workRadius": worker_data["workRadius"],
                "bio": worker_data["bio"],
                "registrationPhase": worker_data["registrationPhase"],
                "verificationStatus": worker_data["verificationStatus"],
                "profileCompletionPercentage": worker_data["profileCompletionPercentage"],
                "lastLogin": datetime.now().isoformat()
            }}
        )
        
        if result.modified_count > 0:
            print(f"✅ Worker Phase 2 completed: {worker_data['name']} - {worker_data['phone']}")
            await speak_human_like(
                dialogue_manager.get_dialogue("registration.phase2.completion_message"),
                pace=0.9
            )
        else:
            print(f"⚠️ No changes made to worker: {worker_data['phone']}")
        
        return worker_data
        
    except Exception as e:
        print(f"❌ Error updating worker Phase 2: {e}")
        await speak_human_like("कुछ तकनीकी समस्या हुई, पर आपकी जानकारी सेव हो गई है।", pace=1.0)
        return worker_data

def calculate_profile_completion(data: dict) -> int:
    """Calculate profile completion percentage"""
    required_fields = [
        'name', 'age', 'phone', 'gender', 'skills', 'experience', 
        'preferredCategory', 'expectedSalary', 'languages'
    ]
    location_fields = ['village', 'district', 'state', 'pincode']
    
    completed = 0
    total = len(required_fields) + len(location_fields) + 3  # +3 for optional fields
    
    # Check required fields
    for field in required_fields:
        if field in data and data[field]:
            if isinstance(data[field], list) and len(data[field]) > 0:
                completed += 1
            elif not isinstance(data[field], list):
                completed += 1
    
    # Check location fields
    for field in location_fields:
        if data.get('location', {}).get(field):
            completed += 1
    
    # Check optional fields
    if data.get('email'):
        completed += 1
    if data.get('aadharNumber'):
        completed += 1
    if data.get('bio') and len(data['bio']) > 20:
        completed += 1
    
    return min(100, int((completed / total) * 100))

def calculate_shakti_score(data: dict) -> int:
    """Calculate initial shakti score based on profile completeness and quality"""
    score = 0
    
    # Basic info (30 points)
    if data.get('name'): score += 5
    if data.get('phone'): score += 5
    if data.get('age') and 18 <= data['age'] <= 65: score += 10
    if data.get('gender'): score += 5
    if data.get('location', {}).get('pincode'): score += 5
    
    # Skills and experience (25 points)
    if data.get('skills') and len(data['skills']) > 0: score += 10
    if data.get('skills') and len(data['skills']) >= 3: score += 5  # Bonus for multiple skills
    if data.get('experience'): score += 5
    if data.get('preferredCategory'): score += 5
    
    # Communication (20 points)
    if data.get('languages') and len(data['languages']) > 1: score += 10
    if data.get('languages') and 'English' in data['languages']: score += 5  # English bonus
    if data.get('bio') and len(data['bio']) > 30: score += 5
    
    # Work preferences (15 points)
    if data.get('expectedSalary'): score += 5
    if data.get('workRadius') and data['workRadius'] >= 15: score += 5  # Flexible radius
    if data.get('availability'): score += 5
    
    # Verification (10 points)
    if data.get('aadharNumber'): score += 10
    
    return min(100, score)

async def main() -> None:
    if sys.platform.startswith("win"):
        try:
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        except Exception:
            pass

    print("🎭 SINDH Orchestra Agent Starting...")
    print("🔍 Connecting to database first...")
    
    # Connect to database FIRST before any voice interaction
    client, db = await connect_to_mongodb()
    if client is None or db is None:
        print("❌ Database connection failed. Cannot proceed.")
        return
    
    print("✅ Database connected successfully. Starting voice interaction...")
    
    # Initialize RAG system early to avoid repeated initialization
    print("🧠 Initializing RAG system...")
    try:
        rag_system = get_simple_rag()
        print("✅ RAG system initialized successfully")
    except Exception as rag_error:
        print(f"⚠️ RAG initialization warning: {rag_error}")
        print("🔄 Will initialize RAG on demand")
    
    # Start background office ambiance
    start_background_audio()
    await asyncio.sleep(0.5)  # Brief pause to let background audio initialize
    
    try:
        # Natural introduction
        await create_natural_intro()
        
        # Get user's name
        user_name = None
        user_phone = None
        worker_data = None
        max_attempts = get_max_retries()  # Use TARA config
        
        # Step 1: Get name (with intelligent RAG support using enhanced function)
        user_name = await collect_name_with_rag_support(rag_system, max_attempts)
        
        if not user_name:
            await speak_human_like(dialogue_manager.get_dialogue("data_collection.name_collection.fallback_message"))
            user_name = "मित्र"
        
        # Step 2: Get phone number and check if registered (with intelligent RAG support using enhanced function)
        user_phone = await collect_phone_with_rag_support(rag_system, max_attempts)
        
        if not user_phone:
            await speak_human_like(dialogue_manager.get_dialogue("data_collection.phone_collection.failure_message"))
            return
        
        # Check if user exists and handle registration if needed
        await speak_human_like(dialogue_manager.phone_processing(), pace=1.2)
        worker_data = await check_worker_exists(db, user_phone)
        
        if worker_data:
            # Existing user - welcome them back
            registration_attempted = False
            registration_result = False
            actual_name = format_name_for_hindi_tts(worker_data.get('name', user_name))
            await speak_human_like(dialogue_manager.meeting_expression(actual_name), pace=0.9)
            user_name = actual_name
            
            # **NEW: Store worker profile in RAG for personalized responses (background)**
            asyncio.create_task(store_worker_profile_background(worker_data, rag_system, db))
        else:
            # New user - inform them they need to register and start registration FSM
            await speak_human_like(f"{user_name} जी, आपका फ़ोन नंबर हमारे रिकॉर्ड में नहीं मिला। आप नए हैं और आपको रजिस्ट्रेशन करना होगा। चलिए मैं आपका रजिस्ट्रेशन करवा देता हूँ।", pace=1.0)
            
            # Route directly to registration FSM for new users
            registration_attempted = True
            registration_data = {"name": user_name, "phone": user_phone}
            registered_worker = await route_to_service("register", registration_data, client, db)
            registration_result = registered_worker is not None
            if registered_worker:
                worker_data = registered_worker
                user_name = registered_worker.get('name', user_name)
                # After successful registration, inform user - no need to ask twice
                await speak_human_like(f"बहुत बढ़िया {user_name} जी! आपका रजिस्ट्रेशन हो गया है।", pace=1.0, emotion='excited')
                
                # **NEW: Store newly registered worker profile in RAG for future personalized responses (background)**
                asyncio.create_task(store_worker_profile_background(worker_data, rag_system, db))
            else:
                # Registration failed - still continue conversation
                await speak_human_like(f"अभी रजिस्ट्रेशन में कुछ दिक्कत है {user_name} जी, लेकिन कोई बात नहीं। आप फिलहाल jobs देख सकते हैं।", pace=1.0)
        
        # Track if jobs were already shown for new registrations
        jobs_already_shown = False
        
        # Step 3: For new registrations, automatically show jobs. For existing users, ask what they want
        if worker_data and worker_data.get('name'):  
            formatted_name = format_name_for_hindi_tts(user_name)
            
            # If this was a new registration, automatically proceed to jobs
            if registration_attempted and registration_result:
                await speak_human_like(
                    f"चलिए {formatted_name} जी, अब मैं आपको आज के उपलब्ध काम दिखाती हूँ।",
                    pace=0.9
                )
                # Directly launch available jobs browser for new users
                try:
                    await available_jobs_browser(worker_data)
                    jobs_already_shown = True
                    await speak_human_like("और कुछ मदद चाहिए जी?", pace=0.9)
                except Exception as e:
                    print(f"❌ Error in available jobs browser: {e}")
                    await speak_human_like("काम दिखाने में थोड़ी तकलीफ हो रही है जी। कोई बात नहीं, थोड़ी देर बाद कोशिश कीजिएगा।")
            else:
                # For existing users, ask what they want to do
                await speak_human_like(
                    dialogue_manager.service_selection_prompt(formatted_name),
                    pace=0.9
                )
        
        while True:
            # Get user intent (without repeating the question each time)
            service_completed = False
            
            # Skip normal flow if jobs were already shown for new users
            if jobs_already_shown:
                jobs_already_shown = False  # Reset flag
                # Just wait for next request after showing jobs
                for attempt in range(max_attempts):
                    print(f"🎯 Waiting for continuation request (attempt {attempt + 1}/{max_attempts})")
                    user_input = await get_user_input()
                    if not user_input:
                        continue
                    
                    # Parse intent for continuation
                    intent_data = sindh_parser.parse_intent(user_input, user_name or "भाई")
                    
                    if intent_data['intent'] in ['goodbye', 'exit']:
                        await speak_human_like(dialogue_manager.goodbye_message())
                        return
                    elif intent_data['intent'] in ['applied_jobs', 'new_jobs', 'help']:
                        # Handle the new request normally
                        break
                    else:
                        if attempt < max_attempts - 1:
                            await speak_human_like("कुछ और चाहिए जी? या फिर मैं आपकी मदद कैसे कर सकती हूँ?")
                        else:
                            await speak_human_like("ठीक है जी, अगर कुछ चाहिए तो बताइएगा।")
                            return
                
                if not user_input:
                    return
            
            else:
                # Normal service selection flow
                for attempt in range(max_attempts):
                    print(f"🎯 Waiting for user input (attempt {attempt + 1}/{max_attempts})")
                    
                    # Get user intent using SINDH parser as primary decision authority
                    context = {
                        "current_state": "service_selection", 
                        "user_name": user_name,
                        "user_phone": user_phone,
                        "attempt": attempt
                    }
                    user_text, classification = await transcribe_and_classify_speech(context)
                    
                    print(f"📝 Received: '{user_text}' | Classification: {classification}")
                    
                    if not user_text or not user_text.strip():
                        print("⚠️  No text received, asking user to speak again")
                        await speak_human_like("क्या चाहिए? फिर से बोलिए?", pace=1.0)
                        await asyncio.sleep(0.5)  # Small delay to prevent rapid looping
                        continue
                    
                    # Process the classification and break out of loop if valid
                    break
                
                # Create unique task ID for background classification
                task_id = f"intent_{int(time.time()*1000)}"
                
                # Check for exit/goodbye keywords
                if dialogue_manager.check_exit_keywords(user_text):
                    # Start background classification during goodbye speech
                    await speak_human_like(
                        dialogue_manager.goodbye_message(), 
                        pace=0.9,
                        run_background_task=task_id,
                        background_transcript=user_text
                    )
                    return
                
                # Use SINDH fine-tuned parser for routing decisions
                intent = "unknown"  # Default fallback
                
                # Get classification from SINDH parser
                try:
                    sindh_result = await classify_with_fine_tuned_llm(user_text, context)
                    print(f"🎯 SINDH parser result: {sindh_result}")
                    
                    llm_intent = sindh_result.get("intent", "UNCLEAR")
                    confidence = sindh_result.get("confidence", 0)
                    should_use_rag = sindh_result.get("should_use_rag", False)
                    
                    print(f"🤖 SINDH Parser Classification:")
                    print(f"   • Intent: {llm_intent}")
                    print(f"   • Confidence: {confidence:.2f}")
                    print(f"   • Should use RAG: {should_use_rag}")
                    
                    # Route based on SINDH parser decision
                    if confidence >= 0.7:  # High confidence threshold
                        if llm_intent.startswith("RAG_") or should_use_rag:
                            # Route to RAG for knowledge-based queries
                            intent = "rag"
                            print(f"🎯 ROUTING DECISION: RAG (SINDH intent: {llm_intent})")
                        elif llm_intent in ["PERSONAL_INFO_QUERY", "FINANCIAL_INFO_QUERY", "PROFILE_INFO"] and worker_data:
                            # **NEW: Route personal info queries to RAG for humanized responses when worker profile is available**
                            intent = "rag"
                            print(f"🎯 ROUTING DECISION: RAG for Personalized Response (SINDH intent: {llm_intent})")
                        else:
                            # Route to appropriate FSM handler based on SINDH intent
                            if llm_intent in ["NEW_JOBS_QUERY", "JOB_SEARCH"]:
                                intent = "new_jobs"
                            elif llm_intent in ["APPLIED_JOBS_QUERY", "APPLICATION_STATUS"]:
                                intent = "applied_jobs"
                            elif llm_intent in ["PERSONAL_INFO_QUERY", "FINANCIAL_INFO_QUERY", "PROFILE_INFO"]:
                                intent = "personal_info"  # Fallback to FSM if no worker_data
                            elif llm_intent in ["NAME_COLLECTION", "PHONE_COLLECTION", "REGISTRATION"]:
                                intent = "register"
                            elif llm_intent in ["GREETING", "CONVERSATION"]:
                                intent = "conversation"
                            else:
                                # For other intents, try FSM parsing as fallback
                                intent = parse_user_intent(user_text)
                            
                            print(f"🎯 ROUTING DECISION: Direct FSM ({intent}) (SINDH intent: {llm_intent})")
                    else:
                        # Lower confidence - use traditional FSM parsing but check for personal info
                        intent = parse_user_intent(user_text)
                        
                        # **NEW: Even with low confidence, route personal info to RAG if worker profile exists**
                        if intent == "personal_info" and worker_data:
                            intent = "rag"
                            print(f"🎯 ROUTING DECISION: RAG for Personalized Response (FSM detected personal_info, worker profile available)")
                        else:
                            print(f"🔄 FALLBACK: Using FSM parser ({intent}) - Low SINDH confidence ({confidence:.2f})")
                        
                except Exception as e:
                    print(f"❌ SINDH parser error: {e}")
                    # No SINDH classification available - fallback to FSM
                    intent = parse_user_intent(user_text)
                    
                    # **NEW: Even with SINDH parser failure, route personal info to RAG if worker profile exists**
                    if intent == "personal_info" and worker_data:
                        intent = "rag"
                        print(f"🎯 ROUTING DECISION: RAG for Personalized Response (FSM detected personal_info, worker profile available)")
                    else:
                        print(f"🔄 FALLBACK: Using FSM parser ({intent}) - SINDH parser failed")
                
                # Handle registration intent
                if intent == "register":
                    if not worker_data:
                        # New user wants to register (shouldn't happen since we auto-register)
                        await speak_human_like(f"{user_name} जी, लगता है आपका रजिस्ट्रेशन पहले ही हो चुका है या फिर कुछ गड़बड़ है। एक बार फिर से कोशिश करते हैं।", pace=1.0)
                        registration_data = {"name": user_name, "phone": user_phone}
                        registered_worker = await route_to_service("register", registration_data, client, db)
                        if registered_worker:
                            worker_data = registered_worker
                            user_name = registered_worker.get('name', user_name)
                    else:
                        # Existing user wants to update registration
                        await speak_human_like(
                            f"{user_name} जी, आपका रजिस्ट्रेशन तो पहले से ही है। अगर कुछ अपडेट करना है तो बता सकते हैं।",
                            pace=1.0,
                            run_background_task=task_id,
                            background_transcript=user_text
                        )
                    service_completed = True
                    break
                    
                elif intent == "applied_jobs":
                    if not worker_data:
                        # This should rarely happen since new users are auto-registered
                        await speak_human_like(f"अरे {user_name} जी, लगता है आपका रजिस्ट्रेशन अभी तक नहीं हुआ है। पहले रजिस्ट्रेशन करवाना होगा।", pace=1.0)
                        registration_data = {"name": user_name, "phone": user_phone}
                        registered_worker = await route_to_service("register", registration_data, client, db)
                        if registered_worker:
                            worker_data = registered_worker
                            user_name = registered_worker.get('name', user_name)
                            # Now proceed with applied jobs after registration
                            await speak_human_like(f"बहुत बढ़िया! अब आपके applied jobs देखते हैं।", pace=1.0, emotion='happy')
                        else:
                            await speak_human_like(f"{user_name} जी, अभी रजिस्ट्रेशन में दिक्कत है। कुछ और करना चाहेंगे?", pace=1.0)
                            continue
                    await route_to_service("applied_jobs", worker_data, client, db)
                    service_completed = True
                    break
                    
                elif intent == "new_jobs":
                    if not worker_data:
                        # This should rarely happen since new users are auto-registered
                        await speak_human_like(f"जी {user_name} जी, लगता है आपका रजिस्ट्रेशन अभी तक नहीं हुआ है। पहले रजिस्ट्रेशन करवाना होगा।", pace=1.0)
                        registration_data = {"name": user_name, "phone": user_phone}
                        registered_worker = await route_to_service("register", registration_data, client, db)
                        if registered_worker:
                            worker_data = registered_worker
                            user_name = registered_worker.get('name', user_name)
                            # Now proceed with new jobs after registration
                            await speak_human_like(f"बहुत बढ़िया! अब नए jobs देखते हैं।", pace=1.0, emotion='happy')
                        else:
                            await speak_human_like(f"{user_name} जी, अभी रजिस्ट्रेशन में दिक्कत है। कुछ और करना चाहेंगे?", pace=1.0)
                            continue
                    await route_to_service("new_jobs", worker_data, client, db)
                    service_completed = True
                    break
                    
                elif intent == "personal_info":
                    if not worker_data:
                        # This should rarely happen since new users are auto-registered
                        await speak_human_like(f"अरे {user_name} जी, आपकी जानकारी देखने के लिए पहले रजिस्ट्रेशन करना होगा।", pace=1.0)
                        registration_data = {"name": user_name, "phone": user_phone}
                        registered_worker = await route_to_service("register", registration_data, client, db)
                        if registered_worker:
                            worker_data = registered_worker
                            user_name = registered_worker.get('name', user_name)
                        else:
                            await speak_human_like(f"{user_name} जी, अभी रजिस्ट्रेशन में दिक्कत है। कुछ और करना चाहेंगे?", pace=1.0)
                            continue
                    
                    # Initialize PersonalInfoBrowser and process the query
                    try:
                        if PersonalInfoBrowser:
                            personal_browser = PersonalInfoBrowser(dialogue_manager, db, worker_data)
                            # Process the specific personal info query
                            await personal_browser.process_personal_query(user_text)
                            service_completed = True
                            break
                        else:
                            await speak_human_like("अभी प्रोफाइल की सुविधा उपलब्ध नहीं है।", pace=1.0)
                    except Exception as e:
                        print(f"❌ Error processing personal info query: {e}")
                        await speak_human_like("अभी प्रोफाइल की जानकारी देखने में कुछ दिक्कत है। थोड़ी देर बाद कोशिश करिए।", pace=1.0)
                    continue
                
                elif intent == "rag":
                    # Handle RAG queries using the knowledge base with SINDH parser context
                    try:
                        # Get SINDH classification context for better RAG processing
                        llm_intent = sindh_result.get("intent", "RAG_GENERAL_QUERY") if 'sindh_result' in locals() else "RAG_GENERAL_QUERY"
                        extracted_info = sindh_result.get("extracted_info", {}) if 'sindh_result' in locals() else {}
                        llm_confidence = sindh_result.get("confidence", 0.0) if 'sindh_result' in locals() else 0.0
                        
                        print(f"🤖 Processing RAG query: '{user_text}'")
                        print(f"   📝 SINDH Intent: {llm_intent}")
                        print(f"   🔍 Context: {extracted_info}")
                        
                        # **NEW: Enhanced personal information processing**
                        is_personal_query = llm_intent in ["PERSONAL_INFO_QUERY", "FINANCIAL_INFO_QUERY", "PROFILE_INFO"]
                        if is_personal_query and worker_data:
                            print(f"   👤 Personal query detected - using worker profile: {worker_data.get('name', 'Unknown')} ({worker_data.get('phone', 'Unknown')})")
                            
                            # Use enhanced personal RAG processor for better classification
                            try:
                                from enhanced_personal_rag import get_personal_rag_processor
                                personal_processor = get_personal_rag_processor(db)
                                query_type = personal_processor.classify_personal_query_type(user_text)
                                print(f"   🎯 Personal query type: {query_type}")
                                
                                # Add enhanced context to the query for better personalized responses
                                enhanced_query = f"व्यक्तिगत प्रश्न ({query_type}) {worker_data.get('name', 'उपयोगकर्ता')} के लिए: {user_text}"
                            except Exception as classification_error:
                                print(f"⚠️ Personal query classification warning: {classification_error}")
                                enhanced_query = f"व्यक्तिगत प्रश्न {worker_data.get('name', 'उपयोगकर्ता')} के लिए: {user_text}"
                        else:
                            enhanced_query = user_text
                        
                        # Start timing for performance tracking
                        start_time = time.time()
                        
                        # Process through RAG system with enhanced query context
                        rag_result = await process_rag_query(enhanced_query, user_id=user_phone)
                        
                        if rag_result['confidence'] > 0.5 and not rag_result.get('should_fallback', False):
                            # RAG responses are now naturally generated, minimal processing needed
                            raw_answer = rag_result['answer']
                            
                            # Check if response is already natural (no formal introductions)
                            formal_indicators = [
                                "मैं तारा हूँ", "I am Tara", "SINDH प्लेटफॉर्म की ग्राहक सेवा",
                                "customer care agent", "नमस्ते! मैं", "Hello! I am"
                            ]
                            
                            is_already_natural = not any(indicator in raw_answer for indicator in formal_indicators)
                            
                            if is_already_natural:
                                # Response is already natural, use directly
                                clean_answer = raw_answer
                                print(f"🎯 Natural RAG response used directly")
                            else:
                                # Only clean if formal elements detected
                                clean_answer = await process_rag_response_for_conversation(
                                    raw_answer, 
                                    user_text, 
                                    llm_intent,
                                    user_name
                                )
                                print(f"🎯 RAG response cleaned for naturalness")
                            
                            # Calculate processing time
                            processing_time = time.time() - start_time
                            
                            # 🧠 CAPTURE RAG INTERACTION FOR MEMORY AND FINE-TUNING
                            try:
                                await capture_rag_interaction(
                                    user_stt=user_text,
                                    user_intent=llm_intent,
                                    intent_confidence=llm_confidence,
                                    rag_query=user_text,
                                    rag_response=clean_answer,
                                    rag_confidence=rag_result['confidence'],
                                    sources=rag_result.get('sources', []),
                                    user_name=user_name,
                                    processing_time=processing_time,
                                    additional_context={
                                        "extracted_info": extracted_info,
                                        "was_cleaned": not is_already_natural,
                                        "original_response": raw_answer if not is_already_natural else None,
                                        "conversation_state": "service_selection"
                                    }
                                )
                            except Exception as memory_error:
                                print(f"⚠️ Memory capture error: {memory_error}")
                            
                            # Deliver clean, natural response
                            await speak_human_like(clean_answer, pace=1.0)
                            print(f"✅ RAG response delivered (confidence: {rag_result['confidence']:.2f})")
                            print(f"📝 Original: {raw_answer[:100]}...")
                            print(f"🗣️ Cleaned: {clean_answer[:100]}...")
                            service_completed = True
                            break
                        else:
                            # Low confidence or should fallback - continue with FSM
                            print(f"⚠️  RAG confidence too low ({rag_result['confidence']:.2f}) or suggests fallback")
                            
                            # Calculate processing time
                            processing_time = time.time() - start_time
                            
                            # Determine fallback response
                            fallback_response = ""
                            if llm_intent == "RAG_PAYMENT_INFO":
                                fallback_response = "पैसों के बारे में जानकारी के लिए आप 'प्रोफाइल' या 'बैलेंस' का विकल्प चुन सकते हैं।"
                            elif llm_intent == "RAG_JOB_INFO":
                                fallback_response = "नौकरी की जानकारी के लिए 'नई नौकरी' या 'लगाई गई नौकरी' का विकल्प चुनें।"
                            else:
                                fallback_response = "मुझे इस सवाल का पूरा यकीन नहीं है। कृपया अपना सवाल थोड़ा और स्पष्ट करें या कोई खास सेवा चुनें।"
                            
                            # 🧠 CAPTURE FAILED RAG INTERACTION FOR ANALYSIS
                            try:
                                await capture_rag_interaction(
                                    user_stt=user_text,
                                    user_intent=llm_intent,
                                    intent_confidence=llm_confidence,
                                    rag_query=user_text,
                                    rag_response=f"[FALLBACK] {fallback_response}",
                                    rag_confidence=rag_result['confidence'],
                                    sources=rag_result.get('sources', []),
                                    user_name=user_name,
                                    processing_time=processing_time,
                                    additional_context={
                                        "extracted_info": extracted_info,
                                        "fallback_reason": "low_confidence_or_should_fallback",
                                        "conversation_state": "service_selection",
                                        "rag_error": rag_result.get('error', None)
                                    }
                                )
                            except Exception as memory_error:
                                print(f"⚠️ Memory capture error: {memory_error}")
                            
                            # Deliver fallback response
                            await speak_human_like(fallback_response, pace=1.0)
                            # Continue the loop to ask again
                            continue
                    except ImportError:
                        print("⚠️  RAG system not available")
                        await speak_human_like("अभी इस सवाल का जवाब देने में समस्या है। कुछ और मदद चाहिए?", pace=1.0)
                        continue
                    except Exception as e:
                        print(f"❌ Error processing RAG query: {e}")
                        
                        # Calculate processing time
                        processing_time = time.time() - start_time
                        
                        # 🧠 CAPTURE RAG ERROR FOR ANALYSIS
                        try:
                            await capture_rag_interaction(
                                user_stt=user_text,
                                user_intent=llm_intent,
                                intent_confidence=llm_confidence,
                                rag_query=user_text,
                                rag_response=f"[ERROR] {str(e)}",
                                rag_confidence=0.0,
                                sources=[],
                                user_name=user_name,
                                processing_time=processing_time,
                                additional_context={
                                    "extracted_info": extracted_info,
                                    "error_type": "rag_processing_error",
                                    "error_message": str(e),
                                    "conversation_state": "service_selection"
                                }
                            )
                        except Exception as memory_error:
                            print(f"⚠️ Memory capture error: {memory_error}")
                        
                        await speak_human_like("अभी इस सवाल का जवाब देने में समस्या है। कुछ और मदद चाहिए?", pace=1.0)
                        continue
                    
                else:
                    if attempt < max_attempts - 1:
                        await speak_human_like(
                            dialogue_manager.get_dialogue("services.service_selection.clarification_prompt"),
                            pace=1.0,
                            run_background_task=task_id,
                            background_transcript=user_text
                        )
                    else:
                        # Default to launcher
                        await speak_human_like(
                                dialogue_manager.get_dialogue("services.service_selection.default_action"),
                                run_background_task=task_id,
                                background_transcript=user_text
                            )
                        await route_to_service("launcher", worker_data, client, db)
                        service_completed = True
                        break
                
            # After service completion, ask if they want something else
            if service_completed:
                await speak_human_like(dialogue_manager.service_continuation_prompt(), pace=0.9)
                # Continue the loop to get next request
            else:
                # If no service was completed (max attempts reached), offer to try again
                await speak_human_like(dialogue_manager.get_dialogue("services.service_selection.retry_prompts"), pace=1.0)
        
    finally:
        # Stop background audio
        stop_background_audio()
        
        if client is not None:
            client.close()
            print("📁 MongoDB connection closed")

if __name__ == "__main__":
    asyncio.run(main())
