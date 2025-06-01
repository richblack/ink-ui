from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field # Ensure Field is imported if used
from typing import List, Any, Optional, Dict

# --- Pydantic Models ---
class ViewConfig(BaseModel):
    id: str
    type: str
    content: Optional[Any] = None
    # Potentially add 'data_source_webhook' if a view directly calls a webhook
    # data_source_webhook: Optional[str] = None

class PaneConfig(BaseModel):
    id: str
    size: float
    view: Optional[ViewConfig] = None

class LayoutConfig(BaseModel):
    id: str
    direction: str # 'horizontal' | 'vertical'
    panes: List[PaneConfig]

class ModuleConfig(BaseModel):
    id: str # e.g., 'diary_module'
    name: str # User-friendly name for the menu, e.g., "Daily Diary"
    layout_id: str # ID of a LayoutConfig stored in layouts/
    # OR embed the layout directly:
    # layout: LayoutConfig
    # For simplicity with RFP's file structure (modules/, layouts/), referencing by ID seems cleaner.
    # We can resolve the layout when the module is loaded by the client or a specific module endpoint.

    # Placeholder for backend webhook API associated with the module as a whole.
    # Specific views within the module's layout might also have their own data sources.
    # backend_webhook_url: Optional[str] = None

    # Additional metadata
    icon: Optional[str] = None # e.g., for display in the menu
    description: Optional[str] = None

# Import YAML loader functions
from app.io.yaml_loader import (
    save_yaml,
    load_yaml,
    load_all_yaml,
    delete_yaml,
    clear_all_yaml_data as clear_yaml_type
)

app = FastAPI()

# --- Layout API Endpoints ---
@app.post("/api/layout", response_model=LayoutConfig, status_code=201)
async def create_layout(layout: LayoutConfig):
    if load_yaml('layouts', layout.id, LayoutConfig) is not None:
        raise HTTPException(status_code=400, detail=f"Layout with ID '{layout.id}' already exists.")
    save_yaml('layouts', layout.id, layout)
    return layout

@app.get("/api/layout/{layout_id}", response_model=LayoutConfig)
async def get_layout(layout_id: str):
    layout = load_yaml('layouts', layout_id, LayoutConfig)
    if layout is None:
        raise HTTPException(status_code=404, detail=f"Layout with ID '{layout_id}' not found.")
    return layout

@app.get("/api/layouts", response_model=List[LayoutConfig])
async def get_all_layouts():
    return load_all_yaml('layouts', LayoutConfig)

@app.delete("/api/layout/{layout_id}", status_code=204)
async def remove_layout(layout_id: str):
    if not delete_yaml('layouts', layout_id):
        raise HTTPException(status_code=404, detail=f"Layout with ID '{layout_id}' not found.")
    return None

# --- View API Endpoints (for standalone/reusable views) ---
@app.post("/api/view", response_model=ViewConfig, status_code=201)
async def create_view(view: ViewConfig):
    if load_yaml('views', view.id, ViewConfig) is not None:
        raise HTTPException(status_code=400, detail=f"View with ID '{view.id}' already exists.")
    save_yaml('views', view.id, view)
    return view

@app.get("/api/view/{view_id}", response_model=ViewConfig)
async def get_view(view_id: str):
    view = load_yaml('views', view_id, ViewConfig)
    if view is not None:
        return view
    # Check embedded views (as before)
    all_layouts = load_all_yaml('layouts', LayoutConfig)
    for layout_config in all_layouts: # Renamed to avoid conflict
        for pane in layout_config.panes:
            if pane.view and pane.view.id == view_id:
                return pane.view.model_copy(deep=True)
    raise HTTPException(status_code=404, detail=f"View with ID '{view_id}' not found as standalone or embedded.")

@app.delete("/api/view/{view_id}", status_code=204)
async def remove_view(view_id: str):
    if not delete_yaml('views', view_id):
        raise HTTPException(status_code=404, detail=f"Standalone view with ID '{view_id}' not found.")
    return None

# --- Module API Endpoints ---
@app.post("/api/module", response_model=ModuleConfig, status_code=201)
async def create_module(module: ModuleConfig):
    # Check if the referenced layout exists
    if load_yaml('layouts', module.layout_id, LayoutConfig) is None:
        raise HTTPException(status_code=404, detail=f"Layout with ID '{module.layout_id}' referenced by module '{module.id}' not found.")
    if load_yaml('modules', module.id, ModuleConfig) is not None:
        raise HTTPException(status_code=400, detail=f"Module with ID '{module.id}' already exists.")
    save_yaml('modules', module.id, module)
    return module

@app.get("/api/module/{module_id}", response_model=ModuleConfig)
async def get_module(module_id: str):
    module = load_yaml('modules', module_id, ModuleConfig)
    if module is None:
        raise HTTPException(status_code=404, detail=f"Module with ID '{module_id}' not found.")
    return module

@app.get("/api/modules", response_model=List[ModuleConfig])
async def get_all_modules():
    return load_all_yaml('modules', ModuleConfig)

@app.delete("/api/module/{module_id}", status_code=204)
async def remove_module(module_id: str):
    if not delete_yaml('modules', module_id):
        raise HTTPException(status_code=404, detail=f"Module with ID '{module_id}' not found.")
    return None

# --- Utility Endpoints ---
@app.get("/")
async def root():
    return {"message": "Welcome to Ink-UI Backend (YAML Edition with Modules). See /docs for API documentation."}

@app.delete("/api/clear_all_data", status_code=204)
async def clear_all_data_endpoint():
    clear_yaml_type('layouts')
    clear_yaml_type('views')
    clear_yaml_type('modules')
    return None
