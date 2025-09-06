"""
Test Script for Humanized RAG Pipeline
====================================

This script comprehensively tests the fixed RAG system to ensure TARA 
responds as a humanized customer care agent.
"""

import asyncio
from simple_rag import SimpleRAG

async def test_humanized_tara():
    """Test TARA's humanized responses across different query types"""
    
    print("🚀 Testing Humanized TARA RAG Pipeline")
    print("=" * 50)
    
    rag = SimpleRAG()
    
    # Test cases covering different scenarios
    test_cases = [
        {
            "category": "🙋‍♀️ Personal Greetings",
            "queries": [
                "तारा, तुम कैसे हो?",
                "Tara, how are you?", 
                "तुम कौन हो?",
                "तुम्हारे बारे में बताओ",
            ]
        },
        {
            "category": "📋 Platform Information", 
            "queries": [
                "SINDH platform क्या है?",
                "registration कैसे करें?",
                "payment कब मिलेगा?",
                "कौन सी jobs मिलती हैं?"
            ]
        },
        {
            "category": "💰 Personal Info Queries",
            "queries": [
                "मेरा balance कितना है?",
                "मेरी profile कैसी है?", 
                "मैंने कितनी jobs की हैं?",
                "मेरा नाम क्या है?"
            ]
        },
        {
            "category": "❓ General Support",
            "queries": [
                "help चाहिए",
                "problem हो रही है", 
                "contact कैसे करें?",
                "app कैसे use करें?"
            ]
        }
    ]
    
    total_tests = 0
    successful_responses = 0
    
    for test_group in test_cases:
        print(f"\n{test_group['category']}")
        print("-" * 30)
        
        for query in test_group['queries']:
            total_tests += 1
            try:
                result = await rag.answer_question(query)
                
                # Analyze response quality
                answer = result['answer']
                confidence = result['confidence']
                should_fallback = result['should_fallback']
                
                # Check if response is humanized
                is_humanized = check_response_quality(answer)
                
                print(f"\n🔸 Query: {query}")
                print(f"🤖 Tara: {answer}")
                print(f"📊 Confidence: {confidence:.2f}")
                print(f"🎯 Humanized: {'✅' if is_humanized else '❌'}")
                print(f"🔄 Fallback: {'Yes' if should_fallback else 'No'}")
                
                if is_humanized and confidence > 0.5:
                    successful_responses += 1
                    
            except Exception as e:
                print(f"❌ Error testing query '{query}': {e}")
    
    # Results summary
    success_rate = (successful_responses / total_tests) * 100 if total_tests > 0 else 0
    
    print("\n" + "=" * 50)
    print("📊 HUMANIZED TARA TEST RESULTS")
    print("=" * 50)
    print(f"Total Tests: {total_tests}")
    print(f"Successful Humanized Responses: {successful_responses}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 EXCELLENT: TARA is responding as a highly humanized customer care agent!")
    elif success_rate >= 60:
        print("👍 GOOD: TARA is mostly humanized, minor improvements needed")
    else:
        print("⚠️ NEEDS IMPROVEMENT: TARA needs more humanization work")
    
    return success_rate

def check_response_quality(answer: str) -> bool:
    """Check if response sounds natural and humanized"""
    
    if not answer or len(answer) < 10:
        return False
    
    # Humanized response indicators
    positive_indicators = [
        # Natural conversation starters
        'अरे', 'यार', 'देखो', 'सुनो', 'हाँ', 'जी', 'वाह', 'अच्छा',
        'hey', 'sure', 'great', 'awesome', 'cool',
        
        # Personal touches
        'मैं', 'तुम', 'आप', 'हम', 'I', 'you', 'we',
        
        # Emotional expressions
        'खुशी', 'मजा', 'बढ़िया', 'perfect', 'amazing', 'love',
        
        # Friendly words
        'दोस्त', 'भाई', 'बहन', 'friend', 'buddy'
    ]
    
    # Robotic/formal indicators (negative)
    negative_indicators = [
        'system', 'database', 'process', 'technical', 'function',
        'सिस्टम', 'डेटाबेस', 'प्रोसेस', 'तकनीकी',
        'I am an AI', 'मैं एक AI हूँ', 'assistant program',
        'according to', 'के अनुसार', 'formally'
    ]
    
    answer_lower = answer.lower()
    
    # Check for positive indicators
    has_positive = any(indicator in answer_lower for indicator in positive_indicators)
    
    # Check for negative indicators
    has_negative = any(indicator in answer_lower for indicator in negative_indicators)
    
    # Response should have positive indicators and avoid negative ones
    return has_positive and not has_negative

async def test_specific_issues():
    """Test specific issues mentioned in the user request"""
    
    print("\n🔍 TESTING SPECIFIC USER ISSUES")
    print("=" * 40)
    
    rag = SimpleRAG()
    
    # Test the specific query from user request
    test_query = "तारा, तुम कैसे हो?"
    
    print(f"🎯 Testing specific query: '{test_query}'")
    
    try:
        result = await rag.answer_question(test_query)
        
        print(f"✅ Query processed successfully!")
        print(f"🤖 Tara's Response: {result['answer']}")
        print(f"📊 Confidence: {result['confidence']}")
        print(f"📚 Sources Found: {len(result.get('sources', []))}")
        print(f"🔄 Should Fallback: {result['should_fallback']}")
        
        # Check if the original error is resolved
        if 'error' not in result:
            print("✅ ERROR RESOLVED: '_is_personal_worker_query' issue fixed!")
        else:
            print(f"❌ ERROR PERSISTS: {result['error']}")
            
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

if __name__ == "__main__":
    async def main():
        # Test specific issues first
        specific_test_passed = await test_specific_issues()
        
        if specific_test_passed:
            print("\n" + "="*60)
            # Run comprehensive humanization tests
            success_rate = await test_humanized_tara()
            
            if success_rate >= 70:
                print("\n🎉 SUCCESS: RAG pipeline issues resolved!")
                print("🤖 TARA is now functioning as a humanized customer care agent!")
            else:
                print("\n⚠️ PARTIAL SUCCESS: Basic issues resolved, but needs more humanization.")
        else:
            print("\n❌ FAILED: Core issues still exist")
    
    asyncio.run(main())
