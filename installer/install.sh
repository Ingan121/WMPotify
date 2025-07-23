#!/bin/sh

set -e

# Function to print error messages
print_error() {
    echo "$1" >&2
}

# Function to download the latest versions information
get_latest_versions() {
    latest_versions_url="https://www.ingan121.com/wmpotify/latest.txt"
    latest_versions=$(curl -s "$latest_versions_url")
    if [ -z "$latest_versions" ]; then
        print_error "Failed to download the latest versions information."
        exit 1
    fi

    theme_version=$(echo "$latest_versions" | grep 'wmpotify_new\s*=' | awk -F '=' '{print $2}' | tr -d ' ')
    vis_version=$(echo "$latest_versions" | grep 'wmpvis_new\s*=' | awk -F '=' '{print $2}' | tr -d ' ')

    echo "$theme_version" "$vis_version"
}

# Function to download and extract a zip file
download_and_extract() {
    url="$1"
    dest_dir="$2"
    temp_zip=$(mktemp)

    echo "Downloading $url..."
    curl -L -o "$temp_zip" "$url"
    echo "Extracting $temp_zip to $dest_dir..."
    mkdir -p "$dest_dir"
    unzip -o "$temp_zip" -d "$dest_dir"
    rm "$temp_zip"
}

print_hello() {
    echo "WMPotify for Spicetify Installer"
    echo "Made by Ingan121"
    echo
    echo "https://github.com/Ignan121/WMPotify"
    echo "(Mostly) licensed under the MIT License"
    echo
}

# Main script
main() {
    print_hello

    if ! command -v spicetify >/dev/null 2>&1; then
        echo "spicetify could not be found. Please install spicetify first."
        exit 1
    fi

    spicetify_path=$(dirname "$(spicetify -c)")
    theme_path="$spicetify_path/Themes/WMPotify"
    vis_app_path="$spicetify_path/CustomApps/wmpvis"

    # Get the latest versions
    versions=$(get_latest_versions)
    theme_version=$(echo "$versions" | awk '{print $1}')
    vis_version=$(echo "$versions" | awk '{print $2}')

    if [ -n "$SKIP_THEME" ]; then
        echo "Skipping theme installation as SKIP_THEME is set."
    else
        # Download and install WMPotify theme
        theme_url="https://github.com/Ingan121/WMPotify/releases/download/$theme_version/WMPotify-$theme_version.zip"
        download_and_extract "$theme_url" "$theme_path"

        spicetify config inject_css 1 replace_colors 1 overwrite_assets 1 inject_theme_js 1
        spicetify config current_theme WMPotify
        spicetify config color_scheme aero
    fi

    # Download and install WMPotify NowPlaying app
    vis_url="https://github.com/Ingan121/WMPotify/releases/download/$vis_version/WMPotify-NowPlaying-$vis_version.zip"
    download_and_extract "$vis_url" "$vis_app_path"

    spicetify config custom_apps wmpvis
    spicetify apply

    echo "Done!"
    echo
    echo "Thanks for using WMPotify!"
    echo

    export SKIP_THEME=
}

main "$@"