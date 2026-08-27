import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

public class VerifyNew {
    public static void main(String[] args) throws Exception {
        String publicKey = "MCowBQYDK2VwAyEAdjfwXXUYRHcCkK6RZTpdWYy4T5UT5YZGkF+SStjgXmc=";
        String license = "bXJpZHVsIHxUUklBTHwyMDI2LTA4LTI3fDIwMjYtMDktMTA.JjsR_uxcqcUFfXuVQDup4FTYRKVE7MVMQoHBw20kTovnqtlMQZdlXWiUfHe0IeMC38oLorFxPaV5SDN7C6zaBA";
        String[] parts = license.split("\\.", 2);
        Signature verifier = Signature.getInstance("Ed25519");
        verifier.initVerify(KeyFactory.getInstance("Ed25519").generatePublic(
                new X509EncodedKeySpec(Base64.getDecoder().decode(publicKey))));
        byte[] payload = Base64.getUrlDecoder().decode(parts[0]);
        verifier.update(payload);
        System.out.println("Signature valid: " + verifier.verify(Base64.getUrlDecoder().decode(parts[1])));
        System.out.println("Payload: " + new String(payload, StandardCharsets.UTF_8));
    }
}
