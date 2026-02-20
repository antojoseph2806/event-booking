import jwt
import os
from dotenv import load_dotenv

load_dotenv()

# Test token decoding
test_token = input("Paste your access token here: ")

jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
print(f"\nJWT Secret (first 20 chars): {jwt_secret[:20] if jwt_secret else 'None'}...")

try:
    # Try to decode without verification first to see the payload
    unverified = jwt.decode(test_token, options={"verify_signature": False})
    print("\nUnverified payload:")
    print(f"  User ID (sub): {unverified.get('sub')}")
    print(f"  Email: {unverified.get('email')}")
    print(f"  Role: {unverified.get('role')}")
    print(f"  Issued at: {unverified.get('iat')}")
    print(f"  Expires at: {unverified.get('exp')}")
    
    # Check the header
    header = jwt.get_unverified_header(test_token)
    print(f"\nToken header:")
    print(f"  Algorithm: {header.get('alg')}")
    print(f"  Type: {header.get('typ')}")
    
    # Try to verify with HS256
    print("\nAttempting to verify with HS256...")
    verified = jwt.decode(
        test_token,
        jwt_secret,
        algorithms=["HS256"],
        audience="authenticated",
        options={"verify_exp": True}
    )
    print("✓ Token verified successfully with HS256!")
    print(f"  User ID: {verified.get('sub')}")
    
except jwt.ExpiredSignatureError:
    print("✗ Token has expired")
except jwt.InvalidTokenError as e:
    print(f"✗ Invalid token: {e}")
except Exception as e:
    print(f"✗ Error: {e}")
