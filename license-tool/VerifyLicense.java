import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

public class VerifyLicense {
    public static void main(String[] args) throws Exception {
        String publicKey = Files.readString(Path.of("license-public-key.txt")).trim();
        String license = "QWNtZSBSZXRhaWx8VFJJQUx8MjAyNi0wOC0yN3wyMDI2LTA5LTEw._JTr7SAunqsreBEsaRRRRP2bxYMF9M4nji9M0E5KriUiMyRimYwbeMchGqFFgYbIF3oG29_V8lgj1h9a2DW-Cw";
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
