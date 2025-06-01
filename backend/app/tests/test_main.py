import pytest
from httpx import AsyncClient
from fastapi import FastAPI

# Import the app from main.py.
# To make this work, ensure your PYTHONPATH is set up correctly when running pytest,
# or structure your project so that 'app' is a discoverable package.
# For simplicity in this script, we might need to adjust how 'app' is imported
# if main.py is not in a package recognized by pytest.
# One common way: add backend/ to PYTHONPATH or run pytest from backend/
from app.main import app  # Direct import for now
import pytest_asyncio # Import the new decorator
from httpx import ASGITransport # Import ASGITransport

# Fixture to provide an AsyncClient for making requests to the app
@pytest_asyncio.fixture(scope="function") # function scope to clear data for each test
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://127.0.0.1:8000") as ac: # Use ASGITransport
        await ac.delete("/api/clear_all_data") # Clear data via endpoint
        yield ac
        await ac.delete("/api/clear_all_data") # Clear data via endpoint


@pytest.mark.asyncio
async def test_root(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Ink-UI Backend (YAML Edition with Modules). See /docs for API documentation."}

@pytest.mark.asyncio
async def test_create_and_get_layout(client: AsyncClient):
    layout_data = {
        "id": "testLayout1",
        "direction": "horizontal",
        "panes": [
            {"id": "paneA", "size": 50, "view": {"id": "viewA", "type": "text", "content": "Hello"}},
            {"id": "paneB", "size": 50}
        ]
    }
    # Create layout
    response_create = await client.post("/api/layout", json=layout_data)
    assert response_create.status_code == 201
    created_layout = response_create.json()
    assert created_layout["id"] == "testLayout1"
    assert created_layout["panes"][0]["view"]["content"] == "Hello"

    # Get layout
    response_get = await client.get(f"/api/layout/{layout_data['id']}")
    assert response_get.status_code == 200
    fetched_layout = response_get.json()
    assert fetched_layout == created_layout

    # Try to create duplicate layout
    response_duplicate = await client.post("/api/layout", json=layout_data)
    assert response_duplicate.status_code == 400

@pytest.mark.asyncio
async def test_get_nonexistent_layout(client: AsyncClient):
    response = await client.get("/api/layout/nonexistentLayout")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_all_layouts(client: AsyncClient):
    layout_data1 = {"id": "layout1", "direction": "vertical", "panes": []}
    layout_data2 = {"id": "layout2", "direction": "horizontal", "panes": []}

    await client.post("/api/layout", json=layout_data1)
    await client.post("/api/layout", json=layout_data2)

    response = await client.get("/api/layouts")
    assert response.status_code == 200
    layouts = response.json()
    assert len(layouts) == 2
    assert layouts[0]["id"] in ["layout1", "layout2"]
    assert layouts[1]["id"] in ["layout1", "layout2"]


@pytest.mark.asyncio
async def test_create_and_get_view(client: AsyncClient):
    view_data = {"id": "testView1", "type": "html", "content": "<p>Hi</p>"}

    # Create view
    response_create = await client.post("/api/view", json=view_data)
    assert response_create.status_code == 201
    created_view = response_create.json()
    assert created_view["id"] == "testView1"

    # Get view
    response_get = await client.get(f"/api/view/{view_data['id']}")
    assert response_get.status_code == 200
    assert response_get.json() == created_view

    # Try to create duplicate view
    response_duplicate = await client.post("/api/view", json=view_data)
    assert response_duplicate.status_code == 400

@pytest.mark.asyncio
async def test_get_view_embedded_in_layout(client: AsyncClient):
    layout_data = {
        "id": "layoutWithView",
        "direction": "horizontal",
        "panes": [
            {"id": "paneC", "size": 100, "view": {"id": "embeddedView", "type": "text", "content": "Embedded"}}
        ]
    }
    await client.post("/api/layout", json=layout_data)

    response_get_view = await client.get("/api/view/embeddedView")
    assert response_get_view.status_code == 200
    fetched_view = response_get_view.json()
    assert fetched_view["id"] == "embeddedView"
    assert fetched_view["content"] == "Embedded"


@pytest.mark.asyncio
async def test_get_nonexistent_view(client: AsyncClient):
    response = await client.get("/api/view/nonexistentView")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_clear_data_endpoint(client: AsyncClient):
    layout_data = {"id": "layoutToClear", "direction": "horizontal", "panes": []}
    await client.post("/api/layout", json=layout_data)

    response_get_before_clear = await client.get("/api/layout/layoutToClear")
    assert response_get_before_clear.status_code == 200 # Exists

    response_clear = await client.delete("/api/clear_all_data")
    assert response_clear.status_code == 204

    response_get_after_clear = await client.get("/api/layout/layoutToClear")
    assert response_get_after_clear.status_code == 404 # Should not exist

    # Verify db_layouts and db_views are empty in the actual app module after clearing
    # This is a bit of white-box testing but good for sanity check

# --- Module Tests ---
@pytest.mark.asyncio
async def test_create_and_get_module(client: AsyncClient):
    # First, create a layout that the module can reference
    layout_data = {
        "id": "moduleLayout1",
        "direction": "horizontal",
        "panes": [{"id": "p1", "size": 100, "view": {"id": "v1", "type": "text", "content": "Module View"}}]
    }
    response_layout = await client.post("/api/layout", json=layout_data)
    assert response_layout.status_code == 201

    module_data = {
        "id": "testModule1",
        "name": "Test Module One",
        "layout_id": "moduleLayout1",
        "icon": "mdi-test",
        "description": "A test module"
    }
    # Create module
    response_create = await client.post("/api/module", json=module_data)
    assert response_create.status_code == 201
    created_module = response_create.json()
    assert created_module["id"] == "testModule1"
    assert created_module["name"] == "Test Module One"
    assert created_module["layout_id"] == "moduleLayout1"

    # Get module
    response_get = await client.get(f"/api/module/{module_data['id']}")
    assert response_get.status_code == 200
    fetched_module = response_get.json()
    assert fetched_module == created_module

    # Try to create duplicate module
    response_duplicate = await client.post("/api/module", json=module_data)
    assert response_duplicate.status_code == 400

@pytest.mark.asyncio
async def test_create_module_with_nonexistent_layout(client: AsyncClient):
    module_data = {
        "id": "testModuleBadLayout",
        "name": "Bad Layout Module",
        "layout_id": "nonexistentLayoutId"
    }
    response_create = await client.post("/api/module", json=module_data)
    assert response_create.status_code == 404 # Layout not found

@pytest.mark.asyncio
async def test_get_nonexistent_module(client: AsyncClient):
    response = await client.get("/api/module/nonexistentModule")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_all_modules(client: AsyncClient):
    # Create a layout first
    layout_data = {"id": "modLayoutForAll", "direction": "vertical", "panes": []}
    await client.post("/api/layout", json=layout_data)

    module_data1 = {"id": "moduleA", "name": "Module A", "layout_id": "modLayoutForAll"}
    module_data2 = {"id": "moduleB", "name": "Module B", "layout_id": "modLayoutForAll"}

    await client.post("/api/module", json=module_data1)
    await client.post("/api/module", json=module_data2)

    response = await client.get("/api/modules")
    assert response.status_code == 200
    modules = response.json()
    assert len(modules) == 2
    module_ids = {m["id"] for m in modules}
    assert "moduleA" in module_ids
    assert "moduleB" in module_ids

@pytest.mark.asyncio
async def test_remove_module(client: AsyncClient):
    # Create layout and module
    layout_data = {"id": "layoutForDeleteMod", "direction": "horizontal", "panes": []}
    await client.post("/api/layout", json=layout_data)
    module_data = {"id": "moduleToDelete", "name": "To Delete", "layout_id": "layoutForDeleteMod"}
    await client.post("/api/module", json=module_data)

    # Verify it exists
    response_get = await client.get("/api/module/moduleToDelete")
    assert response_get.status_code == 200

    # Delete module
    response_delete = await client.delete("/api/module/moduleToDelete")
    assert response_delete.status_code == 204

    # Verify it's gone
    response_get_after_delete = await client.get("/api/module/moduleToDelete")
    assert response_get_after_delete.status_code == 404

    # Try to delete non-existent module
    response_delete_nonexistent = await client.delete("/api/module/nonexistentModuleForDelete")
    assert response_delete_nonexistent.status_code == 404
