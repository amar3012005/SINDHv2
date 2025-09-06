"""
Enhanced RAG Pipeline for Personal Information Routes
===================================================

This module integrates MongoDB worker data with RAG responses for personal information queries
based on the workerRoutes.js API endpoints.
"""

import asyncio
import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime
from bson import ObjectId
import pymongo

class PersonalInfoRAGProcessor:
    """Enhanced RAG processor for personal worker information"""
    
    def __init__(self, db_connection=None):
        self.db = db_connection
        self.worker_profiles_cache = {}
    
    async def extract_comprehensive_worker_profile(self, worker_phone: str) -> Optional[Dict]:
        """Extract comprehensive worker profile from MongoDB matching workerRoutes.js structure"""
        try:
            if self.db is None:
                print("❌ No database connection available")
                return None
            
            # Find worker by phone (matching workerRoutes.js login logic)
            workers_collection = self.db.workers
            worker = workers_collection.find_one({"phone": worker_phone})
            
            if not worker:
                print(f"❌ Worker not found with phone: {worker_phone}")
                return None
            
            # Get job applications for work history (matching profile route)
            job_applications = list(self.db.jobapplications.find(
                {"worker": worker["_id"]}
            ).sort("updatedAt", -1))
            
            # Separate current and past jobs
            current_jobs = [app for app in job_applications if app.get("status") in ["pending", "accepted"]]
            completed_jobs = [app for app in job_applications if app.get("status") == "completed"]
            
            # Calculate financial data (matching wallet route)
            total_earned = sum(
                app.get("paymentAmount", 0) or 0 
                for app in job_applications 
                if app.get("status") == "completed" and app.get("paymentStatus") == "paid"
            )
            
            withdrawals = worker.get("withdrawals", [])
            total_withdrawn = sum(w.get("amount", 0) for w in withdrawals)
            current_balance = total_earned - total_withdrawn
            
            # Enhanced worker profile with all route data
            enhanced_profile = {
                # Basic Info (from register route)
                "name": worker.get("name", "Unknown"),
                "phone": worker.get("phone", ""),
                "email": worker.get("email", ""),
                "age": worker.get("age", 0),
                "gender": worker.get("gender", ""),
                "aadharNumber": worker.get("aadharNumber", ""),
                
                # Location Info
                "location": worker.get("location", {}),
                "workRadius": worker.get("workRadius", 0),
                
                # Skills and Work
                "skills": worker.get("skills", []),
                "primarySkill": worker.get("skills", [""])[0] if worker.get("skills") else "",
                "experience": worker.get("experience", ""),
                "preferredCategory": worker.get("preferredCategory", ""),
                "expectedSalary": worker.get("expectedSalary", ""),
                "preferredWorkType": worker.get("preferredWorkType", ""),
                "availability": worker.get("availability", ""),
                "languages": worker.get("languages", []),
                "bio": worker.get("bio", ""),
                
                # Performance Metrics
                "shaktiScore": worker.get("shaktiScore", 0),
                "rating": worker.get("rating", {}).get("average", 0),
                "profileCompletionPercentage": worker.get("profileCompletionPercentage", 0),
                "verificationStatus": worker.get("verificationStatus", ""),
                
                # Financial Data (from balance/wallet routes)
                "balance": current_balance,
                "totalEarned": total_earned,
                "totalWithdrawn": total_withdrawn,
                "earnings": worker.get("earnings", []),
                "withdrawals": withdrawals,
                
                # Job History (from profile route)
                "currentJobs": len(current_jobs),
                "completedJobs": len(completed_jobs),
                "activeJobs": worker.get("activeJobs", 0),
                "jobHistory": {
                    "current": current_jobs,
                    "completed": completed_jobs
                },
                
                # Registration & Activity
                "registrationDate": worker.get("registrationDate", ""),
                "lastLogin": worker.get("lastLogin", ""),
                "isAvailable": worker.get("isAvailable", False),
                "isLoggedIn": worker.get("isLoggedIn", 0),
                
                # Additional Info
                "bankDetails": worker.get("bankDetails", {}),
                "emergencyContact": worker.get("emergencyContact", {}),
                "documents": worker.get("documents", []),
                "workHistory": worker.get("workHistory", []),
                "profilePicture": worker.get("profilePicture", ""),
                
                # Notifications
                "emailNotifications": worker.get("emailNotifications", True),
                "smsNotifications": worker.get("smsNotifications", True),
            }
            
            print(f"✅ Enhanced profile extracted for: {enhanced_profile['name']} ({worker_phone})")
            return enhanced_profile
            
        except Exception as e:
            print(f"❌ Error extracting worker profile: {e}")
            return None
    
    def create_enhanced_rag_document(self, worker_profile: Dict) -> str:
        """Create comprehensive RAG document with all personal information categories"""
        
        # Format skills list
        skills_list = ', '.join(worker_profile.get('skills', [])) if worker_profile.get('skills') else 'उपलब्ध नहीं'
        primary_skill = worker_profile.get('primarySkill', 'उपलब्ध नहीं')
        
        # Format languages
        languages_list = ', '.join(worker_profile.get('languages', [])) if worker_profile.get('languages') else 'उपलब्ध नहीं'
        
        # Format location
        location = worker_profile.get('location', {})
        full_address = f"{location.get('village', '')}, {location.get('district', '')}, {location.get('state', '')}, {location.get('pincode', '')}".strip(', ')
        
        # Format bank details
        bank_details = worker_profile.get('bankDetails', {})
        bank_info = f"{bank_details.get('bankName', 'उपलब्ध नहीं')} - {bank_details.get('accountNumber', 'उपलब्ध नहीं')}"
        
        # Format emergency contact
        emergency = worker_profile.get('emergencyContact', {})
        emergency_info = f"{emergency.get('name', 'उपलब्ध नहीं')} ({emergency.get('relation', '')}) - {emergency.get('phone', 'उपलब्ध नहीं')}"
        
        # Format availability
        availability_status = "उपलब्ध" if worker_profile.get('isAvailable') else "व्यस्त"
        login_status = "ऑनलाइन" if worker_profile.get('isLoggedIn') else "ऑफलाइन"
        
        profile_doc = f"""
========================================
वर्कर पूर्ण प्रोफाइल - {worker_profile.get('name', 'अज्ञात')}
========================================

🔷 व्यक्तिगत जानकारी:
--------------------
• नाम: {worker_profile.get('name', 'उपलब्ध नहीं')}
• फोन नंबर: {worker_profile.get('phone', 'उपलब्ध नहीं')}
• ईमेल: {worker_profile.get('email', 'उपलब्ध नहीं')}
• उम्र: {worker_profile.get('age', 'उपलब्ध नहीं')} साल
• लिंग: {worker_profile.get('gender', 'उपलब्ध नहीं')}
• आधार नंबर: {worker_profile.get('aadharNumber', 'उपलब्ध नहीं')}

🔷 पता और स्थान:
--------------
• गांव/शहर: {location.get('village', 'उपलब्ध नहीं')}
• जिला: {location.get('district', 'उपलब्ध नहीं')}
• राज्य: {location.get('state', 'उपलब्ध नहीं')}
• पिन कोड: {location.get('pincode', 'उपलब्ध नहीं')}
• पूरा पता: {full_address or 'उपलब्ध नहीं'}
• काम का दायरा: {worker_profile.get('workRadius', 'उपलब्ध नहीं')} किमी

🔷 कौशल और काम:
--------------
• मुख्य स्किल: {primary_skill}
• सभी स्किल: {skills_list}
• अनुभव: {worker_profile.get('experience', 'उपलब्ध नहीं')}
• पसंदीदा श्रेणी: {worker_profile.get('preferredCategory', 'उपलब्ध नहीं')}
• अपेक्षित वेतन: {worker_profile.get('expectedSalary', 'उपलब्ध नहीं')}
• काम का प्रकार: {worker_profile.get('preferredWorkType', 'उपलब्ध नहीं')}
• उपलब्धता: {worker_profile.get('availability', 'उपलब्ध नहीं')}
• भाषाएं: {languages_list}
• बायो: {worker_profile.get('bio', 'उपलब्ध नहीं')}

🔷 वित्तीय जानकारी:
-----------------
• वर्तमान बैलेंस: ₹{worker_profile.get('balance', 0)}
• कुल कमाई: ₹{worker_profile.get('totalEarned', 0)}
• कुल निकासी: ₹{worker_profile.get('totalWithdrawn', 0)}
• बैंक विवरण: {bank_info}
• IFSC कोड: {bank_details.get('ifscCode', 'उपलब्ध नहीं')}
• खाता धारक: {bank_details.get('accountHolderName', 'उपलब्ध नहीं')}

🔷 प्रदर्शन मेट्रिक्स:
------------------
• शक्ति स्कोर: {worker_profile.get('shaktiScore', 'उपलब्ध नहीं')}/100
• रेटिंग: {worker_profile.get('rating', 'उपलब्ध नहीं')} स्टार
• प्रोफाइल पूर्णता: {worker_profile.get('profileCompletionPercentage', 'उपलब्ध नहीं')}%
• सत्यापन स्थिति: {worker_profile.get('verificationStatus', 'उपलब्ध नहीं')}

🔷 काम का इतिहास:
----------------
• वर्तमान नौकरियां: {worker_profile.get('currentJobs', 0)}
• पूरी की गई नौकरियां: {worker_profile.get('completedJobs', 0)}
• सक्रिय नौकरियां: {worker_profile.get('activeJobs', 0)}

🔷 पंजीकरण और गतिविधि:
----------------------
• पंजीकरण तारीख: {worker_profile.get('registrationDate', 'उपलब्ध नहीं')}
• अंतिम लॉगिन: {worker_profile.get('lastLogin', 'उपलब्ध नहीं')}
• उपलब्धता स्थिति: {availability_status}
• लॉगिन स्थिति: {login_status}

🔷 संपर्क जानकारी:
-----------------
• आपातकालीन संपर्क: {emergency_info}

🔷 सेटिंग्स:
-----------
• ईमेल नोटिफिकेशन: {"चालू" if worker_profile.get('emailNotifications') else "बंद"}
• SMS नोटिफिकेशन: {"चालू" if worker_profile.get('smsNotifications') else "बंद"}

========================================
व्यक्तिगत प्रश्न निर्देश:
========================================
यह प्रोफाइल व्यक्तिगत प्रश्नों के उत्तर देने के लिए है। जब कोई व्यक्तिगत जानकारी पूछे तो:
- इस डेटा का उपयोग करके मानवीय और व्यक्तिगत उत्तर दें
- नाम के साथ संबोधन करें ({worker_profile.get('name', 'जी')})
- सटीक जानकारी प्रदान करें
- यदि कोई जानकारी उपलब्ध नहीं है तो सही तरीके से बताएं

उदाहरण प्रश्न और उत्तर:
- प्रश्न: "मेरी उम्र क्या है?" → उत्तर: "{worker_profile.get('name', 'आप')} जी, आपकी उम्र {worker_profile.get('age', 'उपलब्ध नहीं')} साल है।"
- प्रश्न: "मेरा बैलेंस कितना है?" → उत्तर: "{worker_profile.get('name', 'आप')} जी, आपका बैलेंस ₹{worker_profile.get('balance', 0)} है।"
- प्रश्न: "मैंने कितनी नौकरियां पूरी की हैं?" → उत्तर: "{worker_profile.get('name', 'आप')} जी, आपने {worker_profile.get('completedJobs', 0)} नौकरियां पूरी की हैं।"
"""
        
        return profile_doc
    
    async def store_enhanced_profile_in_rag(self, worker_phone: str, rag_system) -> bool:
        """Store enhanced worker profile in RAG with comprehensive data"""
        try:
            # Extract comprehensive profile
            worker_profile = await self.extract_comprehensive_worker_profile(worker_phone)
            if not worker_profile:
                return False
            
            # Create enhanced RAG document
            profile_doc = self.create_enhanced_rag_document(worker_profile)
            
            # Store in knowledge base
            profile_filename = f"enhanced_worker_profile_{worker_phone}.md"
            profile_path = os.path.join("knowledge_base", profile_filename)
            
            os.makedirs("knowledge_base", exist_ok=True)
            
            with open(profile_path, 'w', encoding='utf-8') as f:
                f.write(profile_doc)
            
            print(f"✅ Enhanced worker profile stored: {profile_filename}")
            print(f"📊 Profile includes: Personal info, Financial data, Job history, Performance metrics")
            
            # Cache the profile
            self.worker_profiles_cache[worker_phone] = worker_profile
            
            # Refresh RAG system
            try:
                if hasattr(rag_system, 'refresh_documents'):
                    rag_system.refresh_documents()
                elif hasattr(rag_system, '_initialize'):
                    rag_system._initialize()
            except Exception as refresh_error:
                print(f"⚠️ RAG refresh warning: {refresh_error}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error storing enhanced profile: {e}")
            return False
    
    def get_personal_info_routes_mapping(self) -> Dict[str, List[str]]:
        """Map personal information query types to relevant data fields"""
        return {
            "basic_info": [
                "name", "phone", "email", "age", "gender", "aadharNumber"
            ],
            "location_info": [
                "location", "workRadius", "village", "district", "state", "pincode", "address"
            ],
            "skills_work": [
                "skills", "primarySkill", "experience", "preferredCategory", 
                "expectedSalary", "preferredWorkType", "availability", "languages", "bio"
            ],
            "financial_data": [
                "balance", "totalEarned", "totalWithdrawn", "earnings", 
                "withdrawals", "bankDetails"
            ],
            "performance": [
                "shaktiScore", "rating", "profileCompletionPercentage", 
                "verificationStatus"
            ],
            "job_history": [
                "currentJobs", "completedJobs", "activeJobs", "jobHistory"
            ],
            "activity_status": [
                "registrationDate", "lastLogin", "isAvailable", "isLoggedIn"
            ],
            "contact_emergency": [
                "emergencyContact"
            ],
            "preferences": [
                "emailNotifications", "smsNotifications"
            ]
        }
    
    def classify_personal_query_type(self, query: str) -> str:
        """Classify the type of personal information being requested"""
        query_lower = query.lower()
        
        # Financial queries
        if any(term in query_lower for term in ['बैलेंस', 'पैसे', 'कमाई', 'वेतन', 'निकासी', 'खाता', 'balance', 'money']):
            return "financial_data"
        
        # Job history queries  
        if any(term in query_lower for term in ['नौकरी', 'काम', 'job', 'work', 'completed', 'पूरी']):
            return "job_history"
        
        # Skills and work queries
        if any(term in query_lower for term in ['स्किल', 'कौशल', 'अनुभव', 'skill', 'experience', 'category']):
            return "skills_work"
        
        # Location queries
        if any(term in query_lower for term in ['पता', 'गांव', 'जिला', 'राज्य', 'कहां', 'address', 'location']):
            return "location_info"
        
        # Performance queries
        if any(term in query_lower for term in ['स्कोर', 'रेटिंग', 'score', 'rating', 'performance']):
            return "performance"
        
        # Basic info (default)
        return "basic_info"

# Global instance
personal_rag_processor = None

def get_personal_rag_processor(db_connection=None):
    """Get or create PersonalInfoRAGProcessor instance"""
    global personal_rag_processor
    if personal_rag_processor is None:
        personal_rag_processor = PersonalInfoRAGProcessor(db_connection)
    return personal_rag_processor
