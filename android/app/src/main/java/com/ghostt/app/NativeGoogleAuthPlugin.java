package com.ghostt.app;

import android.os.CancellationSignal;
import android.util.Base64;
import java.security.SecureRandom;
import androidx.annotation.NonNull;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {
    private static final String WEB_CLIENT_ID =
        "804239846700-6o1h8fo0d98l3bk3a1duoabslp9efj82.apps.googleusercontent.com";

    @PluginMethod
    public void signIn(PluginCall call) {
        String nonce = generateNonce();
        GetSignInWithGoogleOption googleOption =
            new GetSignInWithGoogleOption.Builder(WEB_CLIENT_ID)
                .setNonce(nonce)
                .build();
        GetCredentialRequest request = new GetCredentialRequest.Builder()
            .addCredentialOption(googleOption)
            .build();
        CredentialManager credentialManager = CredentialManager.create(getContext());
        credentialManager.getCredentialAsync(
            getActivity(), request, new CancellationSignal(),
            ContextCompat.getMainExecutor(getContext()),
            new androidx.credentials.CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override
                public void onResult(GetCredentialResponse result) {
                    Credential credential = result.getCredential();
                    if (!(credential instanceof CustomCredential) ||
                        !GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                        call.reject("Google returned an unsupported credential.");
                        return;
                    }
                    try {
                        GoogleIdTokenCredential googleCredential =
                            GoogleIdTokenCredential.createFrom(((CustomCredential) credential).getData());
                        JSObject response = new JSObject();
                        response.put("idToken", googleCredential.getIdToken());
                        response.put("nonce", nonce);
                        call.resolve(response);
                    } catch (Exception error) {
                        call.reject("Unable to read the Google credential.", error);
                    }
                }

                @Override
                public void onError(@NonNull GetCredentialException error) {
                    if (error instanceof GetCredentialCancellationException) {
                        call.reject("Google sign-in was cancelled.", "GOOGLE_SIGN_IN_CANCELLED", error);
                    } else {
                        call.reject("Google sign-in failed: " + error.getMessage(), error);
                    }
                }
            }
        );
    }

    private String generateNonce() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.encodeToString(
            randomBytes,
            Base64.NO_WRAP | Base64.URL_SAFE | Base64.NO_PADDING
        );
    }
}