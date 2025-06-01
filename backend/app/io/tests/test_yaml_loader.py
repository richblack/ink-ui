import pytest
import yaml
from pathlib import Path
from pydantic import BaseModel
from typing import List

from app.io.yaml_loader import (
    save_yaml,
    load_yaml,
    load_all_yaml,
    delete_yaml,
    clear_all_yaml_data,
    DATA_BASE_PATH,
    get_path_for_type
)

# Define a simple Pydantic model for testing
class TestItem(BaseModel):
    id: str
    value: str
    tags: List[str] = []

# Fixture to manage test data directory
@pytest.fixture(autouse=True)
def manage_test_data_files():
    # Ensure directories exist before tests
    (DATA_BASE_PATH / 'test_items').mkdir(parents=True, exist_ok=True)
    (DATA_BASE_PATH / 'empty_items').mkdir(parents=True, exist_ok=True)
    yield
    # Teardown: Clean up test files and directories after tests
    clear_all_yaml_data('test_items')
    clear_all_yaml_data('empty_items')
    # Attempt to remove directories if they are empty
    try:
        (DATA_BASE_PATH / 'test_items').rmdir()
    except OSError:
        pass # Directory not empty or other issue
    try:
        (DATA_BASE_PATH / 'empty_items').rmdir()
    except OSError:
        pass

def test_get_path_for_type_safety():
    assert get_path_for_type("test", "item1").name == "item1.yaml"
    assert get_path_for_type("test", "item1.yaml").name == "item1.yaml"
    assert get_path_for_type("test", "../../../etc/passwd").name == "_________etc_passwd.yaml"
    assert get_path_for_type("test", "item/one").name == "item_one.yaml"


def test_save_and_load_yaml():
    item_id = "test_item_1"
    data_type = "test_items"
    item_data = TestItem(id=item_id, value="Test Value 1", tags=["a", "b"])

    save_yaml(data_type, item_id, item_data)

    loaded_item = load_yaml(data_type, item_id, TestItem)
    assert loaded_item is not None
    assert loaded_item.id == item_id
    assert loaded_item.value == "Test Value 1"
    assert loaded_item.tags == ["a", "b"]

    # Check file content
    file_path = get_path_for_type(data_type, item_id)
    with open(file_path, 'r') as f:
        content = yaml.safe_load(f)
    assert content['id'] == item_id
    assert content['value'] == "Test Value 1"


def test_load_nonexistent_yaml():
    loaded_item = load_yaml("test_items", "nonexistent_item", TestItem)
    assert loaded_item is None

def test_load_all_yaml():
    data_type = "test_items"
    item1 = TestItem(id="all_item1", value="Value 1")
    item2 = TestItem(id="all_item2", value="Value 2")

    save_yaml(data_type, item1.id, item1)
    save_yaml(data_type, item2.id, item2)

    # Create a problematic file (e.g. malformed YAML)
    malformed_file_path = get_path_for_type(data_type, "malformed_item")
    with open(malformed_file_path, 'w') as f:
        f.write("id: malformed\nvalue: [invalid yaml") # Corrected newline for valid YAML structure before invalid part

    # Create an empty yaml file
    empty_file_path = get_path_for_type(data_type, "empty_item")
    with open(empty_file_path, 'w') as f:
        f.write("") # Empty content

    loaded_items = load_all_yaml(data_type, TestItem)
    assert len(loaded_items) == 2 # Malformed and empty should be skipped gracefully

    loaded_ids = {item.id for item in loaded_items}
    assert "all_item1" in loaded_ids
    assert "all_item2" in loaded_ids

def test_load_all_yaml_empty_dir():
    items = load_all_yaml("empty_items", TestItem)
    assert len(items) == 0


def test_delete_yaml():
    data_type = "test_items"
    item_id = "delete_me"
    item_data = TestItem(id=item_id, value="To be deleted")

    save_yaml(data_type, item_id, item_data)
    assert load_yaml(data_type, item_id, TestItem) is not None # verify save

    assert delete_yaml(data_type, item_id) is True
    assert load_yaml(data_type, item_id, TestItem) is None

    assert delete_yaml(data_type, "nonexistent_to_delete") is False


def test_clear_all_yaml_data():
    data_type = "test_items"
    save_yaml(data_type, "clear1", TestItem(id="clear1", value="V1"))
    save_yaml(data_type, "clear2", TestItem(id="clear2", value="V2"))

    assert len(load_all_yaml(data_type, TestItem)) == 2

    clear_all_yaml_data(data_type)
    assert len(load_all_yaml(data_type, TestItem)) == 0

    # Check if directory still exists (it should, but be empty)
    type_path = DATA_BASE_PATH / data_type
    assert type_path.exists()
    assert not any(type_path.glob('*.yaml'))

def test_load_empty_yaml_file():
    data_type = "test_items"
    item_id = "empty_file_item"
    file_path = get_path_for_type(data_type, item_id)
    with open(file_path, 'w') as f:
        f.write("") # Completely empty file

    loaded_item = load_yaml(data_type, item_id, TestItem)
    assert loaded_item is None, "Loading an empty YAML file should result in None"

def test_load_yaml_with_invalid_content_for_model():
    data_type = "test_items"
    item_id = "invalid_model_content"
    file_path = get_path_for_type(data_type, item_id)
    with open(file_path, 'w') as f:
        # Valid YAML, but does not match TestItem model (e.g., missing 'id' or 'value')
        yaml.dump({"name": "some name", "age": 30}, f)

    loaded_item = load_yaml(data_type, item_id, TestItem)
    # Pydantic validation error (TypeError) should be caught by load_yaml and return None
    assert loaded_item is None, "Loading YAML with content not matching model should result in None"
