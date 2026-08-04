import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.LocalDate;
import java.util.Base64;

public class LicenseKeyGenerator {

    private static final String PRIVATE_KEY_FILE = "license-private-key.txt";
    private static final String PUBLIC_KEY_FILE = "license-public-key.txt";

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            printUsage();
            return;
        }

        switch (args[0]) {
            case "generate-keypair" -> generateKeyPair();
            case "generate-license" -> generateLicense(args);
            default -> printUsage();
        }
    }

    private static void printUsage() {
        System.out.println("Usage:");
        System.out.println("  java LicenseKeyGenerator generate-keypair");
        System.out.println("  java LicenseKeyGenerator generate-license <customerName> <TRIAL|PERPETUAL> [trialDays]");
    }

    private static void generateKeyPair() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("Ed25519");
        KeyPair pair = kpg.generateKeyPair();

        String privateKeyB64 = Base64.getEncoder().encodeToString(pair.getPrivate().getEncoded());
        String publicKeyB64 = Base64.getEncoder().encodeToString(pair.getPublic().getEncoded());

        Files.writeString(Path.of(PRIVATE_KEY_FILE), privateKeyB64, StandardCharsets.UTF_8);
        Files.writeString(Path.of(PUBLIC_KEY_FILE), publicKeyB64, StandardCharsets.UTF_8);

        System.out.println("Keypair generated.");
        System.out.println("Private key saved to: " + PRIVATE_KEY_FILE + " (KEEP THIS SECRET - never share, never commit it anywhere)");
        System.out.println("Public key saved to: " + PUBLIC_KEY_FILE + " (this one is safe to bake into the backend source)");
        System.out.println();
        System.out.println("Public key:");
        System.out.println(publicKeyB64);
    }

    private static void generateLicense(String[] args) throws Exception {
        if (args.length < 3) {
            printUsage();
            return;
        }

        String customerName = args[1];
        String licenseType = args[2].toUpperCase();

        if (!licenseType.equals("TRIAL") && !licenseType.equals("PERPETUAL")) {
            System.out.println("License type must be TRIAL or PERPETUAL");
            return;
        }

        LocalDate issuedDate = LocalDate.now();
        LocalDate expiryDate = null;

        if (licenseType.equals("TRIAL")) {
            int trialDays = args.length >= 4 ? Integer.parseInt(args[3]) : 14;
            expiryDate = issuedDate.plusDays(trialDays);
        }

        // Pipe-delimited payload: customerName|licenseType|issuedDate|expiryDate
        // (expiryDate is an empty field for PERPETUAL)
        String payload = String.join("|",
                customerName,
                licenseType,
                issuedDate.toString(),
                expiryDate != null ? expiryDate.toString() : ""
        );

        if (!Files.exists(Path.of(PRIVATE_KEY_FILE))) {
            System.out.println("No private key found. Run 'generate-keypair' first.");
            return;
        }

        String privateKeyB64 = Files.readString(Path.of(PRIVATE_KEY_FILE)).trim();
        byte[] privateKeyBytes = Base64.getDecoder().decode(privateKeyB64);

        KeyFactory keyFactory = KeyFactory.getInstance("Ed25519");
        PrivateKey privateKey = keyFactory.generatePrivate(new PKCS8EncodedKeySpec(privateKeyBytes));

        Signature signature = Signature.getInstance("Ed25519");
        signature.initSign(privateKey);
        signature.update(payload.getBytes(StandardCharsets.UTF_8));
        byte[] signatureBytes = signature.sign();

        String payloadB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        String signatureB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);

        String licenseKey = payloadB64 + "." + signatureB64;

        System.out.println("Customer: " + customerName);
        System.out.println("Type: " + licenseType);
        System.out.println("Issued: " + issuedDate);
        System.out.println("Expiry: " + (expiryDate != null ? expiryDate : "never"));
        System.out.println();
        System.out.println("License key (give this to the customer):");
        System.out.println(licenseKey);
    }
}