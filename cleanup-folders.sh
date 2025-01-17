#!/bin/bash

# Function to log skipped folders or errors
log_skipped() {
  echo "SKIPPED --- $1" >&2
}

# Function to delete folders
delete_folder() {
  local folder_path="$1"
  if rm -rf "$folder_path"; then
    echo "DELETED --- Folder '$folder_path' and its contents have been deleted."
  else
    echo "ERROR --- Failed to delete folder '$folder_path'."
  fi
}

# Function to find old folders
find_old_folders() {
  local retention_days="$1"
  local directory="$2"
  local current_date
  current_date=$(date -u +%s)
  echo "Checking folder..." >&2
  for folder in "$directory"/*/; do
    folder_name=$(basename "$folder")
    if [[ "$folder_name" =~ ^[0-9]{8}_[0-9]{6}Z$ ]]; then
      # Convert "20250105_083251Z" to "2025-01-05 08:32:51"
      folder_date="${folder_name:0:4}-${folder_name:4:2}-${folder_name:6:2} ${folder_name:9:2}:${folder_name:11:2}:${folder_name:13:2}"
      
      # Convert the formatted date to epoch time
      folder_date_epoch=$(gdate -u -d "$folder_date" +%s 2>/dev/null)
      
      if [[ $? -ne 0 || -z "$folder_date_epoch" ]]; then
        log_skipped "Error parsing timestamp for folder '$folder_name'. It will not be deleted."
        continue
      fi

      # Calculate the age in days
      age_days=$(( (current_date - folder_date_epoch) / 86400 ))
      if (( age_days > retention_days )); then
        echo "$folder_name"  # Output only folders eligible for deletion
      else
        log_skipped "Folder '$folder_name' is not older than $retention_days days. It will not be deleted."
      fi
    else
      log_skipped "Found folder/file with name '$folder_name' that does not match the expected timestamp format. It will not be deleted."
    fi
  done
}

# Main script logic
main() {
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --retention-days)
        retention_days="$2"
        shift 2
        ;;
      --folder-name)
        folder_name="$2"
        shift 2
        ;;
      *)
        echo "Usage: $0 --retention-days <days> --folder-name <directory>"
        exit 1
        ;;
    esac
  done

  # Validate arguments
  if [[ -z "$retention_days" || -z "$folder_name" ]]; then
    echo "Usage: $0 --retention-days <days> --folder-name <directory>"
    exit 1
  fi

  if [[ ! -d "$folder_name" ]]; then
    echo "Error: Directory '$folder_name' does not exist."
    exit 1
  fi

  # Find old folders and delete them
  old_folders=$(find_old_folders "$retention_days" "$folder_name")
  echo "Old folders found: $old_folders" >&2
  for folder in $old_folders; do
    delete_folder "$folder_name/$folder"
  done
}

# Run the script
main "$@"
