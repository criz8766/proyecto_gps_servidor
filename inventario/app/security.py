# inventario/app/security.py (Corregido)

import os
import httpx
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from dotenv import load_dotenv

# Cargar variables de entorno
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
API_AUDIENCE = os.getenv("AUTH0_API_AUDIENCE")
ALGORITHMS = ["RS256"]

reusable_oauth2 = HTTPBearer()
jwks_cache = None

async def get_jwks():
    global jwks_cache
    if AUTH0_DOMAIN is None:
        raise HTTPException(status_code=500, detail="Configuración de Auth0 incompleta.")

    if jwks_cache is None:
        async with httpx.AsyncClient() as client:
            try:
                jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
                response = await client.get(jwks_url)
                response.raise_for_status()
                jwks_cache = response.json()
            except httpx.HTTPStatusError as e:
                raise HTTPException(status_code=500, detail="No se pudieron obtener las claves de Auth0.")
            except Exception as e:
                raise HTTPException(status_code=500, detail="Error interno al obtener claves de firma.")
    return jwks_cache

# --- FUNCIÓN RENOMBRADA ---
async def get_token_payload(token: HTTPAuthorizationCredentials = Security(reusable_oauth2)):
    if AUTH0_DOMAIN is None or API_AUDIENCE is None:
        raise HTTPException(status_code=500, detail="Configuración Auth0 no encontrada en el servidor.")

    if token is None:
        raise HTTPException(status_code=401, detail="Token de autorización no proporcionado.")

    token_value = token.credentials

    try:
        jwks = await get_jwks()
        unverified_header = jwt.get_unverified_header(token_value)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = { "kty": key["kty"], "kid": key["kid"], "use": key["use"], "n": key["n"], "e": key["e"] }
                break

        if rsa_key:
            payload = jwt.decode(
                token_value,
                rsa_key,
                algorithms=ALGORITHMS,
                audience=API_AUDIENCE,
                issuer=f"https://{AUTH0_DOMAIN}/"
            )
            return payload
        else:
            raise HTTPException(status_code=401, detail="Token inválido: clave de firma no encontrada.")

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado.")
    except jwt.JWTClaimsError as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}.")
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno del servidor al validar token.")