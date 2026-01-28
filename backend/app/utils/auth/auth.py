from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.utils.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(user_id: int, role_id: int) -> str:
    to_encode = {"sub": str(user_id), "role_id": str(role_id)}
    expire = datetime.now(timezone.utc) + (
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    user_id = payload.get("sub")
    role_id = payload.get("role_id")
    return {"role_id": role_id, "sub": user_id}


def refresh_access_token(token: str, grace_period_days: int = 7) -> str:
    """
    Rafraîchit un token d'accès expiré si dans la période de grâce.

    Args:
        token: Le token JWT expiré
        grace_period_days: Nombre de jours après expiration pendant lesquels le refresh est permis

    Raises:
        ValueError: Si le token est invalide ou expiré depuis trop longtemps
    """
    try:
        # Décoder sans vérifier l'expiration pour examiner le payload
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": False},
        )

        # Vérifier manuellement l'expiration avec grace period
        exp = payload.get("exp")
        if not exp:
            raise ValueError("Token does not contain expiration claim")

        exp_datetime = datetime.fromtimestamp(exp, tz=timezone.utc)
        now = datetime.now(timezone.utc)
        grace_period = timedelta(days=grace_period_days)

        # Vérifier que le token n'est pas expiré depuis plus longtemps que la grace period
        if now > exp_datetime + grace_period:
            raise ValueError("Token expired beyond grace period")

        user_id = payload.get("sub")
        role_id = payload.get("role_id")

        if not user_id or not role_id:
            raise ValueError("Token missing required claims")

        return create_access_token(user_id=int(user_id), role_id=int(role_id))
    except JWTError as e:
        raise ValueError(f"Invalid token: {str(e)}")
