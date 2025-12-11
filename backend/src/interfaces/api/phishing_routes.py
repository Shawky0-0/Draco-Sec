from fastapi import APIRouter, HTTPException, Request
from typing import Dict, Any, List
from ...use_cases.phishing_service import phishing_service

router = APIRouter(prefix="/phishing", tags=["phishing"])

@router.get("/stats")
def get_stats() -> Dict[str, Any]:
    return phishing_service.get_stats()

@router.get("/campaigns")
def get_campaigns():
    return phishing_service.get_campaigns()

@router.get("/campaigns/{campaign_id}")
def get_campaign(campaign_id: int):
    return phishing_service.get_campaign(campaign_id)

@router.post("/campaigns")
async def create_campaign(request: Request):
    try:
        data = await request.json()
        return phishing_service.create_campaign(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/campaigns/{campaign_id}")
def delete_campaign(campaign_id: int):
    try:
        return phishing_service.delete_campaign(campaign_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/campaigns/{campaign_id}/complete")
def complete_campaign(campaign_id: int):
    try:
        return phishing_service.complete_campaign(campaign_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/groups")
def get_groups():
    return phishing_service.get_groups()

@router.post("/groups")
async def create_group(request: Request):
    try:
        data = await request.json()
        return phishing_service.create_group(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/groups/{group_id}")
def delete_group(group_id: int):
    try:
        return phishing_service.delete_group(group_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/groups/{group_id}")
async def modify_group(group_id: int, request: Request):
    try:
        data = await request.json()
        return phishing_service.modify_group(group_id, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/templates")
def get_templates():
    return phishing_service.get_templates()

@router.post("/templates")
async def create_template(request: Request):
    try:
        data = await request.json()
        return phishing_service.create_template(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/templates/{template_id}")
async def modify_template(template_id: int, request: Request):
    try:
        data = await request.json()
        return phishing_service.modify_template(template_id, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/templates/{template_id}")
def delete_template(template_id: int):
    try:
        return phishing_service.delete_template(template_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/pages")
def get_pages():
    return phishing_service.get_pages()

@router.post("/pages")
async def create_page(request: Request):
    try:
        data = await request.json()
        return phishing_service.create_page(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/pages/{page_id}")
async def modify_page(page_id: int, request: Request):
    try:
        data = await request.json()
        return phishing_service.modify_page(page_id, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/pages/{page_id}")
def delete_page(page_id: int):
    try:
        return phishing_service.delete_page(page_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/profiles")
def get_profiles():
    return phishing_service.get_sending_profiles()

@router.post("/profiles")
async def create_profile(request: Request):
    try:
        data = await request.json()
        return phishing_service.create_profile(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/profiles/{profile_id}")
async def modify_profile(profile_id: int, request: Request):
    try:
        data = await request.json()
        return phishing_service.modify_profile(profile_id, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/profiles/{profile_id}")
def delete_profile(profile_id: int):
    try:
        return phishing_service.delete_profile(profile_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/import/site")
async def import_site(request: Request):
    try:
        data = await request.json()
        return phishing_service.import_site(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/import/email")
async def import_email(request: Request):
    try:
        data = await request.json()
        return phishing_service.import_email(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/util/send_test_email")
async def send_test_email(request: Request):
    try:
        data = await request.json()
        return phishing_service.send_test_email(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
