# ===== CAPACITOR CORE RULES =====
# Preserve Capacitor's core classes and JavaScript bridge

-keep class com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses

# Keep Capacitor plugin annotations
-keep @com.getcapacitor.annotation.CapacitorPlugin class * {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.PluginMethod public <methods>;
}

# ===== JAVASCRIPT INTERFACE RULES =====
# Critical for WebView ↔ Native communication

-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
}

# ===== ANDROIDX LIBRARY RULES =====
# Required by Capacitor and plugins

-keep class androidx.appcompat.** { *; }
-keep interface androidx.appcompat.** { *; }
-keep class androidx.coordinatorlayout.** { *; }
-keep class androidx.webkit.** { *; }
-keep class androidx.core.splashscreen.** { *; }

-dontwarn androidx.**

# ===== CAPACITOR PLUGINS RULES =====
# Preserve all installed Capacitor plugins

# Camera Plugin
-keep class com.capacitorjs.plugins.camera.** { *; }
-keepclassmembers class com.capacitorjs.plugins.camera.** { *; }

# Geolocation Plugin
-keep class com.capacitorjs.plugins.geolocation.** { *; }
-keepclassmembers class com.capacitorjs.plugins.geolocation.** { *; }

# Network Plugin
-keep class com.capacitorjs.plugins.network.** { *; }
-keepclassmembers class com.capacitorjs.plugins.network.** { *; }

# StatusBar Plugin
-keep class com.capacitorjs.plugins.statusbar.** { *; }
-keepclassmembers class com.capacitorjs.plugins.statusbar.** { *; }

# SplashScreen Plugin
-keep class com.capacitorjs.plugins.splashscreen.** { *; }
-keepclassmembers class com.capacitorjs.plugins.splashscreen.** { *; }

# Keyboard Plugin
-keep class com.capacitorjs.plugins.keyboard.** { *; }
-keepclassmembers class com.capacitorjs.plugins.keyboard.** { *; }

# ===== GSON RULES =====
# Required for JSON serialization between JavaScript and Java

-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Prevent obfuscation of generic types for reflection
-keepattributes Signature
-keepattributes *Annotation*

# Keep model classes used for JSON serialization
-keepclassmembers,allowobfuscation class * {
  @com.google.gson.annotations.SerializedName <fields>;
}

# ===== DEBUGGING AND STACK TRACES =====
# Preserve source file names and line numbers for readable stack traces

-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep exception classes
-keep public class * extends java.lang.Exception
-keep class * extends java.lang.Throwable { *; }

# ===== NATIVE METHODS =====
# Preserve JNI methods

-keepclasseswithmembernames class * {
    native <methods>;
}

# ===== REFLECTION RULES =====
# Preserve classes loaded via reflection

-keepclassmembers class * {
    public <init>(...);
}

# ===== OPTIMIZATION SETTINGS =====
# Configure ProGuard optimization level

-optimizationpasses 5
-verbose

# Optimization filters
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*

# ===== WARNING SUPPRESSIONS =====
# Suppress warnings for optional dependencies

-dontwarn com.google.android.gms.**
-dontwarn com.google.firebase.**
-dontwarn okhttp3.**
-dontwarn okio.**

# ===== CORDOVA COMPATIBILITY =====
# Required for Capacitor's Cordova plugin compatibility layer

-keep class org.apache.cordova.** { *; }
-keepclassmembers class org.apache.cordova.** { *; }

# ===== WEBVIEW RULES =====
# Additional WebView-specific rules

-keepclassmembers class * extends android.webkit.WebView {
    public *;
}

-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void openFileChooser(android.webkit.ValueCallback, java.lang.String);
    public void openFileChooser(android.webkit.ValueCallback, java.lang.String, java.lang.String);
    public boolean onShowFileChooser(android.webkit.WebView, android.webkit.ValueCallback, android.webkit.WebChromeClient$FileChooserParams);
}

# ===== CUSTOM RULES FOR YOUR APP =====
# Add app-specific rules below this line

# Keep your custom model classes (if any)
# -keep class com.sindh.jobs.models.** { *; }

# Keep custom JavaScript interfaces (if any)
# -keep class com.sindh.jobs.interfaces.** { *; }
