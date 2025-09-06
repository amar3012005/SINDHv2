"""
RAG Integration for Orchestra Agent
===================================

Simple integration to test RAG responses in the existing SINDH system.
This will add RAG capabilities to the V2 classification routing.
"""

import os
import re
import asyncio
from typing import Dict, Any, Optional, List
from pathlib import Path

# FAISS and embeddings
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

# Gemini for response generation
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class SimpleRAG:
    """
    Simple RAG implementation for SINDH platform
    
    Features:
    - Vector search using FAISS
    - Gemini-powered response generation
    - Hindi/English support
    - Direct integration with orchestra agent
    """
    
    def __init__(self):
        self.vector_store = None
        self.embeddings = None
        self.gemini_model = None
        self.setup_complete = False
        self._initialize()
    
    def _initialize(self):
        """Initialize RAG components"""
        try:
            print("🚀 Initializing Simple RAG...")
            
            # Load vector store
            vector_store_path = "rag_pipeline/vector_store"
            
            if not os.path.exists(vector_store_path):
                print("❌ Vector store not found! Please run setup_simple_kb.py first")
                return
            
            # Initialize embeddings
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                model_kwargs={'device': 'cpu'}
            )
            
            # Load FAISS vector store
            self.vector_store = FAISS.load_local(
                vector_store_path, 
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            
            # Initialize Gemini with explicit API key
            api_key = os.getenv('GEMINI_API_KEY', "AIzaSyAe-Q8-VtS_uPeQTQWXWbjEvfXVMlgW0TQ")
            if api_key:
                genai.configure(api_key=api_key)
                self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
                print("✅ Gemini initialized")
            else:
                print("⚠️  GEMINI_API_KEY not found, will use template responses")
            
            self.setup_complete = True
            print("✅ Simple RAG initialized successfully!")
            
        except Exception as e:
            print(f"❌ RAG initialization failed: {e}")
            self.setup_complete = False
    
    async def answer_question(self, question: str, user_id: str = None) -> Dict[str, Any]:
        """
        Answer user question using RAG
        
        Returns:
        - answer: Generated response
        - confidence: Response confidence (0-1)
        - sources: List of source documents
        - should_fallback: Whether to fallback to FSM
        """
        
        if not self.setup_complete:
            return {
                "answer": "माफ़ करिए, सिस्टम अभी तैयार नहीं है। कृपया थोड़ी देर बाद कोशिश करें।",
                "confidence": 0.0,
                "sources": [],
                "should_fallback": True,
                "error": "RAG not initialized"
            }
        
        try:
            print(f"🔍 RAG Query: '{question}'")
            
            # Search for relevant documents - Enhanced retrieval with scoring
            search_results_with_scores = self.vector_store.similarity_search_with_score(
                question, 
                k=10  # Get top 10 candidates first
            )
            
            # Filter by relevance threshold and take top 8
            relevance_threshold = 0.7  # Adjust as needed
            search_results = []
            for doc, score in search_results_with_scores:
                # Lower score means higher similarity in some implementations
                if len(search_results) < 8:  # Take top 8 regardless of score for now
                    search_results.append(doc)
            
            # Fallback to regular search if no results
            if not search_results:
                search_results = self.vector_store.similarity_search(question, k=5)
            
            if not search_results:
                print("❌ No relevant documents found")
                import random
                no_docs_responses = [
                    "हम्म... इस topic पर मेरे पास बहुत clear info नहीं है। कुछ और detail से पूछ सकते हो?",
                    "ये सवाल interesting है! लेकिन अभी मुझे इसके बारे में exact जानकारी नहीं मिल रही।",
                    "अरे... लगता है ये question थोड़ी specific है। थोड़ा अलग तरीके से पूछकर देखो?",
                    "उम्म, इसका direct answer तो मेरे database में नहीं मिल रहा। Help team से contact करना बेहतर होगा।",
                    "सॉरी यार, इस particular चीज़ की जानकारी अभी मेरे पास available नहीं है।"
                ]
                return {
                    "answer": random.choice(no_docs_responses),
                    "confidence": 0.2,
                    "sources": [],
                    "should_fallback": True,
                    "reason": "No relevant documents"
                }
            
            # Combine context from search results
            context = "\n\n".join([doc.page_content for doc in search_results])
            sources = [doc.metadata.get('source', 'unknown') for doc in search_results]
            
            print(f"✅ Found {len(search_results)} relevant documents")
            
            # Generate response using Gemini
            if self.gemini_model:
                answer = await self._generate_with_gemini(question, context)
                confidence = 0.8  # High confidence for Gemini responses
            else:
                # Fallback to template response
                answer = await self._generate_template_response(question, search_results)
                confidence = 0.6
            
            # Detect if this requires FSM action
            should_fallback = self._should_route_to_fsm(question, answer)
            
            result = {
                "answer": answer,
                "confidence": confidence,
                "sources": sources,
                "should_fallback": should_fallback,
                "context_used": len(search_results)
            }
            
            print(f"✅ RAG Response generated (confidence: {confidence:.2f})")
            return result
            
        except Exception as e:
            print(f"❌ RAG error: {e}")
            # More natural and varied fallback responses
            import random
            natural_fallbacks = [
                "अरे यार... कुछ technical issue हो रही है। थोड़ी देर बाद try करना?",
                "उम्म... लगता है system में थोड़ी सी problem है। माफ़ करना!",
                "अभी कुछ गड़बड़ी चल रही है यहाँ। बस कुछ देर की बात है।", 
                "ओह हो! कुछ technical चक्कर लग रहा है। थोड़ा wait करना पड़ेगा।",
                "सॉरी... अभी system थोड़ा slow है। फिर से पूछना थोड़ी देर में।"
            ]
            return {
                "answer": random.choice(natural_fallbacks),
                "confidence": 0.0,
                "sources": [],
                "should_fallback": True,
                "error": str(e)
            }
    
    def _is_personal_worker_query(self, question: str, context: str) -> bool:
        """Check if the query is about personal worker information"""
        if not question or not context:
            return False
            
        # Convert to lowercase for checking
        question_lower = question.lower() if question else ""
        context_lower = context.lower() if context else ""
        
        # Personal information keywords in the question
        personal_keywords = [
            'मेरा', 'मेरी', 'मेरे', 'आपका', 'आपकी', 'आपके', 'तुम्हारा', 'तुम्हारी',
            'my', 'your', 'profile', 'प्रोफाइल', 'personal', 'व्यक्तिगत',
            'नाम', 'name', 'उम्र', 'age', 'पता', 'address', 'स्किल', 'skill',
            'बैलेंस', 'balance', 'कमाई', 'earning', 'अनुभव', 'experience'
        ]
        
        # Check if question contains personal keywords
        has_personal_keywords = any(keyword in question_lower for keyword in personal_keywords)
        
        # Check if context contains worker profile information
        profile_indicators = [
            'व्यक्तिगत जानकारी', 'personal', 'नाम:', 'फोन:', 'उम्र:', 'स्किल:', 
            'बैलेंस:', 'अनुभव:', 'कुल नौकरियां', 'शक्ति स्कोर'
        ]
        
        has_profile_context = any(indicator in context_lower for indicator in profile_indicators)
        
        return has_personal_keywords and has_profile_context

    async def _generate_with_gemini(self, question: str, context: str) -> str:
        """Generate natural, human-like response using Gemini with enhanced prompts"""
        
        # Check if this is a personal information query about worker profile
        is_personal_query = self._is_personal_worker_query(question, context)
        
        if is_personal_query:
            # Use personalized response generator for worker profile information
            try:
                from personal_response_generator import generate_personalized_rag_response
                personalized_response = generate_personalized_rag_response(question, context)
                print(f"🎯 Using personalized response generator for worker profile query")
                return personalized_response
            except ImportError:
                print("⚠️ Personal response generator not available, using general method")
        
        # Check for TARA personal queries
        is_tara_personal = self._is_tara_personal_query(question)
        
        # Detect language and preferred style
        is_hindi = any(ord(char) >= 0x900 and ord(char) <= 0x97F for char in question)
        hindi_keywords = ['kab', 'kaise', 'kitna', 'kya', 'kahan', 'kaun', 'milega', 'hoga', 'chahiye', 'mera', 'mere']
        is_hinglish = any(keyword in question.lower() for keyword in hindi_keywords)
        use_hindi = is_hindi or is_hinglish
        
        # Generate response based on query type
        try:
            if is_tara_personal:
                response = await self._generate_tara_personal_response(question, use_hindi)
            else:
                response = await self._generate_platform_response(question, context, use_hindi)
            
            return response if response else "माफ़ करिए, मुझे इस सवाल का सटीक जवाब नहीं मिला।"
            
        except Exception as e:
            print(f"❌ Gemini generation error: {e}")
            # Fallback responses
            if use_hindi:
                fallbacks = [
                    "माफ़ करिए, अभी कुछ technical issue है। कुछ देर बाद पूछिए?",
                    "सॉरी यार, अभी system में थोड़ी problem है। बाद में try करना।",
                    "उम्म... लगता है कुछ गड़बड़ है। Help team से contact करिए।"
                ]
            else:
                fallbacks = [
                    "Sorry, I'm experiencing some technical difficulties. Could you try again later?",
                    "My apologies, there seems to be a temporary issue. Please try again.",
                    "I'm having trouble processing that right now. Please contact support."
                ]
            
            import random
            return random.choice(fallbacks)

    def _is_tara_personal_query(self, question: str) -> bool:
        """Check if question is asking about Tara's personal information"""
        if not question:
            return False
            
        tara_keywords = [
            'तारा', 'tara', 'तुम', 'आप', 'तुम्हारा', 'आपका', 'तुम्हारी', 'आपकी',
            'about you', 'your name', 'who are you', 'tell me about yourself',
            'तुम कौन हो', 'आप कौन हैं', 'तुम्हारे बारे में', 'आपके बारे में'
        ]
        
        return any(keyword.lower() in question.lower() for keyword in tara_keywords)

    async def _generate_tara_personal_response(self, question: str, use_hindi: bool = True) -> str:
        """Generate Tara's personal responses with consistent personality"""
        
        import random
        
        # Detect the specific type of personal query about Tara
        query_type = self._classify_tara_query_type(question)
        
        if use_hindi:
            # More varied and natural responses based on query type
            responses = {
                'greeting': [
                    "अरे वाह! मैं बिल्कुल ठीक हूँ यार! तुम कैसे हो? कुछ काम की बात है क्या?",
                    "अरे! मैं एकदम मस्त हूँ! हमेशा खुश रहती हूँ जब किसी की मदद कर सकती हूँ।",
                    "वाह भाई! मैं तो बहुत बढ़िया हूँ। तुम्हारा दिन कैसा जा रहा है?",
                    "हाय! मैं superb हूँ यार! हमेशा ready हूँ help करने के लिए!",
                ],
                'identity': [
                    "अरे हाँ! मैं तारा हूँ - सिंध प्लेटफॉर्म की सबसे helpful लड़की! 😊",
                    "तारा यहाँ! मैं यहाँ workers का सबसे बड़ा दोस्त हूँ।",
                    "जी हाँ, मैं तारा हूँ! यहाँ सभी मुझे प्यार से तारा बहन कहते हैं।",
                    "मैं तारा हूँ यार - SINDH platform की मस्त helper!",
                ],
                'about': [
                    "अरे यार! मैं यहाँ सबकी jobs ढूंढने में help करती हूँ। बहुत exciting काम है!",
                    "मैं तो बस यहाँ workers का साथ देने आई हूँ। कोई भी problem हो, बस पूछ लेना!",
                    "देखो, मैं सिंध platform पर workers की life आसान बनाना चाहती हूँ। यही मेरा passion है!",
                    "मेरा काम है सबकी मदद करना - jobs से लेकर हर छोटी-बड़ी बात में!",
                ],
                'general': [
                    "अरे हाँ! मैं तारा हूँ और मुझे बहुत खुशी होती है यहाँ काम करके!",
                    "मैं बिल्कुल ठीक हूँ! बताओ, तुम्हें क्या help चाहिए?",
                    "वाकई मज़ा आ रहा है! हर दिन कुछ नया सीखती हूँ।",
                ]
            }
            
        else:
            responses = {
                'greeting': [
                    "Hey! I'm doing great! Thanks for asking. How are you doing?",
                    "I'm fantastic! Always happy when I can help someone out.",
                    "Amazing as always! I love what I do here. How's your day?",
                ],
                'identity': [
                    "Yes! I'm Tara - the friendliest helper on SINDH platform! 😊",
                    "That's me - Tara! Everyone's favorite guide here.",
                    "Yep, I'm Tara! Most people call me their SINDH buddy.",
                ],
                'about': [
                    "I love helping workers find amazing jobs! It's so exciting to see people succeed.",
                    "My thing is making life easier for workers. Any problem, just ask!",
                    "I'm all about supporting workers and making this platform super user-friendly!",
                ],
                'general': [
                    "I'm Tara and I absolutely love working here!",
                    "I'm doing wonderful! What can I help you with?",
                    "Really enjoying every day! Always something new to learn.",
                ]
            }
        
        # Get appropriate responses for the query type
        response_options = responses.get(query_type, responses['general'])
        
        # Use Gemini for more varied responses or fallback to templates
        try:
            if use_hindi:
                system_prompt = f"""तुम तारा हो - 25 साल की energetic लड़की जो SINDH platform पर workers की मदद करती है।

तुम्हारी personality:
- बेहद friendly और हँसमुख स्वभाव
- Natural conversation style जैसे दोस्त से बात कर रहे हो  
- हमेशा positive और enthusiastic
- सबकी genuine मदद करना चाहती हो
- थोड़ी playful भी हो लेकिन respectful

Response rules:
- Natural Hindi में बोलो (no formal/robotic language)
- 1-2 sentences में short response दो
- Excited tone रखो
- "अरे", "यार", "जी", "वाह" जैसे natural words use करो
- कभी भी "मैं AI हूँ" मत कहना

User का सवाल: {question}

Tara का natural response (1-2 sentences):"""
            else:
                system_prompt = f"""You are Tara - a 25-year-old energetic girl who helps workers on the SINDH platform.

Your personality:
- Extremely friendly and cheerful nature
- Natural conversation style like talking to a friend
- Always positive and enthusiastic  
- Genuinely want to help everyone
- Slightly playful but always respectful

Response rules:
- Speak in natural, conversational English
- Give short responses in 1-2 sentences
- Maintain excited tone
- Use friendly expressions naturally
- Never mention being an AI

User's question: {question}

Tara's natural response (1-2 sentences):"""
            
            response = await self.gemini_model.generate_content_async(
                system_prompt,
                generation_config={
                    'temperature': 0.9,
                    'top_p': 0.95,
                    'max_output_tokens': 80,
                }
            )
            
            generated_text = response.text.strip()
            
            # Clean up response
            if generated_text:
                # Remove unwanted prefixes
                prefixes_to_remove = ['Tara:', 'Response:', 'तारा:', '**']
                for prefix in prefixes_to_remove:
                    if generated_text.startswith(prefix):
                        generated_text = generated_text[len(prefix):].strip()
                
                # Remove excessive punctuation
                generated_text = re.sub(r'[!]{2,}', '!', generated_text)
                generated_text = re.sub(r'[*]{1,}', '', generated_text)
                
                if len(generated_text) > 10 and len(generated_text) <= 200:
                    return generated_text
            
            # Fallback to template responses
            return random.choice(response_options)
                
        except Exception as e:
            print(f"⚠️ Gemini personal response error: {e}")
            return random.choice(response_options)
    
    def _classify_tara_query_type(self, question: str) -> str:
        """Classify the type of question being asked about Tara"""
        if not question:
            return 'general'
            
        question_lower = question.lower()
        
        # Greeting queries
        if any(word in question_lower for word in ['कैसे हो', 'कैसी हो', 'how are you', 'क्या हाल', 'कैसा चल रहा']):
            return 'greeting'
            
        # Identity queries 
        if any(word in question_lower for word in ['कौन हो', 'नाम क्या', 'who are you', 'तुम्हारा नाम']):
            return 'identity'
            
        # About/work queries
        if any(word in question_lower for word in ['क्या करती', 'काम क्या', 'what do you do', 'बारे में बताओ']):
            return 'about'
            
        return 'general'

    async def _generate_platform_response(self, question: str, context: str, use_hindi: bool = True) -> str:
        """Generate platform-related responses with enhanced system prompts"""
        
        import random
        
        if use_hindi:
            # Enhanced Hindi system prompt with more natural conversation starters
            conversation_starters = [
                "अरे हाँ", "देखिए यार", "अच्छा सुनिए", "बिल्कुल", "हाँ जी", "सुनो", "समझिए", 
                "पता है", "चलो बताती हूँ", "वाकई", "जरूर", "ऐसा है", "मतलब", "देखो",
                "अरे वाह", "सुनो भाई", "हाँ यार"
            ]
            
            enthusiasm_words = [
                "बहुत बढ़िया", "सुपर easy", "एकदम perfect", "बिल्कुल simple", "बहुत आसान",
                "totally fine", "no problem", "very good", "excellent choice"
            ]
            
            starter = random.choice(conversation_starters)
            enthusiasm = random.choice(enthusiasm_words)
            
            system_prompt = f"""तुम तारा हो - SINDH platform की सबसे friendly और helpful assistant। तुम एक real person हो, AI नहीं।

तुम्हारी जिम्मेदारियाँ:
- Workers को jobs ढूंढने में help करना
- Platform के features explain करना  
- Registration और payment process guide करना
- सभी doubts clear करना - बिल्कुल naturally

जवाब देने के rules:
- हमेशा "{starter}" या ऐसे ही natural words से शुरू करो
- सिर्फ Hindi/Hinglish में respond करो 
- 2-3 छोटे sentences में complete answer दो
- Context से सिर्फ जरूरी information use करो
- "{enthusiasm}" जैसे enthusiastic words use करो
- बिल्कुल conversational tone रखो जैसे दोस्त से बात कर रहे हो
- कभी भी formal introduction या "मैं AI हूँ" मत कहो

Context Information:
{context}

User का सवाल: {question}

अब natural response दो:"""

        else:
            conversation_starters = [
                "Oh great!", "Sure thing!", "Absolutely!", "Perfect!", "Excellent question!",
                "I'd love to help!", "No problem!", "Of course!", "Great to know!", "That's awesome!"
            ]
            
            starter = random.choice(conversation_starters)
            
            system_prompt = f"""You are Tara - the most helpful and friendly assistant at SINDH platform. You're a real person, not an AI.

Your responsibilities:
- Help workers find jobs
- Explain platform features
- Guide through registration and payment processes
- Clear all doubts naturally and enthusiastically

Response rules:
- Always start with natural expressions like "{starter}"
- Keep responses to 2-3 short, clear sentences
- Use only necessary information from context
- Maintain excited and positive tone like talking to a friend
- Never mention being an AI or give formal introductions
- End with an encouraging note

Context Information:
{context}

User's Question: {question}

Tara's natural, friendly response:"""

        try:
            response = await self.gemini_model.generate_content_async(
                system_prompt,
                generation_config={
                    'temperature': 0.8,
                    'top_p': 0.9,
                    'max_output_tokens': 150,
                }
            )
            
            generated_text = response.text.strip()
            
            # Clean up response (remove quotes, extra whitespace, unwanted prefixes)
            if generated_text:
                # Remove common unwanted prefixes
                unwanted_prefixes = ['Tara:', 'Response:', 'Answer:', 'तारा:', 'जवाब:', '**', '*']
                for prefix in unwanted_prefixes:
                    if generated_text.startswith(prefix):
                        generated_text = generated_text[len(prefix):].strip()
                
                # Remove excessive punctuation and markdown
                generated_text = re.sub(r'[*]{1,}', '', generated_text)  # Remove asterisks
                generated_text = re.sub(r'[!]{3,}', '!', generated_text)  # Limit exclamations
                generated_text = re.sub(r'\s+', ' ', generated_text)  # Clean whitespace
                
                if len(generated_text) > 15 and len(generated_text) <= 300:
                    return generated_text
                
        except Exception as e:
            print(f"❌ Gemini platform response error: {e}")
        
        # Enhanced fallback responses if Gemini fails
        if use_hindi:
            fallbacks = [
                f"{random.choice(conversation_starters)}, इस सवाल की complete जानकारी के लिए मैं अभी check कर रही हूँ। थोड़ा wait करो!",
                f"{random.choice(conversation_starters)}, ये बहुत interesting question है! Detail में जानने के लिए support team से भी बात कर सकते हो।",
                f"{random.choice(conversation_starters)}, इसका proper answer देने के लिए मुझे कुछ और details चाहिए। थोड़ा specific पूछोगे?",
            ]
        else:
            fallbacks = [
                f"{random.choice(conversation_starters)} Let me check the details for this question. Give me a moment!",
                f"{random.choice(conversation_starters)} That's a great question! For detailed info, you can also reach out to our support team.",
                f"{random.choice(conversation_starters)} I need a bit more details to give you the perfect answer. Could you be more specific?",
            ]
        
        return random.choice(fallbacks)

    async def _generate_template_response(self, question: str, search_results: List) -> str:
        """Generate natural template response when Gemini is not available"""
        
        import random
        
        # Natural conversation starters - more variety
        natural_starters = [
            "देखिए", "अच्छा सुनिए", "हाँ जी", "बिल्कुल", "सुनो", "ये बात है", 
            "समझिए", "पता है", "चलो बताती हूँ", "ऐसा है", "अरे", "वाकई"
        ]
        
        # Mid-sentence connectors for more natural flow
        connectors = [
            "असल में", "देखिए", "मतलब", "यानी कि", "बस ये है कि", "सीधी बात ये है"
        ]
        
        # Natural endings
        endings = [
            "उम्मीद है समझ आ गया होगा!", "ये रही आपकी जानकारी!", 
            "बस इतनी सी बात है।", "अब clear हो गया न?", "कैसा लगा ये जवाब?"
        ]
        
        # Extract first relevant paragraph
        if search_results:
            first_result = search_results[0].page_content
            # Get first meaningful sentence - improved extraction
            sentences = [s.strip() for s in first_result.split('.') if s.strip()]
            
            if sentences:
                preview = sentences[0]
                # Make sure it's not too long
                if len(preview) > 120:
                    preview = preview[:100] + "..."
            else:
                preview = first_result[:150].strip() + "..."
            
            starter = random.choice(natural_starters)
            connector = random.choice(connectors) if random.random() > 0.5 else ""
            ending = random.choice(endings)
            
            # Create more natural sentence structure
            if connector:
                return f"{starter}, {connector} {preview}। {ending}"
            else:
                return f"{starter}, {preview}। {ending}"
        
        # Natural fallback when no results - more variety
        natural_fallbacks = [
            "हम्म... इसके बारे में अभी मुझे proper जानकारी नहीं है।",
            "ये सवाल interesting है, लेकिन फ़िलहाल मेरे पास इसका answer नहीं है।",
            "सॉरी यार, इसका exact जवाब तो अभी मेरे पास नहीं है।",
            "अरे, ये topic थोड़ा नया है मेरे लिए। कुछ और पूछना है?",
            "उम्म... लगता है इसकी detail मुझसे छूट गई है।"
        ]
        return random.choice(natural_fallbacks)
    
    def _should_route_to_fsm(self, question: str, answer: str) -> bool:
        """Determine if question should be routed to FSM for actions"""
        
        # Direct action request keywords in the question (these need FSM)
        direct_action_keywords = [
            "registration करना चाहता", "register करना चाहता", "sign up करना चाहता",
            "आवेदन करना चाहता", "apply करना चाहता", "नौकरी के लिए आवेदन",
            "phone number दूंगा", "mobile number दूंगा", "register करो"
        ]
        
        question_lower = question.lower()
        
        # Only route to FSM if user explicitly wants to perform an action
        if any(keyword in question_lower for keyword in direct_action_keywords):
            return True
        
        # Check for informational vs action intent
        # If question is asking "how", "what", "when" - it's informational
        informational_words = ["कैसे", "क्या", "कब", "how", "what", "when", "बताओ", "जानकारी"]
        if any(word in question_lower for word in informational_words):
            return False  # Keep in RAG for informational responses
            
        # If answer is explaining a process vs requesting action
        explanation_indicators = ["देखिए", "बस", "आसान है", "process", "step", "पहले", "explanation"]
        if any(indicator in answer.lower() for indicator in explanation_indicators):
            return False  # This is explanatory, not action-requiring
        
        # Only fallback if answer explicitly asks user to register/contact NOW
        immediate_action_requests = [
            "register करें अभी", "contact करें", "call करें", "registration शुरू करें"
        ]
        if any(request in answer.lower() for request in immediate_action_requests):
            return True
        
        return False
    
    def test_rag(self):
        """Test RAG with sample queries"""
        
        test_queries = [
            "SINDH platform क्या है?",
            "registration कैसे करें?",
            "payment कब मिलेगा?",
            "क्या jobs available हैं?",
            "support number क्या है?"
        ]
        
        print("\n🧪 Testing RAG responses...")
        
        for query in test_queries:
            print(f"\n❓ Query: {query}")
            
            # Run async function
            result = asyncio.run(self.answer_question(query))
            
            print(f"💬 Answer: {result['answer']}")
            print(f"🎯 Confidence: {result['confidence']:.2f}")
            print(f"📚 Sources: {result['sources']}")
            print(f"🔄 Should fallback: {result['should_fallback']}")


# Global RAG instance
simple_rag = None

def get_simple_rag():
    """Get singleton RAG instance"""
    global simple_rag
    
    if simple_rag is None:
        simple_rag = SimpleRAG()
    
    return simple_rag


# Integration function for orchestra_agent
async def process_rag_query(question: str, user_id: str = None) -> Dict[str, Any]:
    """
    Process question through RAG system
    
    Usage in orchestra_agent_backup.py:
    
    from simple_rag import process_rag_query
    
    # In your classification handling:
    if classification.get('intent') == 'general_inquiry':
        rag_result = await process_rag_query(user_text, user_id)
        
        if rag_result['confidence'] > 0.5 and not rag_result['should_fallback']:
            # Use RAG response
            await speak_response(rag_result['answer'])
            return
        else:
            # Continue with existing FSM logic
            ...
    """
    
    rag = get_simple_rag()
    return await rag.answer_question(question, user_id)


if __name__ == "__main__":
    # Test the RAG system
    rag = SimpleRAG()
    rag.test_rag()
