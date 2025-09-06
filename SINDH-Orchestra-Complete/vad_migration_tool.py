"""
VAD Migration Script for Orchestra Agent
========================================

This script applies VAD (Voice Activity Detection) to replace spacebar-triggered
recording in your existing orchestra agent files.
"""

import os
import re
import asyncio
from typing import List, Tuple

class VADMigration:
    """Class to handle migration from spacebar to VAD"""
    
    def __init__(self):
        self.backup_suffix = ".spacebar_backup"
        self.modified_files = []
    
    def apply_vad_migration(self, target_files: List[str] = None):
        """Apply VAD migration to specified files"""
        
        if target_files is None:
            # Default files to migrate
            target_files = [
                "orchestra_agent_past.py",
                "orchestra_agent_backup.py"
            ]
        
        print("🔄 Starting VAD Migration")
        print("=" * 30)
        
        for file_path in target_files:
            if os.path.exists(file_path):
                print(f"\\n📝 Processing {file_path}...")
                if self.migrate_file(file_path):
                    self.modified_files.append(file_path)
                    print(f"✅ {file_path} migrated successfully")
                else:
                    print(f"❌ Failed to migrate {file_path}")
            else:
                print(f"⚠️ File not found: {file_path}")
        
        if self.modified_files:
            print(f"\\n🎉 Migration complete! Modified {len(self.modified_files)} files")
            print("\\n📋 Summary of changes:")
            for file in self.modified_files:
                print(f"   ✓ {file}")
            
            print("\\n💡 Next steps:")
            print("   1. Test the VAD system: python orchestra_vad_integration.py")
            print("   2. Run your modified orchestra agent")
            print("   3. Enjoy natural conversation with TARA!")
        else:
            print("\\n⚠️ No files were modified")
    
    def migrate_file(self, file_path: str) -> bool:
        """Migrate a single file to use VAD"""
        try:
            # Read the original file
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            # Create backup
            backup_path = file_path + self.backup_suffix
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(original_content)
            print(f"   📋 Backup created: {backup_path}")
            
            # Apply modifications
            modified_content = self.apply_vad_modifications(original_content)
            
            # Write modified file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(modified_content)
            
            return True
            
        except Exception as e:
            print(f"   ❌ Error migrating {file_path}: {e}")
            return False
    
    def apply_vad_modifications(self, content: str) -> str:
        """Apply VAD-specific modifications to file content"""
        
        # 1. Add VAD imports at the top
        import_pattern = r'(import.*?)(\n\ndef|class|async def)'
        vad_imports = """
# VAD Integration - Natural Voice Activity Detection
import asyncio
from orchestra_vad_integration import vad_capture_audio, start_vad_conversation

"""
        
        # Add imports after existing imports
        if 'orchestra_vad_integration' not in content:
            content = re.sub(import_pattern, f'\\1{vad_imports}\\2', content, flags=re.DOTALL)
        
        # 2. Replace spacebar capture function
        spacebar_function_pattern = r'def capture_spacebar_audio.*?(?=def|class|$)'
        vad_replacement = '''async def capture_vad_audio() -> Optional[str]:
    """VAD-based audio capture - replaces spacebar functionality"""
    return await vad_capture_audio()
'''
        content = re.sub(spacebar_function_pattern, vad_replacement, content, flags=re.DOTALL)
        
        # 3. Replace spacebar calls
        # Replace direct function calls
        content = re.sub(r'capture_spacebar_audio\\(\\)', 'await capture_vad_audio()', content)
        content = re.sub(r'wav_path = capture_spacebar_audio\\(\\)', 'transcript = await capture_vad_audio()', content)
        
        # 4. Replace print statements about spacebar
        content = re.sub(r'print\\(["\'].*Hold SPACE.*?["\']\\)', 
                        'print("👂 Listening for your voice... (speak naturally)")', content)
        content = re.sub(r'print\\(["\'].*SPACE.*record.*?["\']\\)', 
                        'print("🗣️ VAD is listening - just speak naturally")', content)
        
        # 5. Update main conversation loops to be async
        # Make main function async if it contains VAD calls
        if 'await capture_vad_audio()' in content:
            # Find main function and make it async
            main_pattern = r'def main\\(\\):'
            content = re.sub(main_pattern, 'async def main():', content)
            
            # Add asyncio.run() for main execution
            if 'if __name__ == "__main__":' in content:
                content = re.sub(r'(if __name__ == "__main__":\\s+)(main\\(\\))', 
                                '\\1asyncio.run(\\2)', content)
        
        # 6. Replace conversation loops with VAD conversation
        conversation_loop_pattern = r'while True:\\s*wav_path = capture_spacebar_audio\\(\\).*?(?=\\n\\n|\\ndef|\\nclass|$)'
        vad_conversation = '''# Start natural VAD conversation mode
await start_vad_conversation()'''
        
        content = re.sub(conversation_loop_pattern, vad_conversation, content, flags=re.DOTALL)
        
        # 7. Handle async context for existing STT calls
        # If we have VAD calls, ensure proper async handling
        if 'await capture_vad_audio()' in content:
            # Add proper error handling
            error_handling = '''
    except KeyboardInterrupt:
        print("\\n🛑 VAD conversation ended by user")
    except Exception as e:
        print(f"❌ VAD error: {e}")'''
            
            # Add to main function if not present
            if 'KeyboardInterrupt' not in content and 'async def main' in content:
                content = re.sub(r'(async def main\\(\\):.*?)(\\n\\nif __name__)', 
                                f'\\1{error_handling}\\2', content, flags=re.DOTALL)
        
        return content
    
    def create_vad_startup_script(self):
        """Create a startup script for VAD-enabled orchestra agent"""
        
        startup_script = '''#!/usr/bin/env python3
"""
VAD-Enabled Orchestra Agent Startup
==================================

Natural conversation with TARA using Voice Activity Detection.
No spacebar needed - just speak naturally!
"""

import asyncio
from orchestra_vad_integration import start_vad_conversation

async def main():
    """Start TARA with natural VAD conversation"""
    print("🎙️ Starting TARA with Natural Voice Detection")
    print("=" * 50)
    print()
    print("💬 TARA will listen naturally - no spacebar needed!")
    print("🗣️ Just speak when you want to interact")
    print("👂 TARA will detect your voice automatically")
    print("🛑 Press Ctrl+C to exit")
    print()
    
    try:
        await start_vad_conversation()
    except KeyboardInterrupt:
        print("\\n👋 Goodbye!")

if __name__ == "__main__":
    asyncio.run(main())
'''
        
        with open("start_vad_tara.py", 'w', encoding='utf-8') as f:
            f.write(startup_script)
        
        print("✅ Created VAD startup script: start_vad_tara.py")
    
    def show_migration_summary(self):
        """Show summary of what the migration does"""
        
        summary = """
🔄 VAD MIGRATION SUMMARY
========================

WHAT THIS MIGRATION DOES:
🔹 Replaces spacebar-triggered recording with natural voice detection
🔹 Adds VAD imports to your orchestra agent files  
🔹 Converts capture_spacebar_audio() → capture_vad_audio()
🔹 Makes functions async where needed
🔹 Updates conversation loops to use continuous VAD
🔹 Creates backups of original files
🔹 Generates a new VAD-enabled startup script

BENEFITS:
✅ Natural conversation flow - no button pressing
✅ Automatic speech start/end detection
✅ Better user experience
✅ Hands-free interaction
✅ Configurable sensitivity settings
✅ Works with existing TARA pipeline

FILES THAT WILL BE MODIFIED:
📝 orchestra_agent_past.py → orchestra_agent_past.py.spacebar_backup
📝 orchestra_agent_backup.py → orchestra_agent_backup.py.spacebar_backup

NEW FILES CREATED:
🆕 start_vad_tara.py (New VAD-enabled startup script)

TESTING:
🧪 python orchestra_vad_integration.py (Test VAD system)
🚀 python start_vad_tara.py (Start VAD-enabled TARA)
"""
        return summary

def main():
    """Main migration function"""
    print("🎙️ VAD Migration Tool for Orchestra Agent")
    print("=" * 45)
    
    migration = VADMigration()
    
    print(migration.show_migration_summary())
    
    confirm = input("\\n❓ Do you want to proceed with VAD migration? (y/n): ").strip().lower()
    
    if confirm == 'y':
        print("\\n🚀 Starting migration...")
        
        # Apply migration
        migration.apply_vad_migration()
        
        # Create startup script
        migration.create_vad_startup_script()
        
        print("\\n🎉 VAD Migration Complete!")
        print("\\n🧪 To test: python orchestra_vad_integration.py")
        print("🚀 To start TARA with VAD: python start_vad_tara.py")
        
    else:
        print("\\n❌ Migration cancelled")

if __name__ == "__main__":
    main()
