from fastapi import APIRouter
from app.repositories.comment_repository import CommentRepository


router = APIRouter(prefix="/comments", tags=["Comment"])
repo = CommentRepository()


# @router.get(
#     "/",
#     response_model=list[Comment],
#     description="Route disponible pour les rôles: ['admin']",
# )
# def get_all_comments(
#     db: Session = Depends(get_db), current_user=Depends(require_role(["admin"]))
# ):
#     return repo.list(db)


# @router.get(
#     "/{id}",
#     response_model=Comment,
#     description="Route disponible pour les rôles: ['admin']",
# )
# def get_comment_by_id(
#     id: int, db: Session = Depends(get_db), current_user=Depends(require_role(["admin"]))
# ):
#     obj = repo.get_by_id(db, id)
#     if not obj:
#         raise HTTPException(status_code=404, detail="Comment not found")
#     return obj


# @router.post(
#     "/",
#     response_model=Comment,
#     status_code=201,
#     description="Route disponible pour les rôles: ['admin']",
# )
# def create_comment(
#     payload: dict = Body(...),
#     db: Session = Depends(get_db),
#     current_user=Depends(require_role(["User"])),
# ):
#     return repo.save(db, payload)


# @router.put(
#     "/{id}",
#     response_model=Comment,
#     description="Route disponible pour les rôles: ['admin']",
# )
# def update_comment(
#     id: int,
#     payload: dict = Body(...),
#     db: Session = Depends(get_db),
#     current_user=Depends(require_role(["User"])),
# ):
#     obj = repo.save(db, id, payload)
#     if not obj:
#         raise HTTPException(status_code=404, detail="Comment not found")
#     return obj


# @router.delete(
#     "/{id}", status_code=204, description="Route disponible pour les rôles: ['admin']"
# )
# def delete_comment(
#     id: int, db: Session = Depends(get_db), current_user=Depends(require_role(["User"]))
# ):
#     ok = repo.delete(db, id)
#     if not ok:
#         raise HTTPException(status_code=404, detail="Comment not found")
