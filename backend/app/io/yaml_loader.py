import yaml
import os
from pathlib import Path
from typing import Dict, Any, List, TypeVar, Type
from pydantic import BaseModel

# Define a base path for where YAML files will be stored.
# ../inkstone_data relative to the location of yaml_loader.py (backend/app/io)
# So, this should point to the project_root/inkstone_data
DATA_BASE_PATH = Path(__file__).resolve().parent.parent.parent / "inkstone_data"

T = TypeVar('T', bound=BaseModel)

def get_path_for_type(data_type_name: str, data_id: str) -> Path:
    """Constructs a file path for a given data type and ID."""
    # data_type_name will be 'layouts', 'views', 'modules'
    # data_id will be the filename (e.g., 'my_layout.yaml')
    type_path = DATA_BASE_PATH / data_type_name
    type_path.mkdir(parents=True, exist_ok=True) # Ensure directory exists

    # Ensure data_id is a safe filename
    # If data_id already ends with .yaml, sanitize the base name part. Otherwise, sanitize the whole data_id.
    if data_id.lower().endswith('.yaml'):
        base_name_to_sanitize = data_id[:-5] # Remove .yaml suffix for sanitization
        extension = data_id[-5:] # Preserve original .yaml casing if desired, or just use ".yaml"
    else:
        base_name_to_sanitize = data_id
        extension = ".yaml"

    sanitized_base_name = "".join(c if c.isalnum() or c in ('_', '-') else '_' for c in base_name_to_sanitize)
    safe_filename = sanitized_base_name + extension

    return type_path / safe_filename

def save_yaml(data_type_name: str, data_id: str, data: BaseModel) -> None:
    """Saves a Pydantic model instance to a YAML file."""
    file_path = get_path_for_type(data_type_name, data_id)
    try:
        with open(file_path, 'w') as f:
            yaml.dump(data.model_dump(), f, sort_keys=False, indent=2)
    except IOError as e:
        # Handle exceptions (e.g., log them, raise custom exception)
        print(f"Error saving YAML file {file_path}: {e}") # Replace with proper logging
        raise

def load_yaml(data_type_name: str, data_id: str, model_class: Type[T]) -> T | None:
    """Loads data from a YAML file and parses it into a Pydantic model instance."""
    file_path = get_path_for_type(data_type_name, data_id)
    if not file_path.exists():
        return None
    try:
        with open(file_path, 'r') as f:
            content = yaml.safe_load(f)
            if content is None: # File is empty
                return None
            return model_class(**content)
    except (IOError, yaml.YAMLError, TypeError, ValueError) as e: # Added ValueError for Pydantic validation
        print(f"Error loading or parsing YAML file {file_path}: {e}") # Replace with proper logging
        # Consider re-raising or returning a specific error indicator
        return None # Or raise custom exception

def load_all_yaml(data_type_name: str, model_class: Type[T]) -> List[T]:
    """Loads all YAML files from a given data type directory."""
    type_path = DATA_BASE_PATH / data_type_name
    if not type_path.exists():
        return []

    items: List[T] = []
    for file_path in type_path.glob('*.yaml'):
        try:
            with open(file_path, 'r') as f:
                content = yaml.safe_load(f)
                if content: # Ensure content is not None
                    items.append(model_class(**content))
        except (IOError, yaml.YAMLError, TypeError, ValueError) as e: # Added ValueError
            print(f"Error loading or parsing YAML file {file_path}: {e}") # Replace
            # Optionally skip problematic files or handle error differently
    return items

def delete_yaml(data_type_name: str, data_id: str) -> bool:
    """Deletes a specific YAML file."""
    file_path = get_path_for_type(data_type_name, data_id)
    if file_path.exists():
        try:
            os.remove(file_path)
            return True
        except OSError as e:
            print(f"Error deleting YAML file {file_path}: {e}") # Replace
            return False
    return False

def clear_all_yaml_data(data_type_name: str) -> None:
    """Deletes all YAML files in a given data type directory."""
    type_path = DATA_BASE_PATH / data_type_name
    if not type_path.exists():
        return

    for file_path in type_path.glob('*.yaml'):
        try:
            os.remove(file_path)
        except OSError as e:
            print(f"Error deleting file {file_path}: {e}")
    # Optionally, remove the directory itself if it's empty
    # if not any(type_path.iterdir()):
    #     os.rmdir(type_path)
