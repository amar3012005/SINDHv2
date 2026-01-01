package com.sindh.jobs;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Register plugin BEFORE super.onCreate
    registerPlugin(FirebaseAuthenticationPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
