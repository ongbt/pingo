import json
import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

def generate_convex_keys():
    # 1. Generate RSA key pair (2048 bits is standard for RS256)
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )

    # 2. Get the Private Key in PEM format (PKCS#8)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')

    # 3. Get Public Key components for JWKS
    public_key = private_key.public_key()
    numbers = public_key.public_numbers()

    def int_to_b64url(n):
        # Convert int to bytes
        b = n.to_bytes((n.bit_length() + 7) // 8, byteorder='big')
        # Base64url encode and strip padding
        return base64.urlsafe_b64encode(b).decode('utf-8').rstrip('=')

    jwks = {
        "keys": [
            {
                "kty": "RSA",
                "n": int_to_b64url(numbers.n),
                "e": int_to_b64url(numbers.e),
                "use": "sig",
                "alg": "RS256",
                "kid": "default"
            }
        ]
    }

    print("--- JWT_PRIVATE_KEY ---")
    print(private_pem)
    print("\n--- JWKS ---")
    print(json.dumps(jwks))

if __name__ == "__main__":
    print("Usage: python generate_keys.py > keys.txt")
    generate_convex_keys()
