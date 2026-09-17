package com.blendjam.label.plugins;

import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

@CapacitorPlugin(name = "PdfOpener")
public class PdfOpenerPlugin extends Plugin {

    @PluginMethod
    public void open(PluginCall call) {
        String uriString = call.getString("uri");

        if (uriString == null) {
            call.reject("PDF URI is required");
            return;
        }

        try {
            // 1. Clean the string path and convert it to a physical file reference
            Uri rawUri = Uri.parse(uriString);
            File file = new File(rawUri.getPath());

            if (!file.exists()) {
                call.reject("File does not exist at path: " + rawUri.getPath());
                return;
            }

            // 2. Safely translate file:// to content:// via FileProvider
            String authority = getContext().getPackageName() + ".fileprovider";
            Uri contentUri = FileProvider.getUriForFile(getContext(), authority, file);

            // 3. Build the intent using the newly secure signature
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(contentUri, "application/pdf");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Intent chooserIntent = Intent.createChooser(intent, "Open PDF");
            chooserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            getActivity().startActivity(chooserIntent);

            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open the PDF layout", e.getMessage(), e);
        }
    }
}
