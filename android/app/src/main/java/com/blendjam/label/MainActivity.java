package com.blendjam.label;

import android.os.Bundle;
import com.blendjam.label.plugins.PdfOpenerPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PdfOpenerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
